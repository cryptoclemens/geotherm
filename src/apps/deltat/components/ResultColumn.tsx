'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { useDeltaTStore } from '../store/useDeltaTStore'
import { KpiTile } from './KpiTile'

// Horizontaler Balken relativ zu einem Maxwert
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  return (
    <div className="h-4 w-full rounded bg-white/5 overflow-hidden">
      <div
        className="h-full rounded transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

function fmt(n: number, dec = 0) {
  return n.toLocaleString('de-DE', { maximumFractionDigits: dec })
}

export function ResultColumn() {
  const r = useDeltaTStore(s => s.outputs)
  const inputs = useDeltaTStore(s => s.inputs)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const gesamtBohrtiefe = r.anzahlDoubletten * inputs.tiefe * 2
  const pumpEigenverbrauch = r.anzahlDoubletten * r.tauchpumpenLeistung * 2

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border overflow-y-auto h-full">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
        Primärkreislauf · Dubletten-System
      </h2>

      {/* ── Leistungsvergleich ─────────────────────────────────────────────── */}
      <section className="shrink-0">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Leistungsvergleich</h3>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Zielleistung', value: inputs.zielLeistung, color: '#4b5563' },
            { label: `1 Doublette (Q\u2080)`, value: r.qThPerDoublet, color: '#2563eb' },
            { label: 'Geothermie gesamt', value: r.qThGesamt, color: '#0284c7' },
            { label: 'Geliefert (inkl. WP)', value: r.qDelivered, color: '#16a34a' },
          ].map(row => (
            <div key={row.label} className="grid grid-cols-[1fr_auto] items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-muted-foreground">{row.label}</span>
                <Bar value={row.value} max={Math.max(inputs.zielLeistung, r.qDelivered) * 1.05} color={row.color} />
              </div>
              <span className="text-xs font-mono text-right w-24 tabular-nums text-foreground/80">
                {fmt(row.value, 1)} kW
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── KPI-Kacheln ───────────────────────────────────────────────────── */}
      <section className="shrink-0">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Kennzahlen</h3>
        <div className="grid grid-cols-3 gap-2">
          <KpiTile label="ΔT nutzbar" value={r.deltaT} unit="K" color={r.sThermik}
            info={'Nutzbares Temperaturgefälle:\nΔT = T_GW − T_R [K]\nBasis für thermische Leistungsberechnung:\nP = ρ·c_p·Q·ΔT\n(VDI 4640 Bl. 2)'} />
          <KpiTile label="Leistung/Dobl." value={r.qThPerDoublet} unit="kW" color={r.sThermik}
            info={'Geothermische Wärmeleistung je Doublette:\nP = ρ·c_p·Q·ΔT [kW]\nρ_Wasser = 1.000 kg/m³\nc_p = 4,18 kJ/(kg·K)\n(Drost 1978)'} />
          <KpiTile label="Jahreswärme" value={r.jahreswaerme} unit="MWh/a"
            info={'Jährliche Wärmemenge:\nE = P_ges × Laufstunden / 1.000 [MWh/a]\nBasis: geothermische Nettoleistung aller Doubletten'} />
          <KpiTile label="Doubletten" value={r.anzahlDoubletten} unit="Stk."
            info={'Anzahl benötigter Förder-/Injektionsbohrpaare:\nn = ⌈P_Ziel / P_Doublette⌉\nAufrunden, da Teildoubletten nicht sinnvoll'} />
          <KpiTile label="Förderrate ges." value={r.gesamtFoerderrate} unit="l/s"
            info={'Gesamtförderrate aller Doubletten:\nQ_ges = n · Q [l/s]\nLimitiert durch Aquifer-Transmissivität (DVGW W 115)'} />
          <KpiTile label="Pumpenleistung" value={r.tauchpumpenLeistung} unit="kW/Bohrg."
            info={'Elektrische Leistungsaufnahme der Tauchpumpe je Bohrung:\nP_Pumpe = ρ·g·H·Q / η [kW]\nη_Pumpe ≈ 0,70 (VDI 4640 Bl. 2)'} />
          <KpiTile label="Spez. Leistung" value={r.spezLeistung} unit="W/m" color={r.sHydraulik}
            info={'Spezifische Wärmeleistung bezogen auf Bohrtiefe:\nq = P_Dobl / Tiefe [W/m]\nOrientierungswert VDI 4640: 30–100 W/m'} />
          <KpiTile label="Durchbruchszeit" value={r.tBreak} unit="Jahre" color={r.sDurchbruch}
            info={'Thermische Durchbruchszeit (Kurzschluss-Prognose):\nt_B = (π·n·b·d²) / (3·Q) × (ρc_Aq/ρc_W) [a]\n(Gringarten & Sauty 1975)\nZiel: > 25–30 Jahre'} />
          <KpiTile label="Opt. Abstand" value={Math.round(r.abstandOpt)} unit="m"
            sub={`t\u2089\u2095=25 a @ Q=${inputs.Q} l/s`}
            info={'Optimaler Mindestabstand für t_B = 25 Jahre:\nd_opt = √(3·Q·t_B / (π·n·b) × ρc_W/ρc_Aq) [m]\n(Gringarten & Sauty 1975)'} />
        </div>
      </section>

      {/* ── Erweiterbare Details ────────────────────────────────────────────── */}
      <section className="shrink-0">
        <button
          onClick={() => setDetailsOpen(v => !v)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {detailsOpen ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          Kennzahlen {detailsOpen ? 'ausblenden' : 'einblenden'}
        </button>
        {detailsOpen && (
          <div className="mt-2 flex flex-col divide-y divide-white/5">
            {[
              ['Gesamt-Wärmeleistung (Geo)',  `${fmt(r.qThGesamt, 1)} kW`],
              ['Geliefert (inkl. WP)',         `${fmt(r.qDelivered, 1)} kW`],
              ['Gesamt-Förderrate',            `${fmt(r.gesamtFoerderrate, 1)} l/s`],
              ['Jahreswärmemenge',             `${fmt(r.jahreswaerme, 0)} MWh/a`],
              ['Gesamte Bohrtiefe',            `${fmt(gesamtBohrtiefe, 0)} m (Förder+Reinjekt.)`],
              ['Pump-Eigenverbrauch',          `${fmt(pumpEigenverbrauch, 1)} kW (alle Doubletten)`],
              ['Transmissivität',             `${r.transmissiv.toExponential(1)} m²/s`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 text-xs">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono text-foreground/80">{v}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
