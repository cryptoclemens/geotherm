'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'
import { useAuth } from '@/core/auth/useAuth'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/ui/utils'

export function UserNav() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  if (user) {
    return (
      <>
        <Link
          href="/dashboard"
          aria-current={pathname === '/dashboard' ? 'page' : undefined}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          Dashboard
        </Link>
        <Link
          href="/settings"
          aria-current={pathname === '/settings' ? 'page' : undefined}
          aria-label="Einstellungen"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'px-2')}
        >
          <Settings className="h-4 w-4" />
        </Link>
        <button
          onClick={async () => { await signOut(); router.push('/') }}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          Abmelden
        </button>
      </>
    )
  }

  return (
    <Link
      href="/login"
      className={cn(
        buttonVariants({ size: 'sm' }),
        'bg-primary hover:bg-primary/90 text-primary-foreground',
      )}
    >
      Anmelden
    </Link>
  )
}
