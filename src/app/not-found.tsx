import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">Diese Seite existiert nicht.</p>
      <Link href="/" className="text-blue-700 hover:underline">
        Zur Startseite
      </Link>
    </div>
  )
}
