'use client'

import { useEffect } from 'react'
import { InputColumn } from './components/InputColumn'
import { ResultColumn } from './components/ResultColumn'
import { FeedbackModal } from '@/core/ui/FeedbackModal'
import { useDeltaTStore } from './store/useDeltaTStore'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'

export default function DeltaTApp() {
  const applyPreset    = useDeltaTStore(s => s.applyPreset)
  const locationPreset = useWorkspaceStore(s => s.locationPreset)
  const clearPreset    = useWorkspaceStore(s => s.clearLocationPreset)

  // Einmalig Preset aus GPA anwenden, danach löschen
  useEffect(() => {
    if (locationPreset) {
      applyPreset(locationPreset)
      clearPreset()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <header className="shrink-0 px-4 py-2 border-b bg-muted/40">
        <h1 className="text-base font-semibold">
          DeltaT – Geothermische Dubletten-Auslegung
        </h1>
        <p className="text-xs text-muted-foreground">
          Auf Basis VDI 4640 · DVGW W 115 · Drost 1978 · Arpagaus 2018
        </p>
      </header>

      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Left: Input parameters */}
        <div className="w-72 shrink-0 overflow-y-auto">
          <InputColumn />
        </div>

        {/* Right: Results */}
        <div className="flex-1 overflow-y-auto">
          <ResultColumn />
        </div>
      </div>

      <FeedbackModal defaultInApp="deltat" />
    </div>
  )
}
