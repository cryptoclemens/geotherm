import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_INPUTS, berechneBohrkosten } from '../calc/kosten'
import type { BohrkostInputs, BohrkostOutputs } from '../calc/kosten'

interface BohrkostState {
  inputs: BohrkostInputs
  outputs: BohrkostOutputs
  /** ID des verknüpften Projekts (null = kein Projektkontext) */
  currentProjectId: string | null
  /** Name des verknüpften Projekts (für Anzeige im Header) */
  currentProjectName: string | null
  setInput: <K extends keyof BohrkostInputs>(key: K, val: BohrkostInputs[K]) => void
  reset: () => void
  /** Übernimmt Felder aus einem Projekt inkl. Projektkontext */
  applyFromProject: (partial: Partial<BohrkostInputs>, projectId: string, projectName: string) => void
  clearProject: () => void
}

export const useBohrkostStore = create<BohrkostState>()(
  persist(
    (set) => ({
      inputs: DEFAULT_INPUTS,
      outputs: berechneBohrkosten(DEFAULT_INPUTS),
      currentProjectId: null,
      currentProjectName: null,
      setInput: (key, val) =>
        set((s) => {
          const next = { ...s.inputs, [key]: val }
          return { inputs: next, outputs: berechneBohrkosten(next) }
        }),
      reset: () =>
        set({
          inputs: DEFAULT_INPUTS,
          outputs: berechneBohrkosten(DEFAULT_INPUTS),
          currentProjectId: null,
          currentProjectName: null,
        }),
      applyFromProject: (partial, projectId, projectName) =>
        set((s) => {
          const next = { ...s.inputs, ...partial }
          return {
            inputs: next,
            outputs: berechneBohrkosten(next),
            currentProjectId: projectId,
            currentProjectName: projectName,
          }
        }),
      clearProject: () =>
        set({ currentProjectId: null, currentProjectName: null }),
    }),
    { name: 'bohrkost-inputs' },
  ),
)
