import Link from 'next/link'
import { UserNav } from './UserNav'
import { NavLinks } from './NavLinks'
import { MobileMenu } from './MobileMenu'

// Semver aus package.json (manuell für Major/Minor-Bumps)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version: appVersion } = require('../../../package.json') as { version: string }
// Git-SHA: auf Vercel automatisch bei jedem Deploy aktualisiert
const gitSha = process.env.NEXT_PUBLIC_GIT_SHA ?? ''
const buildLabel = gitSha ? `v${appVersion}+${gitSha}` : `v${appVersion}`

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
      {/* Skip-to-content für Tastatur- und Screen-Reader-Nutzer */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Zum Hauptinhalt springen
      </a>
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-baseline gap-2">
          <a
            href="https://www.vencly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Vencly – Website öffnen"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logovencly.svg"
              alt="Vencly"
              className="h-4 w-auto"
            />
          </a>
          <Link href="/" className="font-semibold text-lg tracking-tight">
            Geotherm
          </Link>
          <span className="font-mono text-[10px] text-muted-foreground/50 tabular-nums leading-none">
            {buildLabel}
          </span>
        </div>
        {/* Desktop-Navigation (ab md) */}
        <nav aria-label="Hauptnavigation" className="hidden md:flex items-center gap-2">
          <NavLinks />
          <UserNav />
        </nav>

        {/* Mobile-Navigation (bis md) */}
        <div className="flex items-center md:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
