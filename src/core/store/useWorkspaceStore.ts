/**
 * useWorkspaceStore — App-übergreifender Zustand
 *
 * Hält den zuletzt gewählten Standort (GPA → DeltaT).
 * Gespeichert in localStorage damit der Zustand Browser-Tabs überlebt.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LocationPreset {
  /** Anzeige-Name des Standorts */
  name: string
  /** Breitengrad */
  lat: number
  /** Längengrad */
  lng: number
  /**
   * Optional: Aquifer-Daten aus GPA, übertragbar an DeltaT-Defaultwerte.
   * Alle Felder optional — DeltaT fällt auf Defaults zurück wenn nicht vorhanden.
   */
  aquifer?: {
    tiefe?: number
    maechtig?: number
    kf?: number
    tGW?: number
    tds?: number
  }
}

interface WorkspaceState {
  /** Zuletzt in GPA gewählter / angepinnter Standort */
  locationPreset: LocationPreset | null
  setLocationPreset: (preset: LocationPreset) => void
  clearLocationPreset: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      locationPreset: null,
      setLocationPreset: (preset) => set({ locationPreset: preset }),
      clearLocationPreset: () => set({ locationPreset: null }),
    }),
    { name: 'workspace' },
  ),
)
