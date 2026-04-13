/**
 * useWorkspaceStore — App-übergreifender Zustand
 *
 * Hält den zuletzt gewählten Standort (GPA → DeltaT) sowie KI-Suchergebnisse.
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

export interface GeoSpot {
  name: string
  lat: number
  lng: number
  aquifer: string
  depth: string
  temperature: string
  potential: 'sehr hoch' | 'hoch' | 'mittel'
  explanation: string
}

interface WorkspaceState {
  /** Zuletzt in GPA gewählter / angepinnter Standort */
  locationPreset: LocationPreset | null
  setLocationPreset: (preset: LocationPreset) => void
  clearLocationPreset: () => void
  /** KI-Suchergebnisse: geothermische Spots */
  geoSpots: GeoSpot[]
  queryContext: string
  setGeoSpots: (spots: GeoSpot[], queryContext: string) => void
  clearGeoSpots: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      locationPreset: null,
      setLocationPreset: (preset) => set({ locationPreset: preset }),
      clearLocationPreset: () => set({ locationPreset: null }),
      geoSpots: [],
      queryContext: '',
      setGeoSpots: (spots, queryContext) => set({ geoSpots: spots, queryContext }),
      clearGeoSpots: () => set({ geoSpots: [], queryContext: '' }),
    }),
    { name: 'workspace' },
  ),
)
