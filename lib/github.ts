const GITHUB_API = "https://api.github.com"

export type GithubFile = {
  path: string
  /** base64-encoded content */
  contentBase64: string
}

type GithubHeaders = Record<string, string>

function headers(token: string): GithubHeaders {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  }
}

async function gh<T>(
  token: string,
  path: string,
  init?: RequestInit & { allow404?: boolean; allow409?: boolean },
): Promise<T | null> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: { ...headers(token), ...(init?.headers as GithubHeaders) },
    cache: "no-store",
  })

  if (res.status === 404 && init?.allow404) return null
  // 409 sur la lecture d'une ref = dépôt vide (aucun commit) → pas de "head".
  if (res.status === 409 && init?.allow409) return null

  if (!res.ok) {
    let ghMessage = ""
    try {
      const body = (await res.json()) as { message?: string }
      ghMessage = body?.message || ""
    } catch {
      // ignore
    }

    // 402 = restriction de facturation GitHub (rien à voir avec ton ZIP).
    if (res.status === 402) {
      throw new Error(
        "Erreur 402 (Payment Required) renvoyée par GitHub : cette action est bloquée pour une raison de facturation. " +
          "Le plus souvent, c'est parce que tu essaies de créer/pousser un dépôt PRIVÉ alors que le compte ou l'organisation a atteint sa limite de dépôts privés, est sur un plan gratuit, ou a un paiement en attente. " +
          "Solution : décoche l'option « Dépôt privé » pour créer un dépôt public, ou vérifie la facturation du compte sur github.com/settings/billing." +
          (ghMessage ? ` (Détail GitHub : ${ghMessage})` : ""),
      )
    }

    if (res.status === 401) {
      throw new Error(
        "Erreur 401 : token GitHub invalide ou expiré. Vérifie que tu as collé un token valide.",
      )
    }

    if (res.status === 403) {
      throw new Error(
        "Erreur 403 : permissions insuffisantes. Ton token doit avoir la permission « repo » (ou « Contents: Read and write » pour un token fine-grained)." +
          (ghMessage ? ` (Détail GitHub : ${ghMessage})` : ""),
      )
    }

    throw new Error(
      `GitHub API ${res.status}${ghMessage ? ` - ${ghMessage}` : ""} (${path})`,
    )
  }

  if (res.status === 204) return null
  return (await res.json()) as T
}

/**
 * Right after the first commit on a freshly created repo, GitHub's Git Data
 * backend can still report "409 Git Repository is empty" for a few seconds
 * (replication lag). Retry such calls with a short backoff.
 */
async function withRetryOn409<T>(
  fn: () => Promise<T>,
  attempts = 8,
  delayMs = 1500,
): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      const isEmptyLag =
        msg.includes("Git Repository is empty") || msg.includes("API 409")
      if (isEmptyLag && i < attempts - 1) {
        lastErr = err
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }
      throw err
    }
  }
  throw lastErr
}

export async function getAuthenticatedUser(token: string) {
  const user = await gh<{ login: string }>(token, "/user")
  if (!user) throw new Error("Impossible de récupérer l'utilisateur GitHub.")
  return user
}

export async function ensureRepo(opts: {
  token: string
  owner: string
  repo: string
  authedLogin: string
  createIfMissing: boolean
  isPrivate: boolean
}): Promise<{ defaultBranch: string; created: boolean }> {
  const { token, owner, repo, authedLogin, createIfMissing, isPrivate } = opts

  const existing = await gh<{ default_branch: string }>(
    token,
    `/repos/${owner}/${repo}`,
    { allow404: true },
  )

  if (existing) {
    return { defaultBranch: existing.default_branch, created: false }
  }

  if (!createIfMissing) {
    throw new Error(`Le dépôt ${owner}/${repo} n'existe pas.`)
  }

  // Only allow creating repos under the authenticated user's account.
  if (owner.toLowerCase() !== authedLogin.toLowerCase()) {
    throw new Error(
      `Le dépôt ${owner}/${repo} n'existe pas et ne peut pas être créé sous le compte "${owner}".`,
    )
  }

  const created = await gh<{ default_branch: string }>(token, "/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name: repo,
      private: isPrivate,
      auto_init: false,
    }),
  })

  if (!created) throw new Error("La création du dépôt a échoué.")
  return { defaultBranch: created.default_branch || "main", created: true }
}

async function getBranchHead(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<{ commitSha: string; treeSha: string } | null> {
  const ref = await gh<{ object: { sha: string } }>(
    token,
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
    { allow404: true, allow409: true },
  )
  if (!ref) return null

  const commit = await gh<{ tree: { sha: string } }>(
    token,
    `/repos/${owner}/${repo}/git/commits/${ref.object.sha}`,
  )
  if (!commit) return null

  return { commitSha: ref.object.sha, treeSha: commit.tree.sha }
}

/**
 * The Git Data API (blobs/trees/commits) refuses to work on a repo with no
 * commits ("409 Git Repository is empty"). The Contents API, however, works on
 * an empty repo, so we use it to create the very first commit and bootstrap it.
 */
async function bootstrapEmptyRepo(opts: {
  token: string
  owner: string
  repo: string
  branch: string
  message: string
  file: GithubFile
}): Promise<{ commitSha: string; treeSha: string }> {
  const { token, owner, repo, branch, message, file } = opts

  const encodedPath = file.path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/")

  const res = await gh<{ commit: { sha: string; tree: { sha: string } } }>(
    token,
    `/repos/${owner}/${repo}/contents/${encodedPath}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: file.contentBase64,
        branch,
      }),
    },
  )

  if (!res?.commit) throw new Error("L'initialisation du dépôt vide a échoué.")
  return { commitSha: res.commit.sha, treeSha: res.commit.tree.sha }
}

/**
 * Pushes the given files to a branch as a single commit using the Git Data API.
 * Handles both empty (freshly created) repos and existing repos/branches.
 */
export async function pushFiles(opts: {
  token: string
  owner: string
  repo: string
  branch: string
  message: string
  files: GithubFile[]
}): Promise<{ commitUrl: string; commitSha: string; fileCount: number }> {
  const { token, owner, repo, branch, message, files } = opts

  if (files.length === 0) {
    throw new Error("Aucun fichier à envoyer (le ZIP est vide).")
  }

  let head = await getBranchHead(token, owner, repo, branch)

  // Empty repo: bootstrap the first commit via the Contents API, then push the
  // rest (if any) on top using the Git Data API.
  let filesToPush = files
  if (!head) {
    const boot = await bootstrapEmptyRepo({
      token,
      owner,
      repo,
      branch,
      message,
      file: files[0],
    })
    head = boot
    filesToPush = files.slice(1)

    // Only one file in the ZIP — the bootstrap commit already pushed it.
    if (filesToPush.length === 0) {
      return {
        commitUrl: `https://github.com/${owner}/${repo}/commit/${boot.commitSha}`,
        commitSha: boot.commitSha,
        fileCount: files.length,
      }
    }
  }

  // 1. Create a blob for each file.
  const treeItems: {
    path: string
    mode: "100644"
    type: "blob"
    sha: string
  }[] = []

  for (const file of filesToPush) {
    const blob = await withRetryOn409(() =>
      gh<{ sha: string }>(token, `/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({
          content: file.contentBase64,
          encoding: "base64",
        }),
      }),
    )
    if (!blob) throw new Error(`Échec de l'envoi du fichier: ${file.path}`)
    treeItems.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha })
  }

  // 2. Create a tree.
  const tree = await withRetryOn409(() =>
    gh<{ sha: string }>(token, `/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        ...(head ? { base_tree: head.treeSha } : {}),
        tree: treeItems,
      }),
    }),
  )
  if (!tree) throw new Error("La création de l'arborescence Git a échoué.")

  // 3. Create a commit.
  const commit = await gh<{ sha: string; html_url: string }>(
    token,
    `/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: tree.sha,
        parents: head ? [head.commitSha] : [],
      }),
    },
  )
  if (!commit) throw new Error("La création du commit a échoué.")

  // 4. Create or update the branch ref.
  if (head) {
    await gh(token, `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    })
  } else {
    await gh(token, `/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
    })
  }

  return {
    commitUrl: commit.html_url,
    commitSha: commit.sha,
    fileCount: files.length,
  }
}
