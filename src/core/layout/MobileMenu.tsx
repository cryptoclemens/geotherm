'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MenuIcon } from 'lucide-react'
import { useAuth } from '@/core/auth/useAuth'
import { ThemeToggle } from '@/core/ui/ThemeToggle'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from '@/core/ui/sheet'
import { Button } from '@/core/ui/button'

const NAV_ITEMS = [
  { href: '/atlas',     label: 'Atlas' },
  { href: '/deltat',    label: 'DeltaT' },
  { href: '/bohrkost',  label: 'Bohrkosten' },
  { href: '/projects',  label: 'Projekte' },
] as const

export function MobileMenu() {
  const [open, setOpen]   = useState(false)
  const pathname          = usePathname()
  const router            = useRouter()
  const { user, signOut } = useAuth()

  function close() { setOpen(false) }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={
        <Button variant="ghost" className="h-11 w-11" aria-label="Menü öffnen">
          <MenuIcon className="w-5 h-5" />
        </Button>
      } />

      <SheetContent side="right" className="p-0 flex flex-col w-72 sm:max-w-xs">
        {/* Logo */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <Link href="/" onClick={close} className="font-semibold text-base tracking-tight">
            Geotherm
          </Link>
        </div>

        {/* Nav-Items */}
        <nav aria-label="Mobile Navigation" className="flex-1 flex flex-col py-2 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              onClick={close}
              className={[
                'px-5 py-3.5 text-base font-medium transition-colors',
                pathname === href
                  ? 'text-primary bg-primary/8'
                  : 'text-foreground/80 hover:text-foreground hover:bg-muted/60',
              ].join(' ')}
            >
              {label}
            </Link>
          ))}

          <div className="h-px bg-border mx-5 my-2" />

          {user ? (
            <>
              <Link
                href="/dashboard"
                aria-current={pathname === '/dashboard' ? 'page' : undefined}
                onClick={close}
                className={[
                  'px-5 py-3.5 text-base font-medium transition-colors',
                  pathname === '/dashboard'
                    ? 'text-primary bg-primary/8'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted/60',
                ].join(' ')}
              >
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  close()
                  await signOut()
                  router.push('/')
                }}
                className="px-5 py-3.5 text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors text-left"
              >
                Abmelden
              </button>
            </>
          ) : (
            <div className="px-5 py-3">
              <Link
                href="/login"
                onClick={close}
                className="flex items-center justify-center h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                Anmelden
              </Link>
            </div>
          )}
        </nav>

        {/* Footer: Theme-Toggle */}
        <div className="border-t px-5 py-4 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Design</span>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  )
}
