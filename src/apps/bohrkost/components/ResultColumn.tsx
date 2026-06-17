'use client'

import type { BohrkostInputs, BohrkostOutputs } from '../calc/kosten'

function fmt(n: number, dec = 0): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: dec })
}

function fmtEur(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio. EUR`
  if (n >= 1_000)     return `${(n / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} T EUR`
  return `${fmt(n, 0)} EUR`
}

const AMPEL_COLOR = {
  green:  '#16a34a',
  yellow: '#d97706',
  red:    '#dc2626',
}

const AMPEL_BG = {
  green:  'bg-green-50 dark:bg-green-950/30',
  yellow: 'bg-yellow-50 dark:bg-yellow-950/30',
  red:    'bg-red-50 dark:bg-red-950/30',
}

const AMPEL_BORDER = {
  green:  'border-green-200 dark:border-green-800',
  yellow: 'border-yellow-200 dark:border-yellow-800',
  red:    'border-red-200 dark:border-red-800',
}

interface AmpelCardProps {
  label: string
  status: 'green' | 'yellow' | 'red'
  statusText: string
  detail: string
}

function AmpelCard({ label, status, statusText, detail }: AmpelCardProps) {
  return (
    <div className={`rounded-lg border p-3 flex flex-col gap-1 ${AMPEL_BG[status]} ${AMPEL_BORDER[status]}`}>
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: AMPEL_COLOR[status] }}
        />
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      <span className="text-[11px] font-semibold" style={{ color: AMPEL_COLOR[status] }}>
        {statusText}
      </span>
      <span className="text-[10px] text-muted-foreground leading-snug">{detail}</span>
    </div>
  )
}

interface KostenBandProps {
  label: string
  min: number
  mid: number
  max: number
  highlight?: boolean
}

function KostenBand({ label, min, mid, max, highlight = false }: KostenBandProps) {
  return (
    <div className={`rounded-lg border p-3 flex flex-col gap-1.5 ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-card/50'}`}>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-base font-bold font-mono text-foreground tabular-nums">
          {fmtEur(mid)}
        </span>
        <span className="text-xs text-muted-foreground">(Mittelpunkt)</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>Min: {fmtEur(min)}</span>
        <span className="text-muted-foreground/40">·</span>
        <span>Max: {fmtEur(max)}</span>
      </div>
    </div>
  )
}

interface ResultColumnProps {
  inputs: BohrkostInputs
  outputs: BohrkostOutputs
}

export function ResultColumn({ inputs, outputs: r }: ResultColumnProps) {
  const isDublette = inputs.zweck !== 'Explorationsbohrung'

  const ampelKostenText = {
    green:  '< 500 EUR/kW — wirtschaftlich',
    yellow: '500–1.500 EUR/kW — erhöht',
    red:    '> 1.500 EUR/kW — hoch',
  }[r.ampel_kosten]

  const ampelRisikoText = {
    green:  'Lockergestein — geringes Bohrrisiko',
    yellow: 'Festgestein (sed.) — mittleres Risiko',
    red:    'Kristallin — erhöhtes Bohrrisiko',
  }[r.ampel_risiko]

  const ampelTiefeText = {
    green:  '≤ 700 m — geringe Kosten',
    yellow: '700–1.500 m — mittlere Kosten',
    red:    '> 1.500 m — hohe Kosten',
  }[r.ampel_tiefe]

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border lg:overflow-y-auto lg:h-full">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
        Kostenschätzung · {
          r.anzahl_bohrungen === 1
            ? '1 Bohrung'
            : r.anzahl_bohrungen === 2
              ? '1 Dublette (2 Bohrungen)'
              : `${r.anzahl_bohrungen / 2} Dubletten (${r.anzahl_bohrungen} Bohrungen)`
        } · Gesamtprojekt
      </h2>

      {/* ── Kostenbänder ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2 shrink-0">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Investitionskosten</h3>
        <KostenBand
          label="Bohrkosten (alle Bohrungen, gesamt)"
          min={r.bohrkosten_min}
          mid={r.bohrkosten_mid}
          max={r.bohrkosten_max}
        />
        <KostenBand
          label="Gesamtprojekt (Bohrungen + Komplettierung)"
          min={r.projektkosten_min}
          mid={r.projektkosten_mid}
          max={r.projektkosten_max}
          highlight
        />
        {r.foerderung_betrag > 0 && (
          <>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <span className="text-xs text-green-700 dark:text-green-300">MAP/KfW-Förderung (Abzug)</span>
              <span className="text-xs font-mono font-semibold text-green-700 dark:text-green-300">
                − {fmtEur(r.foerderung_betrag)}
              </span>
            </div>
            <KostenBand
              label="Nach Förderung (Netto)"
              min={r.projektkosten_netto_min}
              mid={r.projektkosten_netto_mid}
              max={r.projektkosten_netto_max}
            />
          </>
        )}
        {r.overhead_gesamt > 0 && (
          <>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <span className="text-xs text-amber-700 dark:text-amber-300">Overhead (Projektkosten außerhalb Baustelle)</span>
              <span className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-300">
                + {fmtEur(r.overhead_gesamt)}
              </span>
            </div>
            <div className={`rounded-lg border p-3 flex flex-col gap-1.5 border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20`}>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Gesamtinvestition inkl. Overhead
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold font-mono text-foreground tabular-nums">
                  {fmtEur(r.projektkosten_inkl_overhead_mid)}
                </span>
                <span className="text-xs text-muted-foreground">(Mittelpunkt)</span>
              </div>
              {r.foerderung_betrag > 0 && (
                <div className="text-[11px] text-green-600 dark:text-green-400">
                  Nach Förderung: {fmtEur(r.projektkosten_netto_inkl_overhead_mid)}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── Spezifische Kennzahlen ────────────────────────────────────────── */}
      <section className="flex flex-col gap-2 shrink-0">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Spezifische Kosten</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border p-3 bg-card/50">
            <div className="text-[10px] text-muted-foreground mb-1">Bohrkosten / Meter</div>
            <div className="text-sm font-mono font-bold text-foreground">
              {fmt(r.bohrkosten_pro_m, 0)} EUR/m
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              je Bohrung (Mittelpunkt)
            </div>
          </div>
          {isDublette && r.leistung_kw > 0 && (
            <>
              <div className="rounded-lg border border-border p-3 bg-card/50">
                <div className="text-[10px] text-muted-foreground mb-1">Thermische Leistung</div>
                <div className="text-sm font-mono font-bold text-foreground">
                  {fmt(r.leistung_kw, 0)} kW
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Q × ΔT × 4,18
                </div>
              </div>
              <div className="rounded-lg border border-border p-3 bg-card/50">
                <div className="text-[10px] text-muted-foreground mb-1">Kosten je kW_th</div>
                <div className="text-sm font-mono font-bold text-foreground">
                  {fmt(r.kosten_pro_kw_mid, 0)} EUR/kW
                </div>
                {r.foerderung_betrag > 0 && (
                  <div className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">
                    {fmt(r.kosten_pro_kw_netto_mid, 0)} EUR/kW (netto)
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Ampeln ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2 shrink-0">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Bewertung</h3>
        {isDublette && r.leistung_kw > 0 && (
          <AmpelCard
            label="Wirtschaftlichkeit"
            status={r.ampel_kosten}
            statusText={ampelKostenText}
            detail="Grün < 500 EUR/kW · Gelb 500–1.500 EUR/kW · Rot > 1.500 EUR/kW (DENA 2023)"
          />
        )}
        <AmpelCard
          label="Bohrrisiko (Gestein)"
          status={r.ampel_risiko}
          statusText={ampelRisikoText}
          detail="Baujard et al. (2017), Stanford SGW — ROP-Verhältnisse Gesteinstypen"
        />
        <AmpelCard
          label="Tiefenstufe"
          status={r.ampel_tiefe}
          statusText={ampelTiefeText}
          detail="≤ 700 m: oberflächennahe Geothermie · > 1.500 m: tiefe Geothermie"
        />
      </section>

      {/* ── Hinweis ──────────────────────────────────────────────────────── */}
      <p className="text-[10px] text-muted-foreground/50 italic mt-auto">
        Kostenschätzung Klasse 5 (±35–50 %) · Machbarkeitsebene — kein Ersatz für Bohrplanung und Ausschreibung.
      </p>
    </div>
  )
}
