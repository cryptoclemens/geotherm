import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_INPUTS, berechneBohrkosten } from '../calc/kosten'
import type { BohrkostInputs, BohrkostOutputs } from '../calc/kosten'

interface BohrkostState {
  inputs: BohrkostInputs
  outputs: BohrkostOutputs
  setInput: <K extends keyof BohrkostInputs>(key: K, val: BohrkostInputs[K]) => void
  reset: () => void
  /** Übernimmt Felder aus einem Projekt (z. B. tiefe, tGW, foerderrate aus DeltaT) */
  applyFromProject: (partial: Partial<BohrkostInputs>) => void
}

export const useBohrkostStore = create<BohrkostState>()(
  persist(
    (set) => ({
      inputs: DEFAULT_INPUTS,
      outputs: berechneBohrkosten(DEFAULT_INPUTS),
      setInput: (key, val) =>
        set((s) => {
          const next = { ...s.inputs, [key]: val }
          return { inputs: next, outputs: berechneBohrkosten(next) }
        }),
      reset: () =>
        set({ inputs: DEFAULT_INPUTS, outputs: berechneBohrkosten(DEFAULT_INPUTS) }),
      applyFromProject: (partial) =>
        set((s) => {
          const next = { ...s.inputs, ...partial }
          return { inputs: next, outputs: berechneBohrkosten(next) }
        }),
    }),
    { name: 'bohrkost-inputs' },
  ),
)
