// @ts-nocheck
import { Polygon, Tooltip } from 'react-leaflet'
import { useLayerStore } from '../../store/useLayerStore'
import { AQUIFER_LAYERS } from '../../data/layers'

export default function AquiferLayers() {
  const layers = useLayerStore(s => s.layers)

  return (<>
    {Object.entries(AQUIFER_LAYERS).map(([key, aq]) =>
      layers[key] && (
        <Polygon
          key={key}
          positions={aq.coords}
          pathOptions={{ color: aq.color, weight:2, opacity:.9, fillColor: aq.color, fillOpacity:.10, dashArray:'8,4' }}
        >
          <Tooltip sticky className="ctt">
            <strong>{aq.name}</strong><br/>
            {aq.formation}<br/>
            Tiefe: {aq.depth} · {aq.temp}<br/>
            <em>{aq.note}</em>
          </Tooltip>
        </Polygon>
      )
    )}
  </>)
}
