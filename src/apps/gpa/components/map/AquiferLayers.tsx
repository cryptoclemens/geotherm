import { Polygon, Popup, Tooltip } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import { useLayerStore } from '../../store/useLayerStore'
import { AQUIFER_LAYERS } from '../../data/layers'

// GeotIS-Atlas-Deeplink für jeden Aquifer
const GEOTIS_LINKS: Record<string, string> = {
  'aq-niederrhein': 'https://www.geotis.de/geotispage/homepage/wms',
  'aq-norddeutsch':  'https://www.geotis.de/geotispage/homepage/wms',
  'aq-molasse':      'https://www.geotis.de/geotispage/homepage/wms',
  'aq-oberrhein':    'https://www.geotis.de/geotispage/homepage/wms',
}

export default function AquiferLayers() {
  const layers = useLayerStore(s => s.layers)

  return (<>
    {Object.entries(AQUIFER_LAYERS).map(([key, aq]) =>
      layers[key] && (
        <Polygon
          key={key}
          positions={aq.coords as LatLngTuple[]}
          pathOptions={{ color: aq.color, weight:2, opacity:.9, fillColor: aq.color, fillOpacity:.10, dashArray:'8,4' }}
        >
          <Tooltip sticky className="ctt">
            <strong>{aq.name}</strong><br/>
            {aq.formation}<br/>
            Tiefe: {aq.depth} · {aq.temp}<br/>
            <em>{aq.note}</em>
          </Tooltip>
          <Popup className="det-popup-wrap" maxWidth={280}>
            <div className="det-popup">
              <div className="det-header" style={{ borderColor: aq.color }}>
                <div className="det-title">{aq.name}</div>
                <div className="det-op">Aquifer-System</div>
              </div>
              <div className="det-body">
                <div className="det-row">
                  <span className="det-k">Formation</span>
                  <span className="det-v">{aq.formation}</span>
                </div>
                <div className="det-row">
                  <span className="det-k">Tiefe</span>
                  <span className="det-v">{aq.depth}</span>
                </div>
                <div className="det-row">
                  <span className="det-k">Temperatur</span>
                  <span className="det-v">{aq.temp}</span>
                </div>
                <div className="det-row">
                  <span className="det-k">Potenzial</span>
                  <span className="det-v">{aq.note}</span>
                </div>
                <div className="det-disclaimer">
                  ⚠️ Indikative Strukturdaten. Für belastbare Aussagen: Untergrundtemperatur,
                  Transmissivität und Wasserchemie erforderlich.
                </div>
                {GEOTIS_LINKS[key] && (
                  <a
                    href={GEOTIS_LINKS[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="det-link"
                  >
                    GeotIS-Atlas öffnen →
                  </a>
                )}
              </div>
            </div>
          </Popup>
        </Polygon>
      )
    )}
  </>)
}
