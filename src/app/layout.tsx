import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Geotherm by Vencly',
  description: 'Die modulare Geothermie-Suite — vom Standort zum Bohrplan.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
