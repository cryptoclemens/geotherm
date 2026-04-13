import { create } from 'zustand'

const DEFAULT_LAYERS: Record<string, boolean> = {
  // Basisdaten — nur Hauptrahmen sichtbar
  'tiefland-plain':  true,
  'tiefland-rhein':  false,   // Rhein-spezifisch, optional
  'aktionsraum':     true,
  // Aquifer — nur Norddeutscher als primäres Zielgebiet
  'aq-niederrhein':  false,
  'aq-norddeutsch':  true,
  'aq-molasse':      false,
  'aq-oberrhein':    false,
  // Geologie / Hydrogeologie — nur ein WMS auf Anhieb
  'geo-egdi':        false,
  'geo-bgr':         true,
  'geo-huek250':     false,   // zweites WMS = visuelles Rauschen
  'waerme-wms':      false,
  'waerme-bbsr':     false,
  // Wärme-Produzenten — nur Rechenzentren als Einstieg
  'heat-dc':         true,
  'heat-pp':         false,
  'heat-waste':      false,
  'heat-steel':      false,
  'heat-abw':        false,
  // Fernwärme-Städte — nur hohe Anteile (>50 %)
  'fw-cities-hi':    true,
  'fw-cities-mid':   false,
  'fw-cities-lo':    false,
  'fw-expand':       false,
  'fw-new':          false,
  'hoeff-locker':    false,
  // NRW KWP — off by default (grosse GeoJSON-Dateien)
  'kwp-energietraeger': false,
  'kwp-waermecluster':  false,
  // GeotIS (LIAG Hannover)
  'geotis-standorte': false,
  'geotis-hoeff-a':   false,
  'geotis-hoeff-b':   false,
  'geotis-hoeff-d':   false,
}

interface LayerState {
  layers: Record<string, boolean>
  toggle: (key: string) => void
  setLayer: (key: string, val: boolean) => void
  setGroup: (keys: string[], val: boolean) => void
  isGroupOn: (keys: string[]) => boolean
}

export const useLayerStore = create<LayerState>((set, get) => ({
  layers: { ...DEFAULT_LAYERS },
  toggle: (key) => set(s => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  setLayer: (key, val) => set(s => ({ layers: { ...s.layers, [key]: val } })),
  setGroup: (keys, val) => set(s => {
    const next = { ...s.layers }
    keys.forEach(k => { next[k] = val })
    return { layers: next }
  }),
  isGroupOn: (keys) => keys.some(k => get().layers[k]),
}))
