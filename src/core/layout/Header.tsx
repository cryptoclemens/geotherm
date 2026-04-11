import Link from 'next/link'

const inApps = [
  { href: '/atlas', label: 'GPA – Atlas' },
  { href: '/deltat', label: 'DeltaT – Rechner' },
]

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="text-blue-700">Geotherm</span>
          <span className="text-xs text-gray-400">by Vencly</span>
        </Link>

        <nav className="flex items-center gap-6">
          {inApps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {app.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Anmelden
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-blue-700 px-3 py-1.5 text-sm text-white hover:bg-blue-800"
          >
            Kostenlos starten
          </Link>
        </div>
      </div>
    </header>
  )
}
