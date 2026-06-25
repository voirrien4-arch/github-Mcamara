"use client"

import { useActionState, useState } from "react"
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FolderGit2,
  Loader2,
  XCircle,
} from "lucide-react"
import { deployZip, type DeployState } from "@/app/actions"
import { ZipDropzone } from "@/components/zip-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const initialState: DeployState = { status: "idle", message: "" }

function Checkbox({
  id,
  name,
  label,
  defaultChecked,
  hint,
}: {
  id: string
  name: string
  label: string
  defaultChecked?: boolean
  hint?: string
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-primary"
      />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {hint && (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        )}
      </span>
    </label>
  )
}

export function DeployForm() {
  const [state, formAction, pending] = useActionState(deployZip, initialState)
  const [file, setFile] = useState<File | null>(null)
  const [showToken, setShowToken] = useState(false)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Fichier ZIP</CardTitle>
          <CardDescription>
            Le contenu sera décompressé et envoyé sur GitHub.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ZipDropzone file={file} onFileChange={setFile} disabled={pending} />
          {/* Bind the selected file to the form */}
          <input
            type="file"
            name="file"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            ref={(el) => {
              if (el && file) {
                const dt = new DataTransfer()
                dt.items.add(file)
                el.files = dt.files
              }
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Destination GitHub</CardTitle>
          <CardDescription>
            Indique ton token et le dépôt cible.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="token">Token d&apos;accès personnel (PAT)</Label>
            <div className="relative">
              <Input
                id="token"
                name="token"
                type={showToken ? "text" : "password"}
                placeholder="ghp_xxxxxxxxxxxxxxxx"
                autoComplete="off"
                spellCheck={false}
                className="pr-10 font-mono"
                disabled={pending}
              />
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                aria-label={showToken ? "Masquer le token" : "Afficher le token"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Crée un token avec la permission <code>repo</code> sur{" "}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                github.com/settings/tokens
              </a>
              . Il n&apos;est jamais stocké.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="repo">Dépôt</Label>
              <Input
                id="repo"
                name="repo"
                placeholder="owner/mon-depot"
                autoComplete="off"
                spellCheck={false}
                disabled={pending}
              />
              <p className="text-xs text-muted-foreground">
                Format <code>owner/repo</code>, ou juste <code>repo</code>.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branche</Label>
              <Input
                id="branch"
                name="branch"
                placeholder="main"
                defaultValue="main"
                autoComplete="off"
                spellCheck={false}
                disabled={pending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message de commit</Label>
            <Input
              id="message"
              name="message"
              placeholder="Deploy from ZIP via v0 uploader"
              autoComplete="off"
              disabled={pending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Options</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Checkbox
            id="createIfMissing"
            name="createIfMissing"
            label="Créer si absent"
            hint="Crée le dépôt s'il n'existe pas (sur ton compte)."
            defaultChecked
          />
          <Checkbox
            id="stripRoot"
            name="stripRoot"
            label="Retirer le dossier racine"
            hint="Si le ZIP contient un seul dossier racine, l'ignorer."
            defaultChecked
          />
          <Checkbox
            id="isPrivate"
            name="isPrivate"
            label="Dépôt privé"
            hint="Si un nouveau dépôt est créé, le rendre privé."
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={pending || !file}
          className="w-full"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Envoi en cours…
            </>
          ) : (
            <>
              <FolderGit2 className="size-4" />
              Envoyer sur GitHub
            </>
          )}
        </Button>

        {state.status !== "idle" && (
          <div
            role="status"
            className={
              state.status === "success"
                ? "flex items-start gap-3 rounded-lg border border-border bg-card p-4"
                : "flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
            }
          >
            {state.status === "success" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-foreground" />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            )}
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">
                {state.status === "success" ? "Déploiement réussi" : "Échec"}
              </p>
              <p className="break-words text-sm text-muted-foreground">
                {state.message}
              </p>
              {state.commitUrl && (
                <a
                  href={state.commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-2"
                >
                  Voir le commit
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
