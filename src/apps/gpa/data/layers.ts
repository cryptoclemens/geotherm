// ── Aktionsraum polygon ───────────────────────────────────────────────────────
export const AKTIONSRAUM = [
  [51.35,6.0],[51.6,6.2],[51.65,6.8],[51.5,7.0],
  [51.1,7.0],[50.9,6.7],[50.85,6.2],[51.0,5.9],[51.2,5.8],[51.35,6.0]
]

// ── Tiefland polygons ─────────────────────────────────────────────────────────
export const TIEFLAND_PLAIN = [
  [51.2,2.5],[52.0,3.5],[53.5,4.5],[53.8,5.0],[54.5,6.0],[54.8,8.0],
  [54.5,10.0],[54.0,12.0],[53.5,14.5],[52.5,14.5],[51.5,14.0],[51.0,13.5],
  [50.5,12.5],[51.0,10.0],[51.5,8.5],[51.2,7.0],[50.8,6.0],[50.5,5.0],[51.2,2.5]
]

export const TIEFLAND_RHEIN = [
  [50.55,5.80],[51.00,5.80],[51.30,6.05],[51.52,6.30],
  [51.72,6.55],[51.78,6.85],[51.50,6.85],[51.10,6.75],
  [50.80,6.60],[50.58,6.25],[50.55,5.80]
]

// ── Höffigkeit polygons ───────────────────────────────────────────────────────
export const HOEFF_LOCKER_POLYS = [
  {
    coords: [[51.2,2.5],[52.0,3.5],[53.5,4.5],[53.8,5.0],[54.5,6.0],[54.8,8.0],
             [54.5,10.0],[53.5,12.0],[52.5,14.5],[51.5,13.0],[51.0,11.0],
             [51.5,9.0],[51.5,7.0],[51.2,5.0],[50.8,4.0],[51.2,2.5]],
    label: 'Norddeutsches Tiefland', aquifer: 'Rhaetium, Buntsandstein',
    depth: '400–2.000 m', temp: '25–60°C', potential: 'Hoch'
  },
  {
    coords: [[50.55,5.80],[51.00,5.80],[51.30,6.05],[51.52,6.30],
             [51.72,6.55],[51.78,6.85],[51.50,6.85],[51.10,6.75],
             [50.80,6.60],[50.58,6.25],[50.55,5.80]],
    label: 'Niederrheinische Bucht', aquifer: 'Miozäner Mariensand / Hauptterrassensand',
    depth: '200–1.500 m', temp: '20–45°C', potential: 'Sehr hoch'
  },
]

// ── Aquifer polygons ──────────────────────────────────────────────────────────
export const AQUIFER_LAYERS = {
  'aq-niederrhein': {
    color: '#4ecdc4',
    coords: [[50.55,5.80],[51.00,5.80],[51.30,6.05],[51.52,6.30],
             [51.72,6.55],[51.78,6.85],[51.50,6.85],[51.10,6.75],
             [50.80,6.60],[50.58,6.25],[50.55,5.80]],
    name: 'Niederrhein-Aquifer',
    formation: 'Miozäner Mariensand · Hauptterrassensand',
    depth: '200 – 1.500 m', temp: '20 – 45 °C', note: '⭐ Primärziel BOWA',
  },
  'aq-norddeutsch': {
    color: '#5bafd6',
    coords: [[52.20,7.00],[53.00,7.50],[53.80,8.50],[54.50,9.50],[54.80,11.00],
             [54.50,13.50],[53.80,14.00],[52.80,14.00],[52.00,13.00],[51.80,11.50],
             [52.00,9.50],[52.20,7.00]],
    name: 'Norddeutscher Aquifer',
    formation: 'Rhaetium · Buntsandstein · Wealden',
    depth: '400 – 2.000 m', temp: '30 – 70 °C', note: 'Gut – günstige Bohrkosten',
  },
  'aq-molasse': {
    color: '#f0c040',
    coords: [[47.50,9.50],[48.00,10.00],[48.50,11.00],[48.80,12.50],
             [48.50,13.50],[48.00,13.80],[47.50,13.50],[47.20,12.00],
             [47.20,10.50],[47.50,9.50]],
    name: 'Malmkarst / Molasse-Aquifer',
    formation: 'Malmkarst (Oberer Jura)',
    depth: '1.500 – 5.000 m', temp: '60 – 140 °C', note: 'Sehr gut – München Leuchtturm',
  },
  'aq-oberrhein': {
    color: '#e8a857',
    coords: [[47.50,7.20],[48.00,7.40],[48.80,8.00],[49.50,8.20],[49.80,8.00],
             [49.80,7.60],[49.50,7.20],[48.80,7.00],[48.00,7.00],[47.50,7.20]],
    name: 'Buntsandstein Oberrhein-Aquifer',
    formation: 'Buntsandstein · Rotliegend',
    depth: '1.000 – 3.500 m', temp: '60 – 160 °C', note: 'Gut – Straßburg-Pilotprojekt',
  },
}

// ── WMS layer configs ─────────────────────────────────────────────────────────
export const WMS_LAYERS = {
  'geo-egdi': {
    url: 'https://services.bgr.de/wms/geologie/igme5000/',
    params: { layers: '3', format: 'image/png', transparent: true, version: '1.3.0' },
    label: 'IGME5000 Geologie Europa', opacity: 0.55,
  },
  'geo-bgr': {
    // GÜK200 wurde abgeschaltet → offizieller Nachfolger GÜK250 (BGR, 2024)
    url: 'https://services.bgr.de/wms/geologie/guek250/',
    params: { layers: '0', format: 'image/png', transparent: true, version: '1.3.0' },
    label: 'GÜK250 Geologie', opacity: 0.6,
  },
  'geo-huek250': {
    url: 'https://services.bgr.de/wms/grundwasser/huek250/',
    params: { layers: '0', format: 'image/png', transparent: true, version: '1.3.0' },
    label: 'HÜK250 Hydrogeologie', opacity: 0.6,
  },
  // Zensus 2022 – Heizungsstruktur (Ersatz für abgeschalteten LANUV Wärmekataster)
  // Quelle: Statistisches Bundesamt / IT.NRW via Geoportal NRW
  // WMS: https://www.gis-idmz.nrw.de/arcgis/services/stba/zensusatlas_energie_100m/MapServer/WMSServer
  // Hinweis: MaxScaleDenominator ~1:68.000 → Kacheln nur ab Zoom ~13 sichtbar
  'waerme-wms': {
    url: 'https://www.gis-idmz.nrw.de/arcgis/services/stba/zensusatlas_energie_100m/MapServer/WMSServer',
    params: { layers: '0', format: 'image/png', transparent: true, version: '1.3.0' },
    label: 'Zensus 2022: Heizungsart (100m)', opacity: 0.7,
    minZoom: 12,  // MaxScaleDenominator 68247 ≈ 1:68.000 → Zoom 12–13
    attribution: '© Statistisches Bundesamt (Destatis) / IT.NRW, Zensus 2022',
  },
  'waerme-bbsr': {
    url: 'https://www.gis-idmz.nrw.de/arcgis/services/stba/zensusatlas_energie_100m/MapServer/WMSServer',
    params: { layers: '1', format: 'image/png', transparent: true, version: '1.3.0' },
    label: 'Zensus 2022: Energieträger Heizung (100m)', opacity: 0.7,
    minZoom: 12,
    attribution: '© Statistisches Bundesamt (Destatis) / IT.NRW, Zensus 2022',
  },
}
