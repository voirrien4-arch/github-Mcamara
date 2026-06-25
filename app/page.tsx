import Link from "next/link"
import { FolderGit2, Info, MessageCircle } from "lucide-react"
import { DeployForm } from "@/components/deploy-form"
import { Button } from "@/components/ui/button"

const WHATSAPP_CHANNEL =
  "https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T"

export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-6 sm:py-10">
      <nav className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FolderGit2 className="size-4" aria-hidden="true" />
          </span>
          ZIP vers GitHub
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/infos">
              <Info className="size-4" />
              Infos
            </Link>
          </Button>
          <Button asChild size="sm">
            <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />
              Rejoindre ma chaîne
            </a>
          </Button>
        </div>
      </nav>

      <header className="mb-8 flex flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <FolderGit2 className="size-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight">
            ZIP vers GitHub
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Dépose un fichier ZIP, il est automatiquement décompressé et son
            contenu est envoyé dans le dépôt GitHub de ton choix — en un seul
            commit.
          </p>
        </div>
      </header>

      <DeployForm />

      <footer className="mt-10 flex flex-col items-center gap-3 text-center text-xs text-muted-foreground">
        <p>
          Ton token et tes fichiers transitent uniquement vers GitHub et ne
          sont jamais stockés.
        </p>
        <p className="flex flex-wrap items-center justify-center gap-1.5">
          <span>
            Créé par <span className="font-medium text-foreground">Mcamara</span>
          </span>
          <span aria-hidden="true">·</span>
          <a
            href={WHATSAPP_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Chaîne WhatsApp officielle
          </a>
          <span aria-hidden="true">·</span>
          <Link
            href="/infos"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Comment obtenir un token ?
          </Link>
        </p>
      </footer>
    </main>
  )
}
