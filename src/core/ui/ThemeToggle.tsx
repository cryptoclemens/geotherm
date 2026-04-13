'use client'

import { useState } from 'react'
import { SunIcon, MoonIcon } from 'lucide-react'
import { Button } from './button'

export function ThemeToggle() {
  // Initialize from DOM — the flash-prevention script in layout.tsx ensures
  // the correct class is already applied before first paint.
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true
    return document.documentElement.classList.contains('dark')
  })

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
      title={dark ? 'Light Mode' : 'Dark Mode'}
    >
      {dark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
    </Button>
  )
}
