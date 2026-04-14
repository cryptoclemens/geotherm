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
    {
      name: 'bohrkost-inputs',
      version: 1,
      // v0 → v1: anzahlDubletten zu Inputs hinzugefügt.
      // migrate normalisiert alte Daten gegen DEFAULT_INPUTS und berechnet outputs neu.
      migrate: (persistedState, version) => {
        if (version < 1) {
          const old = persistedState as Partial<BohrkostState> | null
          const oldInputs = (old?.inputs ?? {}) as Partial<BohrkostInputs>
          const inputs: BohrkostInputs = { ...DEFAULT_INPUTS, ...oldInputs }
          return {
            inputs,
            outputs: berechneBohrkosten(inputs),
            currentProjectId: old?.currentProjectId ?? null,
            currentProjectName: old?.currentProjectName ?? null,
          } as BohrkostState
        }
        return persistedState as BohrkostState
      },
      // Zusätzliche Absicherung: outputs nach Rehydration immer neu berechnen.
      merge: (persisted, current) => {
        const p = persisted as BohrkostState
        const inputs: BohrkostInputs = { ...current.inputs, ...p.inputs }
        return { ...current, ...p, inputs, outputs: berechneBohrkosten(inputs) }
      },
    },
  ),
)
