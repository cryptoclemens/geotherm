import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { SwCleanup } from './sw-cleanup'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Geotherm by Vencly',
    template: '%s · Geotherm',
  },
  description: 'Die modulare Geothermie-Suite — vom Standort zum Bohrplan in einem Workflow.',
  applicationName: 'Geotherm',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Geotherm',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SwCleanup />
        {children}
      </body>
    </html>
  )
}
