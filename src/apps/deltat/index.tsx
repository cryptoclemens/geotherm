'use client'

import { useEffect, useState } from 'react'
import { PrinterIcon } from 'lucide-react'
import { InputColumn } from './components/InputColumn'
import { ResultColumn } from './components/ResultColumn'
import { SecondaryColumn } from './components/SecondaryColumn'
import { FormelTab } from './components/FormelTab'
import { SaveProjectDialog } from './components/SaveProjectDialog'
import { LoadProjectDialog } from './components/LoadProjectDialog'
import { OptimizeDialog } from './components/OptimizeDialog'
import { DeltaTTour } from './components/DeltaTTour'
import { Button } from '@/core/ui/button'
import { useDeltaTStore } from './store/useDeltaTStore'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'
import type { TrafficLight } from './calc/system'

type TabId = 'berechnung' | 'formeln'

/** Konsumiert den LocationPreset aus dem WorkspaceStore (gesetzt von GPA) */
function useApplyLocationPreset() {
  useEffect(() => {
    const preset = useWorkspaceStore.getState().locationPreset
    if (!preset) return
    const applyPreset = useDeltaTStore.getState().applyPreset
    const clear       = useWorkspaceStore.getState().clearLocationPreset
    setTimeout(() => {
      applyPreset(preset)
      clear()
    }, 0)
  }, [])
}

const dotColor: Record<TrafficLight, string> = {
  green:  'bg-green-400',
  yellow: 'bg-yellow-400',
  red:    'bg-red-400',
}

function StatusDot({ color }: { color: TrafficLight }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${dotColor[color]}`} />
}

function StatusItem({ label, color, value }: { label: string; color: TrafficLight; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <StatusDot color={color} />
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/70 font-mono">{value}</span>
    </div>
  )
}

export default function DeltaTApp() {
  useApplyLocationPreset()
  const r = useDeltaTStore(s => s.outputs)
  const inputs = useDeltaTStore(s => s.inputs)
  const [tab, setTab] = useState<TabId>('berechnung')

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <header className="shrink-0 px-4 py-2 border-b bg-muted/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-base font-semibold">
              DeltaT – Geothermische Dubletten-Auslegung
            </h1>
            <p className="text-xs text-muted-foreground">
              Auf Basis VDI 4640 · DVGW W 115 · Drost 1978 · Arpagaus 2018
            </p>
          </div>
          {/* Tab-Switcher */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5" role="tablist" aria-label="DeltaT-Ansicht wählen">
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
          {tab === 'berechnung' && <OptimizeDialog />}
          {tab === 'berechnung' && <LoadProjectDialog />}
          {tab === 'berechnung' && <SaveProjectDialog />}
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

      {/* ── Formelwerk-Tab ───────────────────────────────────────────────── */}
      {tab === 'formeln' && (
        <div className="flex-1 overflow-hidden">
          <FormelTab />
        </div>
      )}

      {/* ── 3-Spalten-Layout ─────────────────────────────────────────────── */}
      {tab === 'berechnung' && (
      <div className="flex flex-1 overflow-hidden gap-3 p-3" data-deltat-layout>
        {/* Spalte 1: Eingabeparameter */}
        <div className="w-64 shrink-0 overflow-y-auto" data-deltat-inputs>
          <InputColumn />
        </div>

        {/* Spalte 2: Primärkreislauf */}
        <div className="flex-1 overflow-hidden min-w-0" data-deltat-results>
          <ResultColumn />
        </div>

        {/* Spalte 3: Sekundärkreislauf */}
        <div className="w-72 shrink-0 overflow-hidden" data-deltat-secondary>
          <SecondaryColumn />
        </div>
      </div>
      )}

      {/* ── Statusbar (nur bei Berechnung) ─────────────────────────────────── */}
      {tab === 'berechnung' && (
        <footer className="shrink-0 px-4 py-2 border-t bg-muted/30 flex flex-wrap items-center gap-x-6 gap-y-1">
          <StatusItem
            label="Hydraulik"
            color={r.sHydraulik}
            value={`k\u1da0 = ${r.transmissiv.toExponential(1)} m\u00b2/s`}
          />
          <StatusItem
            label="Thermik"
            color={r.sThermik}
            value={`${r.qDelivered.toFixed(0)} / ${inputs.zielLeistung} kW`}
          />
          <StatusItem
            label="Durchbruchszeit"
            color={r.sDurchbruch}
            value={`${r.tBreak.toFixed(1)} Jahre`}
          />
          <StatusItem
            label="WP-Effizienz"
            color={r.sCOP}
            value={`COP = ${r.cop < 90 ? r.cop.toFixed(2) : '—'}`}
          />
          <StatusItem
            label="Materialklasse"
            color={r.sMaterial}
            value={r.material.split(' ')[0]}
          />
          <p className="ml-auto text-[10px] text-muted-foreground/50 italic hidden lg:block">
            Vorauslegung · Machbarkeitsebene — kein Ersatz für hydrogeol. Gutachten
          </p>
        </footer>
      )}

      <DeltaTTour />
    </div>
  )
}
