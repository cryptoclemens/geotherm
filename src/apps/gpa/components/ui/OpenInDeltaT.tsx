'use client'

import { useRouter } from 'next/navigation'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'
import type { LocationPreset } from '@/core/store/useWorkspaceStore'

interface OpenInDeltaTProps {
  preset: LocationPreset
}

/**
 * Schaltfläche: Standort aus GPA-Karte → DeltaT-Rechner übertragen.
 * Speichert den LocationPreset im WorkspaceStore und navigiert zu /deltat.
 */
export function OpenInDeltaT({ preset }: OpenInDeltaTProps) {
  const router = useRouter()
  const setPreset = useWorkspaceStore(s => s.setLocationPreset)

  function handleClick() {
    setPreset(preset)
    router.push('/deltat')
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors"
    >
      <span>→</span>
      In DeltaT öffnen
    </button>
  )
}
