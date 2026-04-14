// @ts-nocheck
import { useState } from 'react'
import { useLayerStore } from '../../store/useLayerStore'

// Each entry has `keys` — the entry is shown only when at least one key is active
const LEGEND = [
  // ── Polygon layers ─────────────────────────────────────────────────────────
  { type:'row', keys:['tiefland-plain'],
    sw:{ background:'rgba(91,175,214,.25)', border:'1px dashed #5bafd6' },
    label:'Lockergestein-Gürtel' },
  { type:'row', keys:['aq-niederrhein'],
    sw:{ background:'rgba(78,205,196,.3)', border:'1px solid #4ecdc4' },
    label:'Niederrhein-Aquifer' },
  { type:'row', keys:['tiefland-rhein','aq-norddeutsch'],
    sw:{ background:'rgba(91,175,214,.25)', border:'1px solid #5bafd6' },
    label:'Norddeutscher Aquifer' },
  { type:'row', keys:['aq-molasse'],
    sw:{ background:'rgba(240,192,64,.3)', border:'1px solid #f0c040' },
    label:'Malmkarst / Molasse' },
  { type:'row', keys:['aq-oberrhein'],
    sw:{ background:'rgba(232,168,87,.3)', border:'1px solid #e8a857' },
    label:'Buntsandstein Oberrhein' },
  { type:'row', keys:['geo-bgr','geo-egdi','geo-huek250'],
    sw:{ background:'rgba(167,139,250,.2)', border:'1px solid #a78bfa' },
    label:'WMS Geologie (BGR)' },
  // ── Circle markers ─────────────────────────────────────────────────────────
  { type:'row', keys:['fw-cities-hi'],
    ci:true, sw:{ background:'#5bd68a', width:12, height:12 },
    label:'Fernwärme >50%' },
  { type:'row', keys:['fw-cities-mid'],
    ci:true, sw:{ background:'#e8a857', width:12, height:12 },
    label:'Fernwärme 30–50%' },
  { type:'row', keys:['fw-cities-lo'],
    ci:true, sw:{ background:'#5bafd6', width:12, height:12 },
    label:'Fernwärme 20–30%' },
  { type:'row', keys:['heat-dc'],
    ci:true, sw:{ background:'#a87cd6', width:10, height:10 },
    label:'Rechenzentrum (OSM)' },
  { type:'row', keys:['heat-pp'],
    ci:true, sw:{ background:'#d67c5b', width:10, height:10 },
    label:'Kraftwerk (OSM)' },
  { type:'row', keys:['heat-waste'],
    ci:true, sw:{ background:'#5bd6c8', width:10, height:10 },
    label:'Müllverbrennung (OSM)' },
  { type:'row', keys:['heat-steel'],
    ci:true, sw:{ background:'#d6c85b', width:10, height:10 },
    label:'Stahlwerk (OSM)' },
  { type:'row', keys:['aktionsraum'],
    sw:{ background:'rgba(214,91,91,.25)', border:'1px dashed #d65b5b' },
    label:'Aktionsraum' },
  // ── Geothermie-Höffigkeit ──────────────────────────────────────────────────
  { type:'section', keys:['geo-egdi','geo-bgr','geo-huek250','waerme-wms','waerme-bbsr'],
    label:'Geothermie-Höffigkeit' },
  { type:'row', keys:['geo-egdi'],
    sw:{ background:'rgba(91,214,200,.3)', border:'1px solid #5bd6c8' },
    label:'Lockergestein' },
  { type:'row', keys:['geo-bgr'],
    sw:{ background:'rgba(240,192,64,.25)', border:'1px solid #c8a840' },
    label:'Festgestein <1.000 m' },
  { type:'row', keys:['geo-huek250'],
    sw:{ background:'rgba(214,91,91,.25)', border:'1px solid #b05050' },
    label:'Festgestein >1.000 m' },
  // ── WMS Farblegende (GetLegendGraphic) ──────────────────────────────────────
  { type:'section', keys:['geo-egdi','geo-bgr','geo-huek250','waerme-wms','waerme-bbsr'],
    label:'WMS Farblegende' },
  { type:'wms-legend', keys:['geo-egdi'],
    url:'https://services.bgr.de/wms/geologie/igme5000/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&LAYER=3',
    label:'Geologie Europa (IGME5000)' },
  { type:'wms-legend', keys:['geo-bgr'],
    url:'https://services.bgr.de/wms/geologie/guek250/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&LAYER=0',
    label:'Geologie Oberfläche (GÜK250)' },
  { type:'wms-legend', keys:['geo-huek250'],
    url:'https://services.bgr.de/wms/grundwasser/huek250/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&LAYER=0',
    label:'Hydrogeologie (HÜK250)' },
  { type:'wms-legend', keys:['waerme-wms'],
    url:'https://www.gis-idmz.nrw.de/arcgis/services/stba/zensusatlas_energie_100m/MapServer/WMSServer?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&LAYER=0',
    label:'Zensus: Heizungsart' },
  { type:'wms-legend', keys:['waerme-bbsr'],
    url:'https://www.gis-idmz.nrw.de/arcgis/services/stba/zensusatlas_energie_100m/MapServer/WMSServer?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&LAYER=1',
    label:'Zensus: Energieträger' },
  // ── KWP: TG-Potenzial Raster ───────────────────────────────────────────────
  { type:'section', keys:['kwp-energietraeger'], label:'TG-Potenzial Raster (LANUK)' },
  { type:'scale', keys:['kwp-energietraeger'], items:[
    { color:'#dc2626', label:'Sehr hoch (>20 MW)' },
    { color:'#f97316', label:'Hoch (10–20 MW)' },
    { color:'#facc15', label:'Mittel (5–10 MW)' },
    { color:'#86efac', label:'Gering (<5 MW)' },
    { color:'#94a3b8', label:'Kein Potenzial' },
  ]},
  // ── KWP: FW-Ausbaucluster ──────────────────────────────────────────────────
  { type:'section', keys:['kwp-waermecluster'], label:'FW-Ausbaucluster (LANUK)' },
  { type:'scale', keys:['kwp-waermecluster'], items:[
    { color:'#22c55e', label:'Sehr hoch (WLD >500 MWh/m)' },
    { color:'#f59e0b', label:'Hoch (200–500 MWh/m)' },
    { color:'#94a3b8', label:'Mittel (50–200 MWh/m)' },
    { color:'#64748b', label:'Niedrig (<50 MWh/m)' },
  ]},
]

export default function Legend() {
  const [collapsed, setCollapsed] = useState(false)
  const layers = useLayerStore(s => s.layers)

  const visible = LEGEND.filter(e => e.keys.some(k => layers[k]))
  if (visible.length === 0) return null

  return (
    <div id="legend" className={collapsed ? 'collapsed' : ''}>
      <h3 onClick={() => setCollapsed(c => !c)}>
        <span>Legende</span>
        <span style={{fontSize:'11px',opacity:.7}}>{collapsed ? '▸' : '▾'}</span>
      </h3>
      <div id="legend-body">
        {visible.map((e, i) => {
          if (e.type === 'section') {
            return <div key={i} className="leg-section">{e.label}</div>
          }
          if (e.type === 'scale') {
            return (
              <div key={i} className="leg-scale">
                {e.items.map((item, j) => (
                  <div key={j} className="leg-row">
                    <div className="leg-sw" style={{ width:20, height:12, background:item.color, border:'none', opacity:.85 }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )
          }
          if (e.type === 'wms-legend') {
            return (
              <div key={i} className="leg-wms-block">
                <div className="leg-wms-title">{e.label}</div>
                <img
                  className="leg-wms-img"
                  src={e.url}
                  alt={`Legende: ${e.label}`}
                  loading="lazy"
                  onError={ev => { (ev.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )
          }
          // type === 'row'
          return (
            <div key={i} className="leg-row">
              <div
                className={'leg-sw' + (e.ci ? ' leg-ci' : '')}
                style={{ width: e.sw.width || 20, height: e.sw.height || 12, ...e.sw }}
              />
              <span>{e.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
