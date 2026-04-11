// @ts-nocheck
import { CircleMarker, Popup, Tooltip } from 'react-leaflet'
import { useLayerStore } from '../../store/useLayerStore'
import { FW_CITIES, FW_CITIES_PLANNED, dhColor, dhCategory } from '../../data/fwCities'

function CityPopup({ city }) {
  const c = dhColor(city.dh)
  return (
    <div className="det-popup">
      <div className="det-header" style={{ borderLeft: `3px solid ${c}`, padding:'16px 36px 12px 16px' }}>
        <div className="det-title">🏙 {city.n}</div>
        <div className="det-op">{city.op || '–'}</div>
      </div>
      <div className="det-body">
        <div className="det-row">
          <span className="det-k">Land</span>
          <span className="det-v">{city.c}</span>
        </div>
        <div className="det-row">
          <span className="det-k">Status</span>
          <span className="det-v" style={{ color: c }}>{city.status || 'In Betrieb'}</span>
        </div>
        <div className="det-row">
          <span className="det-k">FW-Anteil</span>
          <span className="det-v" style={{ color: c, fontWeight: 700 }}>
            {city.dh > 0 ? `${city.dh} %` : 'Geplant / k. A.'}
          </span>
        </div>
        <div className="det-row">
          <span className="det-k">Bevölkerung</span>
          <span className="det-v">{city.pop} Mio.</span>
        </div>
        {city.net_km > 0 && (
          <div className="det-row">
            <span className="det-k">Netzlänge</span>
            <span className="det-v">{city.net_km.toLocaleString('de-DE')} km</span>
          </div>
        )}
        <div className="det-divider" />
        <div className="det-src-label">Wärmegestehung</div>
        <div className="det-src">{city.src_mix || 'Daten nicht verfügbar'}</div>
        <div className="det-divider" />
        <div className="det-row">
          <span className="det-k">Website</span>
          <span className="det-v">
            {city.url
              ? <a href={city.url} target="_blank" rel="noopener noreferrer" className="pp-link">
                  {city.url.replace(/^https?:\/\//, '')}
                </a>
              : <span className="t-na">k. A.</span>}
          </span>
        </div>
        {city.contact && (
          <div className="det-row">
            <span className="det-k">Kontakt</span>
            <span className="det-v">{city.contact}</span>
          </div>
        )}
        <div className="det-disclaimer">
          Quelle: BWP · Stadtwerke-Berichte 2023 · eigene Recherche
        </div>
      </div>
    </div>
  )
}

// Popup for planned/expansion cities
function PlannedCityPopup({ city }) {
  const typeColor = city.type === 'expand' ? '#5bafd6' : '#a78bfa'
  const typeLabel = city.type === 'expand' ? '📈 Ausbau geplant' : '🆕 Neubau geplant'
  return (
    <div className="det-popup">
      <div className="det-header" style={{ borderLeft: `3px solid ${typeColor}`, padding:'16px 36px 12px 16px' }}>
        <div className="det-title">🏙 {city.n}</div>
        <div className="det-op">{city.op}</div>
      </div>
      <div className="det-body">
        <div className="det-row">
          <span className="det-k">Land</span>
          <span className="det-v">{city.c}</span>
        </div>
        <div className="det-row">
          <span className="det-k">Status</span>
          <span className="det-v" style={{ color: typeColor, fontWeight: 700 }}>{typeLabel}</span>
        </div>
        <div className="det-row">
          <span className="det-k">Netz heute</span>
          <span className="det-v">{city.current_km.toLocaleString('de-DE')} km</span>
        </div>
        <div className="det-row">
          <span className="det-k">Ziel bis {city.target_year}</span>
          <span className="det-v" style={{ color: typeColor, fontWeight: 700 }}>{city.target_km.toLocaleString('de-DE')} km</span>
        </div>
        <div className="det-row">
          <span className="det-k">Investition</span>
          <span className="det-v">{city.invest}</span>
        </div>
        {city.co2_free_by && (
          <div className="det-row">
            <span className="det-k">CO₂-frei ab</span>
            <span className="det-v">{city.co2_free_by}</span>
          </div>
        )}
        <div className="det-divider" />
        <div className="det-src-label">Wärmequellen</div>
        <div className="det-src">{city.src_mix}</div>
        {city.detail && (<>
          <div className="det-divider" />
          <div className="det-src-label">Details</div>
          <div className="det-src">{city.detail}</div>
        </>)}
        <div className="det-divider" />
        <div className="det-row">
          <span className="det-k">Website</span>
          <span className="det-v">
            {city.url
              ? <a href={city.url} target="_blank" rel="noopener noreferrer" className="pp-link">
                  {city.url.replace(/^https?:\/\//, '')}
                </a>
              : <span className="t-na">k. A.</span>}
          </span>
        </div>
        <div className="det-disclaimer">Quelle: Kommunale Wärmepläne · BWP · eigene Recherche 2025</div>
      </div>
    </div>
  )
}

export default function FWCitiesLayer() {
  const layers = useLayerStore(s => s.layers)

  // Filter existing cities by active sub-layers
  const visible = FW_CITIES.filter(city => {
    const cat = dhCategory(city.dh)
    return layers[cat]
  })

  // Planned cities: show when fw-expand or fw-new is active
  const showPlanned = layers['fw-expand'] || layers['fw-new']
  const visiblePlanned = showPlanned
    ? FW_CITIES_PLANNED.filter(c => {
        if (layers['fw-expand'] && c.type === 'expand')      return true
        if (layers['fw-new']    && c.type === 'planned_new') return true
        return false
      })
    : []

  return (
    <>
      {/* Existing FW cities */}
      {visible.map((city, i) => {
        const c = dhColor(city.dh)
        const r = city.pop >= 1 ? 10 : city.pop >= 0.3 ? 7 : 5
        return (
          <CircleMarker
            key={`fw-${i}`}
            center={[city.lat, city.lng]}
            radius={r}
            pathOptions={{
              color: c,
              fillColor: c,
              fillOpacity: 0.75,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -r-2]} opacity={0.97}>
              <div style={{ fontWeight:700, fontSize:13, color:'#fff', marginBottom:3 }}>
                🏙 {city.n}
              </div>
              <div style={{ fontSize:11, opacity:.75, marginBottom:4 }}>{city.op}</div>
              <div>
                <span style={{ color: c, fontWeight:700 }}>
                  {city.dh > 0 ? `${city.dh}%` : 'Geplant'}
                </span>
                <span style={{ opacity:.6, marginLeft:4 }}>Fernwärmeanteil</span>
              </div>
              {city.net_km > 0 && (
                <div style={{ fontSize:11, opacity:.65, marginTop:2 }}>
                  Netz: {city.net_km.toLocaleString('de-DE')} km
                </div>
              )}
              <div style={{ fontSize:9, opacity:.45, marginTop:3 }}>Klick für Details</div>
            </Tooltip>
            <Popup className="det-popup-wrap" maxWidth={520} minWidth={420}>
              <CityPopup city={city} />
            </Popup>
          </CircleMarker>
        )
      })}

      {/* Planned / expansion cities */}
      {visiblePlanned.map((city, i) => {
        const c     = city.type === 'expand' ? '#5bafd6' : '#a78bfa'
        const km    = city.current_km || 0
        const r     = km >= 1000 ? 10 : km >= 300 ? 7 : 5
        return (
          <CircleMarker
            key={`fwp-${i}`}
            center={[city.lat, city.lng]}
            radius={r}
            pathOptions={{
              color: c,
              fillColor: c,
              fillOpacity: 0.45,
              weight: 2,
              dashArray: '4 3',
            }}
          >
            <Tooltip direction="top" offset={[0, -r-2]} opacity={0.97}>
              <div style={{ fontWeight:700, fontSize:13, color:'#fff', marginBottom:3 }}>
                🏙 {city.n}
              </div>
              <div style={{ fontSize:11, opacity:.75, marginBottom:4 }}>{city.op}</div>
              <div style={{ color: c, fontWeight:700 }}>
                {city.type === 'expand' ? '📈 Ausbau' : '🆕 Neuplanung'}
              </div>
              <div style={{ fontSize:11, opacity:.65, marginTop:2 }}>
                {city.current_km} → {city.target_km} km bis {city.target_year}
              </div>
              <div style={{ fontSize:9, opacity:.45, marginTop:3 }}>Klick für Details</div>
            </Tooltip>
            <Popup className="det-popup-wrap" maxWidth={520} minWidth={420}>
              <PlannedCityPopup city={city} />
            </Popup>
          </CircleMarker>
        )
      })}
    </>
  )
}
