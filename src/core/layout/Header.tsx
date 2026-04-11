import Link from 'next/link'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/ui/utils'

export function Header() {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-semibold text-lg">
          Geotherm <span className="text-muted-foreground font-normal text-sm">by Vencly</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/atlas" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            Atlas
          </Link>
          <Link href="/deltat" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            DeltaT
          </Link>
          <Link href="/login" className={cn(buttonVariants({ size: 'sm' }))}>
            Anmelden
          </Link>
        </nav>
      </div>
    </header>
  )
}
