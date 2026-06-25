import Link from "next/link"
import {
  ArrowLeft,
  ExternalLink,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  UploadCloud,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const WHATSAPP_CHANNEL =
  "https://whatsapp.com/channel/0029Vb7Bk6jEVccC46JZL92T"

type Step = {
  title: string
  body: React.ReactNode
}

const classicTokenSteps: Step[] = [
  {
    title: "Ouvre les paramètres de token GitHub",
    body: (
      <>
        Connecte-toi à GitHub, puis va sur{" "}
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-2"
        >
          github.com/settings/tokens
        </a>
        . Tu peux aussi le retrouver via ta photo de profil → Settings →
        Developer settings → Personal access tokens.
      </>
    ),
  },
  {
    title: "Génère un nouveau token",
    body: (
      <>
        Clique sur <strong>« Generate new token »</strong> puis choisis{" "}
        <strong>« Tokens (classic) »</strong>. Donne-lui un nom parlant (ex.
        « ZIP vers GitHub ») et une date d&apos;expiration.
      </>
    ),
  },
  {
    title: "Coche la permission « repo »",
    body: (
      <>
        Dans la liste des scopes, coche la case <strong>repo</strong> (elle
        couvre la lecture et l&apos;écriture de tes dépôts). C&apos;est la seule
        permission nécessaire pour cet outil.
      </>
    ),
  },
  {
    title: "Copie le token",
    body: (
      <>
        Valide avec <strong>« Generate token »</strong>, puis copie la valeur
        affichée (elle commence par <code>ghp_</code>).{" "}
        <strong>
          Attention : GitHub ne te la montrera qu&apos;une seule fois.
        </strong>
      </>
    ),
  },
]

export default function InfosPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-6 sm:py-10">
      <nav className="mb-8 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Retour à l&apos;outil
          </Link>
        </Button>
        <Button asChild size="sm">
          <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" />
            Rejoindre ma chaîne
          </a>
        </Button>
      </nav>

      <header className="mb-8 flex flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <KeyRound className="size-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight">
            Comment obtenir ton token GitHub
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Un token d&apos;accès personnel (PAT) autorise l&apos;outil à créer
            des dépôts et à y envoyer tes fichiers, en ton nom. Voici comment en
            créer un, puis l&apos;ajouter ici.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Étape 1 — Créer le token (méthode « classic »)
            </CardTitle>
            <CardDescription>
              La méthode la plus simple, avec la permission « repo ».
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-5">
              {classicTokenSteps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {i + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {step.title}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6">
              <Button asChild variant="secondary" size="sm">
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Créer un token maintenant
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Étape 2 — Ajouter le token dans l&apos;outil
            </CardTitle>
            <CardDescription>
              Une fois le token copié, reviens sur la page principale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-5">
              <li className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                  1
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Colle le token dans le champ « Token d&apos;accès personnel »
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Dans la section « 2. Destination GitHub », colle la valeur
                    qui commence par <code>ghp_</code>. Tu peux cliquer sur
                    l&apos;icône œil pour vérifier ta saisie.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                  2
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Indique le dépôt cible
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Au format <code>owner/nom-du-depot</code>, ou simplement{" "}
                    <code>nom-du-depot</code> (ton compte sera utilisé par
                    défaut). Coche « Créer si absent » pour qu&apos;il soit créé
                    automatiquement.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                  3
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Dépose ton ZIP et envoie
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Glisse ton fichier ZIP, puis clique sur « Envoyer sur
                    GitHub ». Le contenu est décompressé et poussé en un seul
                    commit.
                  </p>
                </div>
              </li>
            </ol>
            <div className="mt-6">
              <Button asChild size="sm">
                <Link href="/">
                  <UploadCloud className="size-4" />
                  Aller à l&apos;outil
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" />
              Sécurité et bonnes pratiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                Ton token n&apos;est <strong>jamais stocké</strong> : il sert
                uniquement le temps d&apos;envoyer tes fichiers à GitHub.
              </li>
              <li>
                Donne une <strong>date d&apos;expiration</strong> à ton token et
                ne lui accorde que la permission <code>repo</code>.
              </li>
              <li>
                Ne partage jamais ton token. Si tu penses qu&apos;il a fuité,
                révoque-le immédiatement dans les paramètres GitHub.
              </li>
              <li>
                Pour créer un <strong>dépôt privé</strong>, ton compte doit le
                permettre. Sinon, laisse l&apos;option décochée pour un dépôt
                public.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        Créé par <span className="font-medium text-foreground">Mcamara</span>
      </footer>
    </main>
  )
}
