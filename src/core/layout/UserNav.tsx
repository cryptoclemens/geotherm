'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/core/auth/useAuth'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/ui/utils'

export function UserNav() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  if (user) {
    return (
      <>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          Dashboard
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
