'use client'

import { useState } from 'react'
import { PrinterIcon, XIcon } from 'lucide-react'
import { Button } from '@/core/ui/button'
import { FeedbackModal } from '@/core/ui/FeedbackModal'
import { InputColumn } from './components/InputColumn'
import { ResultColumn } from './components/ResultColumn'
import { BohrkostFormelTab } from './components/BohrkostFormelTab'
import { useBohrkostStore } from './store/useBohrkostStore'
import type { BohrkostInputs } from './calc/kosten'

type TabId = 'berechnung' | 'formeln'

function LukawskiPopup({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative bg-popover text-popover-foreground rounded-xl shadow-xl ring-1 ring-foreground/10 max-w-md w-full mx-4 p-5"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Schließen"
        >
          <XIcon className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold mb-1">Lukawski et al. (2014) — Was ist in den Bohrkosten enthalten?</h3>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Die Lukawski-Formel basiert auf realen <strong>Authorization for Expenditure (AFE)</strong>-Daten
          aus 760 Geothermieprojekten. AFE-Werte sind Gesamtbohrkosten und enthalten implizit:
        </p>
        <ul className="flex flex-col gap-1.5 text-xs">
          {[
            'Bohrbesatzung (Driller, Roughnecks, Derrickman)',
            'Bohrservice-Personal (Mud Engineer, Directional Driller, Logging)',
            'On-site Bohrbrückenführung',
            'Mobilisierung / Demobilisierung',
          ].map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-green-500 shrink-0">✓</span>
              <span className="text-foreground/80">{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-muted-foreground/60 mt-4 leading-relaxed">
          Nicht enthalten: Projektmanagement, hydrogeologische Begleitung, Bauüberwachung und
          rechtliche Beratung außerhalb der Bohrbaustelle (typisch 5–15 % Overhead —
          fällt bei Klasse-5-Schätzung ±35–50 % in die Bandbreite).
        </p>
      </div>
    </div>
  )
}

function fmt(n: number, dec = 0): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: dec })
}

function fmtEur(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio. EUR`
  if (n >= 1_000)     return `${(n / 1_000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} T EUR`
  return `${fmt(n, 0)} EUR`
}

const AMPEL_DOT: Record<'green' | 'yellow' | 'red', string> = {
  green:  'bg-green-400',
  yellow: 'bg-yellow-400',
  red:    'bg-red-400',
}

function StatusDot({ color }: { color: 'green' | 'yellow' | 'red' }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${AMPEL_DOT[color]}`} />
}

function StatusItem({ label, color, value }: { label: string; color: 'green' | 'yellow' | 'red'; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <StatusDot color={color} />
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/70 font-mono">{value}</span>
    </div>
  )
}

export default function BohrkostApp() {
  const [tab, setTab] = useState<TabId>('berechnung')
  const [lukawskiOpen, setLukawskiOpen] = useState(false)

  const inputs = useBohrkostStore(s => s.inputs)
  const outputs = useBohrkostStore(s => s.outputs)
  const setInput = useBohrkostStore(s => s.setInput)
  const reset = useBohrkostStore(s => s.reset)

  function handleChange<K extends keyof BohrkostInputs>(key: K, value: BohrkostInputs[K]) {
    setInput(key, value)
  }

  function handleReset() {
    reset()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {lukawskiOpen && <LukawskiPopup onClose={() => setLukawskiOpen(false)} />}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 px-4 py-2 border-b bg-muted/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-base font-semibold">
              Bohrkostenrechner — Geothermische Investitionsschätzung
            </h1>
            <p className="text-xs text-muted-foreground">
              <button
                onClick={() => setLukawskiOpen(true)}
                className="underline decoration-dotted underline-offset-2 hover:text-foreground transition-colors cursor-help"
              >
                Auf Basis Lukawski et al. (2014)
              </button>
              {' · GtV Bohrpreise · MAP/KfW 2024'}
            </p>
          </div>
          {/* Tab-Switcher */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5" role="tablist" aria-label="Bohrkost-Ansicht wählen">
            {(['berechnung', 'formeln'] as const).map(t => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`text-xs px-3 py-1 rounded-md transition-colors font-medium ${
                  tab === t
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'berechnung' ? 'Berechnung' : 'Formelwerk'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2" data-print-hide>
          {tab === 'berechnung' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              aria-label="Ergebnisse drucken oder als PDF speichern"
            >
              <PrinterIcon />
              Drucken / PDF
            </Button>
          )}
        </div>
      </header>

      {/* ── Formelwerk-Tab ──────────────────────────────────────────────────── */}
      {tab === 'formeln' && (
        <div className="flex-1 overflow-hidden">
          <BohrkostFormelTab />
        </div>
      )}

      {/* ── 3-Spalten-Layout ────────────────────────────────────────────────── */}
      {tab === 'berechnung' && (
        <div className="flex flex-1 overflow-hidden gap-3 p-3">
          {/* Spalte 1: Eingabeparameter */}
          <div className="w-80 shrink-0 overflow-y-auto">
            <InputColumn inputs={inputs} onChange={handleChange} onReset={handleReset} />
          </div>

          {/* Spalte 2: Ergebnisse */}
          <div className="flex-1 overflow-hidden min-w-0">
            <ResultColumn inputs={inputs} outputs={outputs} />
          </div>
        </div>
      )}

      {/* ── Statusbar (nur bei Berechnung) ──────────────────────────────────── */}
      {tab === 'berechnung' && (
        <footer className="shrink-0 px-4 py-2 border-t bg-muted/30 flex flex-wrap items-center gap-x-6 gap-y-1">
          <StatusItem
            label="Gesamtprojekt (Mitte)"
            color={outputs.ampel_tiefe}
            value={fmtEur(outputs.projektkosten_mid)}
          />
          {outputs.leistung_kw > 0 && (
            <StatusItem
              label="Spez. Kosten"
              color={outputs.ampel_kosten}
              value={`${fmt(outputs.kosten_pro_kw_mid, 0)} EUR/kW_th`}
            />
          )}
          {outputs.foerderung_betrag > 0 && (
            <StatusItem
              label="Nach Förderung"
              color="green"
              value={fmtEur(outputs.projektkosten_netto_mid)}
            />
          )}
          <StatusItem
            label="Bohrrisiko"
            color={outputs.ampel_risiko}
            value={inputs.gesteinstyp === 'Festgestein_kristallin' ? 'Kristallin' : inputs.gesteinstyp === 'Lockergestein' ? 'Lockergestein' : 'Festgestein sed.'}
          />
          <p className="ml-auto text-[10px] text-muted-foreground/50 italic hidden lg:block">
            Klasse-5-Schätzung (±35–50 %) — kein Ersatz für Bohrplanung und Ausschreibung
          </p>
        </footer>
      )}

      <FeedbackModal defaultInApp="bohrkost" />
    </div>
  )
}
