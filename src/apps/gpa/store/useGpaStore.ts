import { create } from 'zustand'

interface StatItem {
  name: string
  lat: number
  lng: number
  tags?: Record<string, string>
}

interface GpaState {
  // Boot Log
  bootLogOpen: boolean
  bootLogEntries: Array<{ msg: string; status: string; time: string }>
  toggleBootLog: () => void
  addLog: (msg: string, status?: string) => void
  clearLog: () => void

  // Loader
  loaderDone: boolean
  loaderProgress: number
  loaderDetail: string
  setLoaderDone: () => void
  setProgress: (pct: number, detail?: string) => void

  // OSM Spinner
  osmSpinning: boolean
  osmSpinnerSub: string
  showOsmSpinner: (sub?: string) => void
  hideOsmSpinner: () => void

  // Viewport Stat Counts
  statCounts: Record<string, number | null>
  setStatCount: (key: string, n: number | null) => void

  // Stat List Panel
  statListOpen: boolean
  statListCategory: string | null
  statListItems: StatItem[]
  showStatList: (cat: string, items: StatItem[]) => void
  hideStatList: () => void

  // Print Dialog
  printDialogOpen: boolean
  showPrintDialog: () => void
  hidePrintDialog: () => void

  // WMS Badges
  wmsBadges: Record<string, 'probing' | 'live' | 'error'>
  setWmsBadge: (key: string, status: 'probing' | 'live' | 'error') => void

  // Heat Markers
  heatMarkers: Record<string, StatItem[]>
  setHeatMarkers: (key: string, markers: StatItem[]) => void

  // Tour
  tourActive: boolean
  tourStep: number
  startTour: () => void
  setTourStep: (n: number) => void
  endTour: () => void

  // Welcome
  welcomeSeen: boolean
  setWelcomeSeen: () => void
}

export const useGpaStore = create<GpaState>((set) => ({
  bootLogOpen: false,
  bootLogEntries: [],
  toggleBootLog: () => set(s => ({ bootLogOpen: !s.bootLogOpen })),
  addLog: (msg, status = 'ok') => set(s => ({
    bootLogEntries: [
      ...s.bootLogEntries,
      { msg, status, time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
    ],
  })),
  clearLog: () => set({ bootLogEntries: [] }),

  loaderDone: false,
  loaderProgress: 0,
  loaderDetail: 'Initialisiere…',
  setLoaderDone: () => set({ loaderDone: true }),
  setProgress: (pct, detail) => set({ loaderProgress: pct, loaderDetail: detail ?? '' }),

  osmSpinning: false,
  osmSpinnerSub: 'Overpass API',
  showOsmSpinner: (sub) => set({ osmSpinning: true, osmSpinnerSub: sub ?? 'Overpass API' }),
  hideOsmSpinner: () => set({ osmSpinning: false }),

  statCounts: { dc: null, pp: null, abw: null, fw: null },
  setStatCount: (key, n) => set(s => ({ statCounts: { ...s.statCounts, [key]: n } })),

  statListOpen: false,
  statListCategory: null,
  statListItems: [],
  showStatList: (cat, items) => set({ statListOpen: true, statListCategory: cat, statListItems: items }),
  hideStatList: () => set({ statListOpen: false, statListItems: [] }),

  printDialogOpen: false,
  showPrintDialog: () => set({ printDialogOpen: true }),
  hidePrintDialog: () => set({ printDialogOpen: false }),

  wmsBadges: {},
  setWmsBadge: (key, status) => set(s => ({ wmsBadges: { ...s.wmsBadges, [key]: status } })),

  heatMarkers: {},
  setHeatMarkers: (key, markers) => set(s => ({ heatMarkers: { ...s.heatMarkers, [key]: markers } })),

  tourActive: false,
  tourStep: 0,
  startTour: () => set({ tourActive: true, tourStep: 0 }),
  setTourStep: (n) => set({ tourStep: n }),
  endTour: () => set({ tourActive: false }),

  welcomeSeen: false,
  setWelcomeSeen: () => set({ welcomeSeen: true }),
}))
