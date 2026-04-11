import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_INPUTS, calculateSystem } from '../calc/system'
import type { DeltaTInputs, DeltaTOutputs } from '../calc/system'
import type { LocationPreset } from '@/core/store/useWorkspaceStore'

interface DeltaTState {
  inputs: DeltaTInputs
  outputs: DeltaTOutputs
  setInput: <K extends keyof DeltaTInputs>(key: K, val: DeltaTInputs[K]) => void
  resetInputs: () => void
  /** Übernimmt Aquifer-Daten aus einem GPA-LocationPreset */
  applyPreset: (preset: LocationPreset) => void
}

export const useDeltaTStore = create<DeltaTState>()(
  persist(
    (set) => ({
      inputs: DEFAULT_INPUTS,
      outputs: calculateSystem(DEFAULT_INPUTS),
      setInput: (key, val) =>
        set((s) => {
          const next = { ...s.inputs, [key]: val }
          return { inputs: next, outputs: calculateSystem(next) }
        }),
      resetInputs: () =>
        set({ inputs: DEFAULT_INPUTS, outputs: calculateSystem(DEFAULT_INPUTS) }),
      applyPreset: (preset) =>
        set((s) => {
          const next: DeltaTInputs = {
            ...s.inputs,
            ...(preset.aquifer?.tiefe    !== undefined && { tiefe:    preset.aquifer.tiefe }),
            ...(preset.aquifer?.maechtig !== undefined && { maechtig: preset.aquifer.maechtig }),
            ...(preset.aquifer?.kf       !== undefined && { kf:       preset.aquifer.kf }),
            ...(preset.aquifer?.tGW      !== undefined && { tGW:      preset.aquifer.tGW }),
            ...(preset.aquifer?.tds      !== undefined && { tds:      preset.aquifer.tds }),
          }
          return { inputs: next, outputs: calculateSystem(next) }
        }),
    }),
    { name: 'deltat-inputs' },
  ),
)
