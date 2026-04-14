'use client'

import { useState } from 'react'
import { SunIcon, MoonIcon } from 'lucide-react'
import { Button } from './button'

export function ThemeToggle() {
  // Lazy initializer reads from DOM on client, defaults to light on server.
  // suppressHydrationWarning on the button prevents React complaining if
  // the server-rendered icon differs from the client-hydrated icon (e.g. when
  // the user previously chose dark mode and the flash-prevention script fired).
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
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
      variant="outline"
      size="icon-sm"
      onClick={toggle}
      aria-label={dark ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
      title={dark ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
      suppressHydrationWarning
    >
      {dark
        ? <SunIcon className="w-3.5 h-3.5" suppressHydrationWarning />
        : <MoonIcon className="w-3.5 h-3.5" suppressHydrationWarning />
      }
    </Button>
  )
}
