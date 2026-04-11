'use client'

import { useEffect } from 'react'
import { PrinterIcon } from 'lucide-react'
import { InputColumn } from './components/InputColumn'
import { ResultColumn } from './components/ResultColumn'
import { DeltaTTour } from './components/DeltaTTour'
import { FeedbackModal } from '@/core/ui/FeedbackModal'
import { Button } from '@/core/ui/button'
import { useDeltaTStore } from './store/useDeltaTStore'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'

/** Konsumiert den LocationPreset aus dem WorkspaceStore (gesetzt von GPA) */
function useApplyLocationPreset() {
  useEffect(() => {
    const preset = useWorkspaceStore.getState().locationPreset
    if (!preset) return
    // Preset direkt auf den Store schreiben – außerhalb des React-Renderpfads
    const applyPreset = useDeltaTStore.getState().applyPreset
    const clear       = useWorkspaceStore.getState().clearLocationPreset
    setTimeout(() => {
      applyPreset(preset)
      clear()
    }, 0)
  }, [])
}

export default function DeltaTApp() {
  useApplyLocationPreset()

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <header className="shrink-0 px-4 py-2 border-b bg-muted/40 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold">
            DeltaT – Geothermische Dubletten-Auslegung
          </h1>
          <p className="text-xs text-muted-foreground">
            Auf Basis VDI 4640 · DVGW W 115 · Drost 1978 · Arpagaus 2018
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          data-print-hide
          onClick={() => window.print()}
          aria-label="Ergebnisse drucken oder als PDF speichern"
        >
          <PrinterIcon />
          Drucken / PDF
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden gap-4 p-4" data-deltat-layout>
        {/* Left: Input parameters */}
        <div className="w-72 shrink-0 overflow-y-auto" data-deltat-inputs>
          <InputColumn />
        </div>

        {/* Right: Results */}
        <div className="flex-1 overflow-y-auto" data-deltat-results>
          <ResultColumn />
        </div>
      </div>

      {/* Wissenschaftlicher Disclaimer — BRIEF.md § 7.3 */}
      <div className="mx-4 mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/70 leading-relaxed">
        <strong className="text-amber-300/90 font-medium">Vorauslegung · Machbarkeitsebene:</strong>{' '}
        Für Investitions- und Genehmigungsentscheidungen sind zusätzlich erforderlich:
        hydrogeologisches Gutachten, 3D-Simulation (FEFLOW/TOUGH2/COMSOL),
        standortspezifische Aquifer-Untersuchung und detaillierte Wirtschaftlichkeitsrechnung.
      </div>

      <DeltaTTour />
      <FeedbackModal defaultInApp="deltat" />
    </div>
  )
}
