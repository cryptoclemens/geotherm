'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/ui/utils'

const NAV_ITEMS = [
  { href: '/atlas', label: 'Atlas' },
  { href: '/deltat', label: 'DeltaT' },
] as const

export function NavLinks() {
  const pathname = usePathname()

  return (
    <>
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? 'page' : undefined}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          {label}
        </Link>
      ))}
    </>
  )
}
