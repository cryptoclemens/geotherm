import Link from 'next/link'

const legalLinks = [
  { href: '/impressum', label: 'Impressum' },
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/agb', label: 'AGB' },
  { href: '/security', label: 'Security' },
]

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} vencly GmbH · Geotherm
        </p>
        <nav className="flex gap-4">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
