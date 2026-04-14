import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_INPUTS, calculateSystem, calcDefaultFoerderhoehe, calcDefaultTGW,
} from '../calc/system'
import type { DeltaTInputs, DeltaTOutputs } from '../calc/system'
import type { LocationPreset } from '@/core/store/useWorkspaceStore'

interface DeltaTState {
  inputs: DeltaTInputs
  outputs: DeltaTOutputs
  /** true = User hat T_GW manuell überschrieben → Tiefe-Kopplung deaktiviert */
  tGWManual: boolean
  setInput: <K extends keyof DeltaTInputs>(key: K, val: DeltaTInputs[K]) => void
  resetInputs: () => void
  /** Tiefe-Kopplung zurücksetzen: T_GW wird wieder aus Tiefe berechnet */
  resetTGWCoupling: () => void
  /** Übernimmt Aquifer-Daten aus einem GPA-LocationPreset */
  applyPreset: (preset: LocationPreset) => void
  /** Lädt vollständige Eingaben aus einem gespeicherten Projekt */
  applyFullProject: (inputs: DeltaTInputs) => void
}

export const useDeltaTStore = create<DeltaTState>()(
  persist(
    (set) => ({
      inputs: DEFAULT_INPUTS,
      outputs: calculateSystem(DEFAULT_INPUTS),
      tGWManual: false,
      setInput: (key, val) =>
        set((s) => {
          let next = { ...s.inputs, [key]: val }
          let tGWManual = s.tGWManual

          if (key === 'tiefe') {
            // Förderhöhe immer mit Tiefe mitziehen (weich — wie bisher)
            next = { ...next, foerderhoehe: calcDefaultFoerderhoehe(val as number) }
            // T_GW nur mitziehen wenn nicht manuell überschrieben
            if (!tGWManual) {
              next = { ...next, tGW: calcDefaultTGW(val as number) }
            }
          }

          if (key === 'tGW') {
            // User dreht manuell → Kopplung aufheben
            tGWManual = true
          }

          return { inputs: next, outputs: calculateSystem(next), tGWManual }
        }),
      resetInputs: () =>
        set({ inputs: DEFAULT_INPUTS, outputs: calculateSystem(DEFAULT_INPUTS), tGWManual: false }),
      resetTGWCoupling: () =>
        set((s) => {
          const tGW = calcDefaultTGW(s.inputs.tiefe)
          const next = { ...s.inputs, tGW }
          return { inputs: next, outputs: calculateSystem(next), tGWManual: false }
        }),
      applyPreset: (preset) =>
        set((s) => {
          const tiefe = preset.aquifer?.tiefe
          // Wenn Preset explizit T_GW liefert (GPA-Daten) → als manuell markieren
          const presetHasTGW = preset.aquifer?.tGW !== undefined
          const next: DeltaTInputs = {
            ...s.inputs,
            ...(tiefe !== undefined && {
              tiefe,
              foerderhoehe: calcDefaultFoerderhoehe(tiefe),
              // T_GW aus Preset wenn vorhanden, sonst aus Gradient berechnen
              tGW: presetHasTGW ? preset.aquifer!.tGW! : calcDefaultTGW(tiefe),
            }),
            ...(preset.aquifer?.maechtig !== undefined && { maechtig: preset.aquifer.maechtig }),
            ...(preset.aquifer?.kf       !== undefined && { kf:       preset.aquifer.kf }),
            ...(preset.aquifer?.tds      !== undefined && { tds:      preset.aquifer.tds }),
          }
          return {
            inputs: next,
            outputs: calculateSystem(next),
            tGWManual: presetHasTGW, // GPA-Wert gilt als "manuell gesetzt"
          }
        }),
      applyFullProject: (inputs) =>
        set({ inputs, outputs: calculateSystem(inputs), tGWManual: true }),
    }),
    { name: 'deltat-inputs' },
  ),
)
