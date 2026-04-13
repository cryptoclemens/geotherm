import { create } from 'zustand'

const DEFAULT_LAYERS: Record<string, boolean> = {
  'tiefland-plain':  true,
  'tiefland-rhein':  true,
  'aktionsraum':     true,
  'aq-niederrhein':  true,
  'aq-norddeutsch':  true,
  'aq-molasse':      true,
  'aq-oberrhein':    true,
  'geo-egdi':        false,
  'geo-bgr':         true,
  'geo-huek250':     true,
  'waerme-wms':      false,
  'waerme-bbsr':     false,
  'heat-dc':         true,
  'heat-pp':         false,
  'heat-waste':      false,
  'heat-steel':      false,
  'heat-abw':        false,
  'fw-cities-hi':    true,
  'fw-cities-mid':   true,
  'fw-cities-lo':    true,
  'fw-expand':       false,
  'fw-new':          false,
  'hoeff-locker':    false,
  'kwp-energietraeger': false,
  'kwp-waermecluster':  false,
  // GeotIS (LIAG Hannover) — geothermische Anlagenstandorte + Höffigkeitskarten
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
