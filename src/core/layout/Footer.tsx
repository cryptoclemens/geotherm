import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t mt-auto py-6 text-sm text-muted-foreground">
      <div className="container mx-auto flex flex-wrap gap-x-6 gap-y-2 px-4 justify-between items-center">
        <span>© {new Date().getFullYear()} vencly GmbH</span>
        <nav className="flex gap-4">
          <Link href="/impressum" className="hover:text-foreground">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-foreground">Datenschutz</Link>
          <Link href="/agb" className="hover:text-foreground">AGB</Link>
          <Link href="/security" className="hover:text-foreground">Security</Link>
        </nav>
      </div>
    </footer>
  )
}
