import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/core/ui/button'
import { cn } from '@/core/ui/utils'

export const metadata: Metadata = {
  title: 'Geotherm – Die modulare Geothermie-Suite',
  description:
    'Wo bohren? Wie auslegen? Geotherm verbindet GPA-Potenzialatlas und DeltaT-Dubletten­rechner zu einem durchgängigen Workflow für Aquifer-Geothermie.',
  openGraph: {
    title: 'Geotherm by Vencly',
    description:
      'Die modulare Geothermie-Suite — GPA-Potenzialatlas und DeltaT-Dubletten­rechner in einem Workflow.',
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
    <div className="dark flex flex-col min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden geo-bg flex-1 flex items-center justify-center px-4 py-24 md:py-36">
        {/* Dekorative Orbs — auf Mobile ausgeblendet (CPU-intensiv) */}
        <div
          className="hidden sm:block geo-orb w-[500px] h-[500px] bg-[oklch(0.62_0.14_195/0.18)] -top-32 -left-32"
          style={{ animationDelay: '0s' }}
          aria-hidden="true"
        />
        <div
          className="hidden sm:block geo-orb w-[400px] h-[400px] bg-[oklch(0.72_0.14_60/0.15)] bottom-0 right-0"
          style={{ animationDelay: '5s' }}
          aria-hidden="true"
        />
        <div
          className="hidden sm:block geo-orb w-72 h-72 bg-[oklch(0.55_0.16_160/0.12)] top-1/3 right-1/4"
          style={{ animationDelay: '9s' }}
          aria-hidden="true"
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-1.5 text-sm text-[oklch(0.72_0.15_195)] mb-8 font-medium">
            <span className="w-2 h-2 rounded-full bg-[oklch(0.72_0.15_195)] animate-pulse" aria-hidden="true" />
            Geothermie-Suite · jetzt verfügbar
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Wo bohren? Wie auslegen?
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[oklch(0.72_0.15_195)] to-[oklch(0.72_0.14_60)]">
              Geotherm!
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 mb-4 max-w-2xl mx-auto leading-relaxed">
            Geotherm ersetzt verstreute Excel-Tabellen, statische PDF-Karten und
            manuelle Datenrecherche durch eine integrierte Web-Plattform für
            Aquifer-Geothermie (ATES / Erdwärme-Dubletten).
          </p>

          <p className="text-sm text-white/35 mb-10 max-w-xl mx-auto">
            Geologische Einschätzungen sind KI-gestützte Näherungen auf Basis
            regionaler Geologie — kein Ersatz für eine Standortuntersuchung.
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

      {/* ── Problem / Lösung ──────────────────────────────────────────────── */}
      <section className="bg-[oklch(0.12_0.02_240)] py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-white text-center mb-3">
            Drei Fragen. Ein Workflow.
          </h2>
          <p className="text-white/50 text-center mb-12 max-w-xl mx-auto text-sm leading-relaxed">
            Geotherm adressiert die drei zentralen Hürden in der frühen
            Projektentwicklung von Nah- und Fernwärmeprojekten via Aquifer-Geothermie.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Karte */}
            <div className="glass-card rounded-2xl p-6">
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.62_0.14_195/0.2)] flex items-center justify-center mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.72 0.15 195)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Wo bohren?</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                GPA zeigt hydrogeologische Potenzialschichten (GÜK250 / HÜK250),
                industrielle Abwärmequellen aus OSM und Fernwärme-Städte auf einer
                interaktiven Karte. Klick auf beliebigen Punkt — KI analysiert
                Aquifer, Tiefe, Temperatur und Transmissivität.
              </p>
            </div>

            {/* Rechner */}
            <div className="glass-card rounded-2xl p-6">
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.72_0.14_60/0.2)] flex items-center justify-center mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.78 0.14 60)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Wie auslegen?</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                DeltaT berechnet Durchfluss Q, Temperaturhub &Delta;T, WP-COP,
                Wärmetauscherfl&auml;che und Jahresenergie für jeden Parametersatz.
                Standortdaten aus GPA per Klick übernehmen, Ergebnis als PDF exportieren.
              </p>
            </div>

            {/* Assistent */}
            <div className="glass-card rounded-2xl p-6">
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.55_0.16_160/0.2)] flex items-center justify-center mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.65 0.16 160)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Was als nächstes?</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Der KI-Assistent auf dem Dashboard beantwortet Planungsfragen,
                schlägt Top-Standorte vor und navigiert direkt in das passende
                Werkzeug — mit persistentem Chat-Verlauf.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature-Details ───────────────────────────────────────────────── */}
      <section className="bg-[oklch(0.14_0.022_240)] py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-white text-center mb-3">
            Zwei In-Apps, ein Workflow
          </h2>
          <p className="text-white/50 text-center mb-12 max-w-xl mx-auto text-sm">
            Von der Potenzialanalyse über den Standort bis zur technischen Auslegung.
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
              <h3 className="text-lg font-semibold text-white mb-3">GPA – Geothermie-Potenzial-Atlas</h3>

              <ul className="space-y-2 text-sm text-white/50 leading-relaxed mb-4">
                <li className="flex gap-2">
                  <span className="text-[oklch(0.72_0.15_195)] shrink-0 mt-0.5">—</span>
                  Geologische Overlays: GÜK250, HÜK250, Hydrogeologie, Zensus 2022 Heiztypen
                </li>
                <li className="flex gap-2">
                  <span className="text-[oklch(0.72_0.15_195)] shrink-0 mt-0.5">—</span>
                  OSM-Abwärme live: Rechenzentren, Kraftwerke, Müllverbrennung, Stahlwerke, Chempark / BASF — Zähler pro Kartenausschnitt
                </li>
                <li className="flex gap-2">
                  <span className="text-[oklch(0.72_0.15_195)] shrink-0 mt-0.5">—</span>
                  Fernwärme-Städte: 31 aktive + 19 geplante Städte &gt; 20 % FW-Anteil
                </li>
                <li className="flex gap-2">
                  <span className="text-[oklch(0.72_0.15_195)] shrink-0 mt-0.5">—</span>
                  NRW KWP Tiefengeothermie-Potenzial und Fernwärme-Cluster
                </li>
                <li className="flex gap-2">
                  <span className="text-[oklch(0.72_0.15_195)] shrink-0 mt-0.5">—</span>
                  Karten-Klick-Inspector: Reverse-Geocoding + KI-Analyse (Aquifer, Tiefe, T&#8321;&#818;, k&#8342;, TDS, Potenzial-Rating)
                </li>
                <li className="flex gap-2">
                  <span className="text-[oklch(0.72_0.15_195)] shrink-0 mt-0.5">—</span>
                  Standort speichern und direkt in DeltaT übernehmen
                </li>
                <li className="flex gap-2">
                  <span className="text-[oklch(0.72_0.15_195)] shrink-0 mt-0.5">—</span>
                  KI-Standortsuche: Freitext-Anfrage → nummerierte Marker auf der Karte
                </li>
              </ul>

              <Link
                href="/atlas"
                className="inline-flex items-center gap-1.5 text-sm text-[oklch(0.72_0.15_195)] hover:text-[oklch(0.80_0.14_195)] transition-colors font-medium"
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
              <h3 className="text-lg font-semibold text-white mb-3">DeltaT – Dubletten-Auslegungsrechner</h3>

              <ul className="space-y-2 text-sm text-white/50 leading-relaxed mb-4">
                <li className="flex gap-2">
                  <span className="text-[oklch(0.78_0.14_60)] shrink-0 mt-0.5">—</span>
                  Vollständige Dublettenauslegung: Durchfluss Q, Temperaturhub &Delta;T, WP-COP, W&auml;rmetauscher LMTD / Fl&auml;che, Jahresenergie
                </li>
                <li className="flex gap-2">
                  <span className="text-[oklch(0.78_0.14_60)] shrink-0 mt-0.5">—</span>
                  Alle Parameter per Schieberegler einstellbar, inkl. flexibler Vor- / R&uuml;cklauftemperaturen (t&#8321;&#818;L / t&#8320;L)
                </li>
                <li className="flex gap-2">
                  <span className="text-[oklch(0.78_0.14_60)] shrink-0 mt-0.5">—</span>
                  Formelwerk-Tab mit 12 Einträgen und Quellenangaben (VDI 4640, Drost 1978 u. a.)
                </li>
                <li className="flex gap-2">
                  <span className="text-[oklch(0.78_0.14_60)] shrink-0 mt-0.5">—</span>
                  PDF-Export des Ergebnisberichts
                </li>
                <li className="flex gap-2">
                  <span className="text-[oklch(0.78_0.14_60)] shrink-0 mt-0.5">—</span>
                  LocationPreset-Import: Standortdaten direkt aus GPA oder KI-Suche übernehmen
                </li>
              </ul>

              <Link
                href="/deltat"
                className="inline-flex items-center gap-1.5 text-sm text-[oklch(0.78_0.14_60)] hover:text-[oklch(0.85_0.13_60)] transition-colors font-medium"
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

      {/* ── Ehrliche Grenzen ──────────────────────────────────────────────── */}
      <section className="bg-[oklch(0.12_0.02_240)] py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold text-white text-center mb-3">
            Was Geotherm noch nicht leistet
          </h2>
          <p className="text-white/40 text-center mb-10 text-sm max-w-lg mx-auto">
            Transparenz über den aktuellen Entwicklungsstand.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              {
                title: 'Keine echten Bohrdaten',
                text: 'Alle geologischen Einschätzungen sind KI-generierte Näherungen auf Basis regionaler Geologie. Kein Ersatz für eine Standortuntersuchung oder Pumpversuche.',
              },
              {
                title: 'Kein Genehmigungsworkflow',
                text: 'Keine Unterstützung für BImSchG- oder WHG-Verfahren, Antragsformulare oder Behördenkommunikation.',
              },
              {
                title: 'Kein Finanzmodell',
                text: 'Keine Kapitalwertrechnung (NPV / IRR), keine Fördermittelkalkulation, keine LCOH-Berechnung.',
              },
              {
                title: 'Kein Echtzeit-Grundwassermonitoring',
                text: 'Keine Anbindung an Pegelstände, Temperaturmessnetze oder behördliche Messsysteme.',
              },
            ].map(({ title, text }) => (
              <div key={title} className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white/70 mb-1">{title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call-to-Action ────────────────────────────────────────────────── */}
      <section className="bg-[oklch(0.14_0.022_240)] py-16 px-4 border-t border-white/5">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
            Jetzt loslegen
          </h2>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Kostenlose Registrierung — Atlas und Rechner sofort nutzbar.
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

    </div>
  )
}
