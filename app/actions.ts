"use server"

import JSZip from "jszip"
import {
  ensureRepo,
  getAuthenticatedUser,
  pushFiles,
  type GithubFile,
} from "@/lib/github"

export type DeployState = {
  status: "idle" | "success" | "error"
  message: string
  commitUrl?: string
  fileCount?: number
  repoFullName?: string
}

const IGNORED = (path: string) =>
  path.startsWith("__MACOSX/") ||
  path.split("/").some((seg) => seg === ".DS_Store" || seg === ".git")

export async function deployZip(
  _prev: DeployState,
  formData: FormData,
): Promise<DeployState> {
  try {
    const token = String(formData.get("token") || "").trim()
    const repoInput = String(formData.get("repo") || "").trim()
    const branch = String(formData.get("branch") || "main").trim() || "main"
    const commitMessage =
      String(formData.get("message") || "").trim() ||
      "Deploy from ZIP via v0 uploader"
    const createIfMissing = formData.get("createIfMissing") === "on"
    const isPrivate = formData.get("isPrivate") === "on"
    const stripRoot = formData.get("stripRoot") === "on"
    const file = formData.get("file")

    if (!token) return { status: "error", message: "Token GitHub manquant." }
    if (!repoInput)
      return { status: "error", message: "Dépôt manquant (format: owner/repo)." }
    if (!(file instanceof File) || file.size === 0)
      return { status: "error", message: "Aucun fichier ZIP fourni." }

    // Parse owner/repo. Allow "repo" alone (defaults to authenticated user).
    let owner = ""
    let repo = ""
    if (repoInput.includes("/")) {
      const [o, r] = repoInput.split("/")
      owner = o.trim()
      repo = r.trim()
    } else {
      repo = repoInput
    }
    repo = repo.replace(/\.git$/, "")

    // Authenticate and resolve owner default.
    const user = await getAuthenticatedUser(token)
    if (!owner) owner = user.login

    // Read and unzip.
    const buffer = Buffer.from(await file.arrayBuffer())
    let zip: JSZip
    try {
      zip = await JSZip.loadAsync(buffer)
    } catch {
      return {
        status: "error",
        message: "Le fichier fourni n'est pas un ZIP valide.",
      }
    }

    const entries = Object.values(zip.files).filter(
      (e) => !e.dir && !IGNORED(e.name),
    )

    if (entries.length === 0)
      return { status: "error", message: "Le ZIP ne contient aucun fichier." }

    // Optionally strip a single common top-level folder (common when zipping a folder).
    let prefixToStrip = ""
    if (stripRoot) {
      const tops = new Set(
        entries.map((e) => e.name.split("/")[0]).filter(Boolean),
      )
      const hasNestedPaths = entries.every((e) => e.name.includes("/"))
      if (tops.size === 1 && hasNestedPaths) {
        prefixToStrip = [...tops][0] + "/"
      }
    }

    const files: GithubFile[] = []
    for (const entry of entries) {
      const data = await entry.async("base64")
      let path = entry.name
      if (prefixToStrip && path.startsWith(prefixToStrip)) {
        path = path.slice(prefixToStrip.length)
      }
      path = path.replace(/^\/+/, "")
      if (!path) continue
      files.push({ path, contentBase64: data })
    }

    const { defaultBranch, created } = await ensureRepo({
      token,
      owner,
      repo,
      authedLogin: user.login,
      createIfMissing,
      isPrivate,
    })

    const targetBranch = branch || defaultBranch || "main"

    const result = await pushFiles({
      token,
      owner,
      repo,
      branch: targetBranch,
      message: commitMessage,
      files,
    })

    return {
      status: "success",
      message: `${result.fileCount} fichier(s) envoyé(s) sur ${owner}/${repo}@${targetBranch}${
        created ? " (dépôt créé)" : ""
      }.`,
      commitUrl: result.commitUrl,
      fileCount: result.fileCount,
      repoFullName: `${owner}/${repo}`,
    }
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Une erreur est survenue.",
    }
  }
}
