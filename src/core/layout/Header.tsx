import Link from 'next/link'
import { UserNav } from './UserNav'
import { NavLinks } from './NavLinks'

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
          <Link href="/" className="font-semibold text-lg tracking-tight">
            Geotherm
          </Link>
          <a
            href="https://www.vencly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground font-normal text-sm hover:text-foreground transition-colors"
          >
            by Vencly
          </a>
          {process.env.NEXT_PUBLIC_APP_VERSION && (
            <span className="font-mono text-[10px] text-muted-foreground/50 tabular-nums leading-none">
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </span>
          )}
        </div>
        <nav aria-label="Hauptnavigation" className="flex items-center gap-2">
          <NavLinks />
          <UserNav />
        </nav>
      </div>
    </header>
  )
}
