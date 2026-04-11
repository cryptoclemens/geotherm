// @ts-nocheck
import { Polygon, Tooltip } from 'react-leaflet'
import { useLayerStore } from '../../store/useLayerStore'
import { TIEFLAND_PLAIN, TIEFLAND_RHEIN, HOEFF_LOCKER_POLYS, AKTIONSRAUM } from '../../data/layers'

export default function BaseLayers() {
  const layers = useLayerStore(s => s.layers)

  return (<>
    {layers['tiefland-plain'] && (
      <Polygon
        positions={TIEFLAND_PLAIN}
        pathOptions={{ color:'#5bafd6', weight:1, opacity:.6, fillColor:'#5bafd6', fillOpacity:.08, dashArray:'6,4' }}
      >
        <Tooltip sticky className="ctt">Tiefland-Gürtel · Norddeutsches Lockergestein</Tooltip>
      </Polygon>
    )}
    {layers['tiefland-rhein'] && (
      <Polygon
        positions={TIEFLAND_RHEIN}
        pathOptions={{ color:'#d65b5b', weight:2, opacity:.8, fillColor:'#d65b5b', fillOpacity:.12, dashArray:'6,3' }}
      >
        <Tooltip sticky className="ctt">Rheinland · Kernarbeitsgebiet</Tooltip>
      </Polygon>
    )}
    {layers['aktionsraum'] && (
      <Polygon
        positions={AKTIONSRAUM}
        pathOptions={{ color:'#d65b5b', weight:2, opacity:.9, fillColor:'#d65b5b', fillOpacity:.12, dashArray:'6,3' }}
      >
        <Tooltip sticky className="ctt">
          <strong style={{color:'#d65b5b'}}>Aktionsraum</strong><br/>
          <small style={{color:'#8aaac4'}}>Rheinisches Revier — Niederrheinische Bucht</small>
        </Tooltip>
      </Polygon>
    )}
    {layers['hoeff-locker'] && HOEFF_LOCKER_POLYS.map((p, i) => (
      <Polygon
        key={i}
        positions={p.coords}
        pathOptions={{ color:'#5bd6c8', weight:1.5, opacity:.8, fillColor:'#5bd6c8', fillOpacity:.13, dashArray:'5,3' }}
      >
        <Tooltip sticky className="ctt">
          <strong>{p.label}</strong><br/>
          Aquifer: {p.aquifer}<br/>
          Tiefe: {p.depth} · {p.temp}
        </Tooltip>
      </Polygon>
    ))}
  </>)
}
