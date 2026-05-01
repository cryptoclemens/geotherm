import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { TooltipProvider } from '@/core/ui/tooltip'
import { SwCleanup } from './sw-cleanup'
import './globals.css'

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
    <html lang="de" className={`${plusJakartaSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Theme flash prevention: apply stored preference before first paint.
            Default ist Light — Dark nur wenn Nutzer explizit gewählt hat. */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SwCleanup />
        <TooltipProvider delay={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
