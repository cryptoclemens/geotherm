'use client'

import { useDeltaTStore } from '../store/useDeltaTStore'
import type { TrafficLight } from '../calc/system'

function fmt(n: number, dec = 1) {
  return n.toLocaleString('de-DE', { maximumFractionDigits: dec })
}

const bgColor: Record<TrafficLight, string> = {
  green:  'bg-green-50 dark:bg-green-950/60 border-green-500',
  yellow: 'bg-yellow-50 dark:bg-yellow-950/60 border-yellow-500',
  red:    'bg-red-50 dark:bg-red-950/60 border-red-500',
}
const textColor: Record<TrafficLight, string> = {
  green:  'text-green-700 dark:text-green-300',
  yellow: 'text-yellow-700 dark:text-yellow-200',
  red:    'text-red-700 dark:text-red-300',
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
      {children}
    </h3>
  )
}

function DataRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-1 text-xs border-b border-white/5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono tabular-nums ${highlight ? 'text-foreground font-semibold' : 'text-foreground/70'}`}>
        {value}
      </span>
    </div>
  )
}

export function SecondaryColumn() {
  const r = useDeltaTStore(s => s.outputs)
  const inputs = useDeltaTStore(s => s.inputs)

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border overflow-y-auto h-full">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
        Sekundärkreislauf · WP · Material · Netz
      </h2>

      {/* ── WP-Temperaturniveau ────────────────────────────────────────────── */}
      <section className="shrink-0">
        <SectionHeading>Wärmepumpen-Temperaturniveau</SectionHeading>
        <div className={`rounded-lg border px-3 py-2.5 mb-2 ${bgColor[r.wpColor]}`}>
          <p className={`text-sm font-semibold leading-snug ${textColor[r.wpColor]}`}>
            {r.wpType}
          </p>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          <p className="font-medium text-foreground/60 mb-1">{r.wpModel}</p>
          <DataRow label="T\u2091\u1d42 / T\u1d5b\u1d38" value={`${inputs.tGW}\u00b0C / ${inputs.tVL}\u00b0C`} />
          <DataRow label="\u0394T\u1d34\u1d58\u1d47 (T\u1d5b\u1d38 \u2212 T\u1d4a\u1d42)" value={`${fmt(r.tHub, 0)} K`} highlight={r.wpColor !== 'green'} />
          <p className="mt-1.5 text-[10px] opacity-60">
            Quelle: VDI 4640 Bl. 4 · EN 14511 · Arpagaus et al. 2018 · Zühlsdorf et al. 2019
          </p>
        </div>
      </section>

      {/* ── WP-Effizienz ──────────────────────────────────────────────────── */}
      <section className="shrink-0">
        <SectionHeading>Wärmepumpen-Effizienz</SectionHeading>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* COP – groß und farbig */}
          <div className={`col-span-2 rounded-lg border-l-4 px-3 py-2 ${
            r.sCOP === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-950/40'
            : r.sCOP === 'yellow' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/40'
            : 'border-red-500 bg-red-50 dark:bg-red-950/40'
          }`}>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">COP real (Carnot × 50 %)</div>
            <div className={`text-3xl font-bold font-mono tabular-nums ${
              r.sCOP === 'green' ? 'text-green-700 dark:text-green-300' : r.sCOP === 'yellow' ? 'text-yellow-700 dark:text-yellow-200' : 'text-red-700 dark:text-red-300'
            }`}>
              {r.cop < 90 ? fmt(r.cop, 2) : '—'}
            </div>
          </div>
        </div>
        {r.wpAktiv && r.cop < 90 ? (
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 mt-1 space-y-0.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Wärmebilanz</p>
            <DataRow label="Q_geo (Dobl. gesamt)" value={`${fmt(r.qThGesamt, 1)} kW`} />
            <DataRow label="+ Q_WP (Kondensator, T-Hub)" value={`+ ${fmt(r.qWP, 1)} kW`} highlight />
            <DataRow label="= Q_gesamt (Geliefert)" value={`= ${fmt(r.qDelivered, 1)} kW`} highlight />
            <div className="border-t border-border/50 mt-1 pt-1">
              <DataRow label="Elektrische Aufnahme W_el" value={`${fmt(r.elLeistungWP, 1)} kW`} />
            </div>
          </div>
        ) : (
          <DataRow label="Wärmeleistung gesamt" value={`${fmt(r.qDelivered, 1)} kW`} highlight />
        )}
        <DataRow label="Temperaturhub T\u1d5b\u1d38 \u2212 T\u1d4a\u1d42" value={`${fmt(r.tHub, 0)} K`} />
      </section>

      {/* ── Werkstoff & Korrosion ──────────────────────────────────────────── */}
      <section className="shrink-0">
        <SectionHeading>Werkstoff &amp; Korrosion — DVGW W 115</SectionHeading>
        <div className={`rounded-lg border-l-4 px-3 py-1.5 mb-1.5 ${
          r.materialColor === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
          : r.materialColor === 'yellow' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
          : 'border-red-500 bg-red-50 dark:bg-red-950/30'
        }`}>
          <span className={`text-xs font-medium ${
            r.materialColor === 'green' ? 'text-green-700 dark:text-green-300' : r.materialColor === 'yellow' ? 'text-yellow-700 dark:text-yellow-200' : 'text-red-700 dark:text-red-300'
          }`}>
            ● {r.material}
          </span>
        </div>
        <DataRow label="TDS-Gehalt" value={`${fmt(inputs.tds, 0)} mg/l`} />
        <div className={`rounded-lg border-l-4 px-3 py-1.5 mt-1.5 ${
          r.scalingColor === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
          : r.scalingColor === 'yellow' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
          : 'border-red-500 bg-red-50 dark:bg-red-950/30'
        }`}>
          <span className={`text-xs font-medium ${
            r.scalingColor === 'green' ? 'text-green-700 dark:text-green-300' : r.scalingColor === 'yellow' ? 'text-yellow-700 dark:text-yellow-200' : 'text-red-700 dark:text-red-300'
          }`}>
            ● {r.scaling}
          </span>
        </div>
      </section>

      {/* ── Wärmetauscher ─────────────────────────────────────────────────── */}
      <section className="shrink-0">
        <SectionHeading>Wärmetauscher (Plattenwärmetauscher)</SectionHeading>
        {r.lmtdValid && r.lmtd !== null ? (
          <>
            <DataRow label="LMTD" value={`${fmt(r.lmtd, 1)} K`} highlight />
            {r.wtFlaeche !== null && (
              <DataRow label="Näherungsfläche (U = 4000 W/m²·K)" value={`${fmt(r.wtFlaeche, 1)} m²`} highlight />
            )}
          </>
        ) : (
          <div className="rounded-lg border border-amber-600/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-200/80 leading-relaxed">
            ΔT\u1d4a\u1d42 = {inputs.tGW}°C &lt; T\u1d5b\u1d38 = {inputs.tVL}°C:{' '}
            Direkter Wärmetausch nicht möglich. WP-Evaporatorseite separat auslegen
            (Zwischenkreis ΔT = 3 K empfohlen).
          </div>
        )}
      </section>
    </div>
  )
}
