import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_INPUTS, calculateSystem, calcDefaultFoerderhoehe, calcDefaultTGW,
} from '../calc/system'
import type { DeltaTInputs, DeltaTOutputs, RegionId } from '../calc/system'
import type { LocationPreset } from '@/core/store/useWorkspaceStore'

interface DeltaTState {
  inputs: DeltaTInputs
  outputs: DeltaTOutputs
  /** true = User hat T_GW manuell überschrieben → Tiefe-Kopplung deaktiviert */
  tGWManual: boolean
  /** Anzeigeeinheit für Förderrate Q — intern immer l/s */
  qEinheit: 'ls' | 'm3min'
  setInput: <K extends keyof DeltaTInputs>(key: K, val: DeltaTInputs[K]) => void
  resetInputs: () => void
  /** Tiefe-Kopplung zurücksetzen: T_GW wird wieder aus Tiefe berechnet */
  resetTGWCoupling: () => void
  setQEinheit: (einheit: 'ls' | 'm3min') => void
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
      qEinheit: 'ls',
      setInput: (key, val) =>
        set((s) => {
          let next = { ...s.inputs, [key]: val }
          let tGWManual = s.tGWManual

          if (key === 'tiefe') {
            // Förderhöhe immer mit Tiefe mitziehen (weich — wie bisher)
            next = { ...next, foerderhoehe: calcDefaultFoerderhoehe(val as number) }
            // T_GW nur mitziehen wenn nicht manuell überschrieben
            if (!tGWManual) {
              next = { ...next, tGW: calcDefaultTGW(val as number, next.region) }
            }
          }

          if (key === 'region') {
            // Regionsänderung → T_GW-Kopplung neu berechnen (falls nicht manuell)
            if (!tGWManual) {
              next = { ...next, tGW: calcDefaultTGW(next.tiefe, val as RegionId) }
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
          const tGW = calcDefaultTGW(s.inputs.tiefe, s.inputs.region)
          const next = { ...s.inputs, tGW }
          return { inputs: next, outputs: calculateSystem(next), tGWManual: false }
        }),
      setQEinheit: (einheit) => set({ qEinheit: einheit }),
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
      applyFullProject: (inputs) => {
        // Merge mit DEFAULT_INPUTS damit alte Projekte ohne porositaet/guetegradWP nicht crashen
        const normalized: DeltaTInputs = { ...DEFAULT_INPUTS, ...inputs }
        set({ inputs: normalized, outputs: calculateSystem(normalized), tGWManual: true })
      },
    }),
    {
      name: 'deltat-inputs',
      version: 3,
      // v0 → v1: porositaet + guetegradWP zu Inputs hinzugefügt; outputs-Shape erweitert.
      // v1 → v2: region + injektionsdruck zu Inputs hinzugefügt; calcEtaPump + Sichardt Q_max.
      // v2 → v3: qEinheit (Anzeigeeinheit Förderrate) als UI-State hinzugefügt.
      migrate: (persistedState, version) => {
        if (version < 1) {
          const old = persistedState as Partial<DeltaTState> | null
          const oldInputs = (old?.inputs ?? {}) as Partial<DeltaTInputs>
          const inputs: DeltaTInputs = { ...DEFAULT_INPUTS, ...oldInputs }
          return {
            inputs,
            outputs: calculateSystem(inputs),
            tGWManual: old?.tGWManual ?? false,
            qEinheit: 'ls',
          } as DeltaTState
        }
        if (version < 2) {
          const old = persistedState as Partial<DeltaTState> | null
          const oldInputs = (old?.inputs ?? {}) as Partial<DeltaTInputs>
          const inputs: DeltaTInputs = { ...DEFAULT_INPUTS, ...oldInputs }
          return {
            ...(old ?? {}),
            inputs,
            outputs: calculateSystem(inputs),
            qEinheit: 'ls',
          } as DeltaTState
        }
        if (version < 3) {
          const old = persistedState as Partial<DeltaTState> | null
          const oldInputs = (old?.inputs ?? {}) as Partial<DeltaTInputs>
          const inputs: DeltaTInputs = { ...DEFAULT_INPUTS, ...oldInputs }
          return {
            ...(old ?? {}),
            inputs,
            outputs: calculateSystem(inputs),
            qEinheit: 'ls',
          } as DeltaTState
        }
        return persistedState as DeltaTState
      },
      // Zusätzliche Absicherung: outputs nach Rehydration immer neu berechnen
      // (falls outputs-Shape sich erweitert hat ohne Versionsbump).
      merge: (persisted, current) => {
        const p = persisted as DeltaTState
        const inputs: DeltaTInputs = { ...current.inputs, ...p.inputs }
        return { ...current, ...p, inputs, outputs: calculateSystem(inputs) }
      },
    },
  ),
)
