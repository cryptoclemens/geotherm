import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/ui/utils'

export const metadata: Metadata = {
  title: 'Geotherm – Die modulare Geothermie-Suite',
  description: 'Vom Standort zum Bohrplan in einem Workflow. GPA Atlas + DeltaT-Rechner für geothermische Dubletten-Auslegung. Kostenlos registrieren.',
  openGraph: {
    title: 'Geotherm by Vencly',
    description: 'Die modulare Geothermie-Suite — GPA Atlas und DeltaT-Rechner in einem Workflow.',
    url: 'https://geotherm.vencly.com',
    siteName: 'Geotherm',
    type: 'website',
    locale: 'de_DE',
  },
  alternates: {
    canonical: 'https://geotherm.vencly.com',
  },
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden geo-bg flex-1 flex items-center justify-center px-4 py-24 md:py-36">
        {/* Dekorative Orbs */}
        <div
          className="geo-orb w-[500px] h-[500px] bg-[oklch(0.62_0.14_195/0.18)] -top-32 -left-32"
          style={{ animationDelay: '0s' }}
          aria-hidden="true"
        />
        <div
          className="geo-orb w-[400px] h-[400px] bg-[oklch(0.72_0.14_60/0.15)] bottom-0 right-0"
          style={{ animationDelay: '5s' }}
          aria-hidden="true"
        />
        <div
          className="geo-orb w-72 h-72 bg-[oklch(0.55_0.16_160/0.12)] top-1/3 right-1/4"
          style={{ animationDelay: '9s' }}
          aria-hidden="true"
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-1.5 text-sm text-[oklch(0.72_0.15_195)] mb-8 font-medium">
            <span className="w-2 h-2 rounded-full bg-[oklch(0.72_0.15_195)] animate-pulse" aria-hidden="true" />
            Geothermie-Suite · jetzt verfügbar
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Vom Standort{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[oklch(0.72_0.15_195)] to-[oklch(0.72_0.14_60)]">
              zum Bohrplan
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Die erste modulare Geothermie-Suite im Web — alle Werkzeuge
            entlang des Projektlebenszyklus in einem Workflow.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-[oklch(0.62_0.14_195)] hover:bg-[oklch(0.68_0.15_195)] text-white border-0 h-12 px-8 text-base font-medium shadow-lg shadow-[oklch(0.62_0.14_195/0.3)]',
              )}
            >
              Kostenlos registrieren
            </Link>
            <Link
              href="/atlas"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'glass-card border-white/20 text-white hover:bg-white/10 h-12 px-8 text-base',
              )}
            >
              Atlas erkunden
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="bg-[oklch(0.14_0.022_240)] py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-white text-center mb-3">
            Zwei In-Apps, ein Workflow
          </h2>
          <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">
            Von der Potenzialanalyse über den Standort bis zur technischen Auslegung — alles in einem Tool.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* GPA Card */}
            <div className="glass-card rounded-2xl p-6 group hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.14_195/0.2)] flex items-center justify-center mb-4 group-hover:bg-[oklch(0.62_0.14_195/0.3)] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="oklch(0.72 0.15 195)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">GPA – Geothermie-Potenzial-Atlas</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Interaktive Karte des norddeutschen Tieflandes mit Overlays
                für Lockergestein, Fernwärme-Städte und Industriewärmequellen.
              </p>
              <Link
                href="/atlas"
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-[oklch(0.72_0.15_195)] hover:text-[oklch(0.80_0.14_195)] transition-colors font-medium"
              >
                Atlas öffnen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* DeltaT Card */}
            <div className="glass-card rounded-2xl p-6 group hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[oklch(0.72_0.14_60/0.2)] flex items-center justify-center mb-4 group-hover:bg-[oklch(0.72_0.14_60/0.3)] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="oklch(0.78 0.14 60)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">DeltaT – Dubletten-Auslegungsrechner</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Echtzeit-Rechner für geothermische Dubletten-Systeme mit
                Wärmepumpen-Dimensionierung und druckbarem Ergebnisbericht.
              </p>
              <Link
                href="/deltat"
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-[oklch(0.78_0.14_60)] hover:text-[oklch(0.85_0.13_60)] transition-colors font-medium"
              >
                Rechner öffnen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
