// @ts-nocheck
import { useEffect, useRef, useState } from 'react'
import { CircleMarker, Popup, useMapEvents } from 'react-leaflet'
import { useLayerStore } from '../../store/useLayerStore'
import { useGpaStore } from '../../store/useGpaStore'

const HEAT_CONFIGS = [
  {
    key: 'heat-dc',
    color: '#a87cd6',
    icon: '🖥️',
    label: 'Rechenzentrum',
    query: (bbox) => `[out:json][timeout:15][bbox:${bbox}];(nwr["telecom"="data_center"];nwr["building"="data_center"];);out center tags;`,
  },
  {
    key: 'heat-pp',
    color: '#d67c5b',
    icon: '🏭',
    label: 'Kraftwerk',
    query: (bbox) => `[out:json][timeout:15][bbox:${bbox}];(nwr["power"="plant"]["plant:method"!="wind"]["plant:method"!="solar"]["plant:source"!="wind"]["plant:source"!="solar"]["plant:source"!="photovoltaic"]["plant:source"!="hydro"];nwr["power"="generator"]["generator:source"="thermal"];nwr["industrial"="heating"];);out center tags;`,
    filter: (el) => {
      const t = el.tags || {}
      const src = (t['plant:source'] || t['generator:source'] || t['plant:method'] || '').toLowerCase()
      const name = (t.name || '').toLowerCase()
      const renewable = ['wind', 'solar', 'photovoltaic', 'hydro', 'tidal', 'wave']
      if (renewable.some(s => src.includes(s))) return false
      if (/windpark|windkraft|solarpark|photovoltaik|wind.farm|solar.farm/i.test(name)) return false
      return true
    },
  },
  {
    key: 'heat-waste',
    color: '#5bd6c8',
    icon: '♻️',
    label: 'Müllverbrennung',
    query: (bbox) => `[out:json][timeout:15][bbox:${bbox}];(nwr["industrial"="waste_incineration"];nwr["building"="waste_incineration"];nwr["power"="plant"]["plant:source"="waste"];);out center tags;`,
  },
  {
    key: 'heat-steel',
    color: '#d6c85b',
    icon: '⚙️',
    label: 'Stahlwerk',
    query: (bbox) => `[out:json][timeout:15][bbox:${bbox}];(nwr["industrial"="steelworks"];nwr["man_made"="works"]["product"="steel"];nwr["landuse"="industrial"]["industrial"="steel"];);out center tags;`,
  },
  {
    key: 'heat-abw',
    color: '#a85bd6',
    icon: '♨️',
    // Datenquelle: OpenStreetMap / Overpass API (Raffinerie, Chemie, Papier, Glas, Zement …)
    // KEIN echter BfEE-Abwärme-Atlas (www.bfee.de/abwaerme-atlas) — der enthält gemessene MWh/a-Werte
    // und ist nur über das BfEE-Portal zugänglich, nicht als öffentlicher WMS/API verfügbar.
    // OSM-Abdeckung: ~60–80 % der relevanten Großstandorte; kleinere Anlagen fehlen.
    label: 'Industrieabwärme (OSM)',
    query: (bbox) => `[out:json][timeout:20][bbox:${bbox}];(nwr["industrial"="refinery"];nwr["industrial"="chemical_plant"];nwr["industrial"="paper_mill"];nwr["industrial"="glass"];nwr["man_made"="works"]["product"~"cement|glass|paper|aluminium|aluminum|chemicals|pharmaceutical|rubber|plastic|sugar|fertilizer"];nwr["landuse"="industrial"]["man_made"="works"]["operator"];);out center tags;`,
    filter: (el: { tags?: Record<string, string> }) => {
      // Exclude very generic/unnamed industrial areas
      const t = el.tags || {}
      return !!(t.name || t.operator || t.product)
    },
  },
]

function getCenter(el) {
  if (el.type === 'node') return [el.lat, el.lon]
  if (el.center) return [el.center.lat, el.center.lon]
  return null
}

function SingleHeatLayer({ config, bbox }) {
  const [markers, setMarkers] = useState([])
  const cacheRef = useRef({})
  const { showOsmSpinner, hideOsmSpinner, setHeatMarkers, addLog } = useGpaStore.getState()

  useEffect(() => {
    if (!bbox) return
    const cacheKey = `${config.key}|${bbox}`
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey]
      setMarkers(cached)
      setHeatMarkers(config.key, cached.map(el => ({ lat: el._c[0], lng: el._c[1], name: el.tags?.name, tags: el.tags })))
      return
    }
    showOsmSpinner(config.label)
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(config.query(bbox))}`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        let elements = (data.elements || [])
        if (config.filter) elements = elements.filter(config.filter)
        const pts = elements
          .map(el => ({ ...el, _c: getCenter(el) }))
          .filter(el => el._c)
        cacheRef.current[cacheKey] = pts
        setMarkers(pts)
        setHeatMarkers(config.key, pts.map(el => ({ lat: el._c[0], lng: el._c[1], name: el.tags?.name, tags: el.tags })))
        addLog(`${config.label}: ${pts.length} Objekte geladen`, 'ok')
      })
      .catch(() => {
        addLog(`${config.label}: Overpass-Fehler`, 'error')
      })
      .finally(() => {
        hideOsmSpinner()
      })
  }, [bbox]) // eslint-disable-line

  return markers.map((el, i) => {
    const tags = el.tags || {}
    const name = tags.name || config.label
    return (
      <CircleMarker
        key={`${config.key}-${i}`}
        center={el._c}
        radius={6}
        pathOptions={{
          color: config.color,
          fillColor: config.color,
          fillOpacity: 0.75,
          weight: 1.5,
        }}
      >
        <Popup className="det-popup-wrap" maxWidth={300}>
          <div className="det-popup">
            <div className="det-header" style={{ borderColor: config.color }}>
              <div className="det-title">{config.icon} {name}</div>
              <div className="det-op">{config.label}</div>
            </div>
            <div className="det-body">
              {tags.operator && (
                <div className="det-row">
                  <span className="det-k">Betreiber</span>
                  <span className="det-v">{tags.operator}</span>
                </div>
              )}
              {tags['addr:city'] && (
                <div className="det-row">
                  <span className="det-k">Ort</span>
                  <span className="det-v">{tags['addr:city']}</span>
                </div>
              )}
              {(tags['plant:output:heat'] || tags['plant:output:electricity']) && (
                <div className="det-row">
                  <span className="det-k">Leistung</span>
                  <span className="det-v">
                    {tags['plant:output:heat'] || tags['plant:output:electricity']}
                  </span>
                </div>
              )}
              <div className="det-disclaimer">Quelle: OpenStreetMap / Overpass API</div>
            </div>
          </div>
        </Popup>
      </CircleMarker>
    )
  })
}

export default function HeatSourceLayers() {
  const layers = useLayerStore(s => s.layers)
  const [bbox, setBbox] = useState(null)

  function updateBbox(map) {
    const b = map.getBounds()
    setBbox(`${b.getSouth().toFixed(4)},${b.getWest().toFixed(4)},${b.getNorth().toFixed(4)},${b.getEast().toFixed(4)}`)
  }

  const map = useMapEvents({
    moveend() { updateBbox(map) },
    zoomend() { updateBbox(map) },
  })

  useEffect(() => {
    if (map) updateBbox(map)
  }, []) // eslint-disable-line

  const zoom = map ? map.getZoom() : 0
  if (zoom < 7) return null

  const activeConfigs = HEAT_CONFIGS.filter(c => layers[c.key])
  if (!bbox || activeConfigs.length === 0) return null

  return (
    <>
      {activeConfigs.map(config => (
        <SingleHeatLayer key={config.key} config={config} bbox={bbox} />
      ))}
    </>
  )
}
