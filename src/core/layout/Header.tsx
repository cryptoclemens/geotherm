import Link from 'next/link'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/ui/utils'

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
        <Link href="/" className="font-semibold text-lg tracking-tight flex items-baseline gap-2">
          Geotherm{' '}
          <span className="text-muted-foreground font-normal text-sm">by Vencly</span>
          {process.env.NEXT_PUBLIC_GIT_SHA && (
            <span className="font-mono text-[10px] text-muted-foreground/50 tabular-nums leading-none">
              {process.env.NEXT_PUBLIC_GIT_SHA}
            </span>
          )}
        </Link>
        <nav aria-label="Hauptnavigation" className="flex items-center gap-2">
          <Link href="/atlas" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            Atlas
          </Link>
          <Link href="/deltat" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            DeltaT
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-primary hover:bg-primary/90 text-primary-foreground',
            )}
          >
            Anmelden
          </Link>
        </nav>
      </div>
    </header>
  )
}
