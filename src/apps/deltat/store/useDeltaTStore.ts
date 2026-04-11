import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_INPUTS, calculateSystem } from '../calc/system'
import type { DeltaTInputs, DeltaTOutputs } from '../calc/system'

interface DeltaTState {
  inputs: DeltaTInputs
  outputs: DeltaTOutputs
  setInput: <K extends keyof DeltaTInputs>(key: K, val: DeltaTInputs[K]) => void
  resetInputs: () => void
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
    }),
    { name: 'deltat-inputs' },
  ),
)
