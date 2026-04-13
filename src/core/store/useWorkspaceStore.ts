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

export interface SavedSearch {
  id: string
  name: string
  spots: GeoSpot[]
  queryContext: string
  savedAt: string
}

interface WorkspaceState {
  /** Zuletzt in GPA gewählter / angepinnter Standort */
  locationPreset: LocationPreset | null
  setLocationPreset: (preset: LocationPreset) => void
  clearLocationPreset: () => void
  /** Aktuell angezeigte KI-Suchergebnisse */
  geoSpots: GeoSpot[]
  queryContext: string
  setGeoSpots: (spots: GeoSpot[], queryContext: string) => void
  clearGeoSpots: () => void
  /** Gespeicherte Suchen (localStorage) */
  savedSearches: SavedSearch[]
  saveCurrentSearch: (name?: string) => void
  loadSavedSearch: (id: string) => void
  deleteSavedSearch: (id: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      locationPreset: null,
      setLocationPreset: (preset) => set({ locationPreset: preset }),
      clearLocationPreset: () => set({ locationPreset: null }),
      geoSpots: [],
      queryContext: '',
      setGeoSpots: (spots, queryContext) => set({ geoSpots: spots, queryContext }),
      clearGeoSpots: () => set({ geoSpots: [], queryContext: '' }),
      savedSearches: [],
      saveCurrentSearch: (name) => {
        const { geoSpots, queryContext, savedSearches } = get()
        if (!geoSpots.length) return
        const entry: SavedSearch = {
          id: Date.now().toString(),
          name: name ?? (queryContext.slice(0, 60) || 'Gespeicherte Suche'),
          spots: geoSpots,
          queryContext,
          savedAt: new Date().toISOString(),
        }
        set({ savedSearches: [entry, ...savedSearches].slice(0, 20) })
      },
      loadSavedSearch: (id) => {
        const entry = get().savedSearches.find(s => s.id === id)
        if (entry) set({ geoSpots: entry.spots, queryContext: entry.queryContext })
      },
      deleteSavedSearch: (id) =>
        set(s => ({ savedSearches: s.savedSearches.filter(x => x.id !== id) })),
    }),
    { name: 'workspace' },
  ),
)
