import { useState } from 'react'
import Ortssuche from './Ortssuche'
import LayerGroup, { SubItem, AqChips } from './LayerGroup'
import { useGpaStore } from '../../store/useGpaStore'

const SOURCES = [
  { color:'#5bafd6', name:'BGR Geologie (WMS)', desc:'GÜK250 · IGME5000 · HÜK250', type:'WMS' },
  { color:'#9b6ef0', name:'GeotIS (LIAG Hannover)', desc:'Geothermische Anlagenstandorte · Höffigkeitskarten A/B/D', type:'WMS' },
  { color:'#4ecdc4', name:'Aquifer-Atlas', desc:'Tiefenaquifer-Potenziale NW-Europa', type:'Intern' },
  { color:'#f0c040', name:'OpenStreetMap', desc:'Fernwärme-Netze · Wärmequellen', type:'OSM' },
  { color:'#5bd68a', name:'Fernwärme-Statistik', desc:'BWP · Stadtwerke-Berichte 2023', type:'Statistik' },
  // Hinweis: heat-abw nutzt OSM/Overpass (Raffinerie, Chemie, Papier, Glas), NICHT den echten BfEE-Abwärme-Atlas (MWh/a-Messwerte)
  { color:'#d67c5b', name:'Abwärmequellen (OSM)', desc:'Industrielle Abwärmepotenziale via OpenStreetMap (annähernd)', type:'OSM' },
  { color:'#e8a857', name:'Zensus 2022 (Destatis)', desc:'Heizungsart & Energieträger 100m', type:'WMS' },
  { color:'#22d3ee', name:'LANUK NRW – KWP', desc:'Kommunale Wärmeplanung NRW: Energieträger & Wärmecluster', type:'GeoJSON' },
]

interface WmsBadgeProps {
  layerKey: string
}

function WmsBadge({ layerKey }: WmsBadgeProps) {
  const wmsBadges = useGpaStore(s => s.wmsBadges)
  const status = wmsBadges[layerKey]
  if (!status)              return null
  if (status === 'probing') return <span className="wms-badge wms-probing" title="Bester Proxy wird ermittelt…">⏳</span>
  if (status === 'live')    return <span className="wms-badge wms-live"    title="WMS erreichbar">●</span>
  return <span className="wms-badge wms-error" title="WMS nicht erreichbar — Server offline oder CORS-Block">✗</span>
}

export default function Sidebar() {
  const [srcOpen, setSrcOpen] = useState(false)

  return (
    <div id="side">
      {/* Ortssuche */}
      <div className="side-section">
        <h3>Ortssuche</h3>
        <Ortssuche />
      </div>

      {/* Layer groups */}
      <div className="side-layers">
        <div className="side-layers-title">Layer</div>

        <LayerGroup
          id="basis"
          label="Basisdaten"
          dotColor="#5bafd6"
          groupKeys={['tiefland-plain','tiefland-rhein','aktionsraum']}
          defaultOpen={true}
        >
          <SubItem layerKey="tiefland-plain" label="Lockergestein-Gürtel" dotColor="#5bafd6" />
          <SubItem layerKey="tiefland-rhein" label="Norddeutscher Aquifer" dotColor="#5bafd6" />
          <SubItem layerKey="aktionsraum"    label="Aktionsraum" dotColor="#d65b5b" />
        </LayerGroup>

        <LayerGroup
          id="aq"
          label="Aquifer-Systeme"
          dotColor="#4ecdc4"
          dotShape="circle"
          groupKeys={['aq-niederrhein','aq-norddeutsch','aq-molasse','aq-oberrhein']}
          defaultOpen={true}
        >
          <AqChips />
        </LayerGroup>

        {/* GeotIS: behördliche Höffigkeitskarten (LIAG Hannover) */}
        <LayerGroup
          id="geotis"
          label="GeotIS – Höffigkeit (LIAG)"
          dotColor="#9b6ef0"
          dotShape="square"
          groupKeys={['geotis-standorte','geotis-hoeff-a','geotis-hoeff-b','geotis-hoeff-d']}
          defaultOpen={false}
        >
          <SubItem layerKey="geotis-standorte" label="Anlagenstandorte DE" dotColor="#9b6ef0" dotShape="circle" badge="WMS">
            <WmsBadge layerKey="geotis-standorte" />
          </SubItem>
          <div className="leg-section-label">Höffigkeitskarten</div>
          <SubItem layerKey="geotis-hoeff-a" label="Hydrothermisch – nachgewiesen (A)" dotColor="#7b4fd0" dotShape="square" badge="WMS">
            <WmsBadge layerKey="geotis-hoeff-a" />
          </SubItem>
          <SubItem layerKey="geotis-hoeff-b" label="Hydrothermisch – vermutet (B)" dotColor="#a06ee0" dotShape="square" badge="WMS">
            <WmsBadge layerKey="geotis-hoeff-b" />
          </SubItem>
          <SubItem layerKey="geotis-hoeff-d" label="Gesamtübersicht A+B+C (D)" dotColor="#c090f0" dotShape="square" badge="WMS">
            <WmsBadge layerKey="geotis-hoeff-d" />
          </SubItem>
        </LayerGroup>

        <LayerGroup
          id="geo"
          label="Geologie / Hydrogeologie"
          dotColor="#a78bfa"
          dotShape="square"
          groupKeys={['geo-egdi','geo-bgr','geo-huek250','waerme-wms','waerme-bbsr']}
          defaultOpen={false}
        >
          {/* geo-egdi: IGME5000 = europäische Oberflächengeologie, kein Tiefenindikator */}
          <SubItem layerKey="geo-egdi"    label="Geologie Europa (IGME5000)" dotColor="#5bd6c8" dotShape="square" badge="WMS">
            <WmsBadge layerKey="geo-egdi" />
          </SubItem>
          {/* geo-bgr: GÜK250 = geologische Übersichtskarte Oberfläche, KEINE Tiefeninfo */}
          <SubItem layerKey="geo-bgr"     label="Geologie Oberfläche (GÜK250)"    dotColor="#c8a840" dotShape="square" badge="WMS">
            <WmsBadge layerKey="geo-bgr" />
          </SubItem>
          {/* geo-huek250: HÜK250 = Hydrogeologie bis ~100 m, NICHT für Tiefenaquifere >1000 m */}
          <SubItem layerKey="geo-huek250" label="Hydrogeologie oberflächennah (HÜK250)" dotColor="#b05050" dotShape="square" badge="WMS">
            <WmsBadge layerKey="geo-huek250" />
          </SubItem>
          <div className="leg-section-label">Zensus 2022</div>
          <SubItem layerKey="waerme-wms"  label="Heizungsart (ab Zoom 12)"  dotColor="#e8a857" dotShape="square" badge="WMS">
            <WmsBadge layerKey="waerme-wms" />
          </SubItem>
          <SubItem layerKey="waerme-bbsr" label="Energieträger (ab Zoom 12)" dotColor="#e8c857" dotShape="square" badge="WMS">
            <WmsBadge layerKey="waerme-bbsr" />
          </SubItem>
        </LayerGroup>

        <LayerGroup
          id="waerme"
          label="(Ab-)Wärmeproduzenten"
          dotColor="#d67c5b"
          dotShape="circle"
          groupKeys={['heat-dc','heat-pp','heat-waste','heat-steel','heat-abw']}
          defaultOpen={false}
        >
          <SubItem layerKey="heat-dc"    label="Rechenzentren (OSM)"     dotColor="#a87cd6" dotShape="circle" />
          <SubItem layerKey="heat-pp"    label="Kraftwerke (OSM)"        dotColor="#d67c5b" dotShape="circle" />
          <SubItem layerKey="heat-waste" label="Müllverbrennung (OSM)"   dotColor="#5bd6c8" dotShape="circle" />
          <SubItem layerKey="heat-steel" label="Stahlwerke (OSM)"        dotColor="#d6c85b" dotShape="circle" />
          {/* heat-abw: OSM-Abfrage (Raffinerie, Chemie, Papier, Glas), KEIN echter BfEE-Abwärme-Atlas */}
          <SubItem layerKey="heat-abw"   label="Industrieabwärme (OSM, annähernd)" dotColor="#e8a857" dotShape="circle" />
        </LayerGroup>

        <LayerGroup
          id="kwp"
          label="Wärmeplanung NRW (KWP)"
          dotColor="#22d3ee"
          dotShape="square"
          groupKeys={['kwp-energietraeger','kwp-waermecluster']}
          defaultOpen={false}
        >
          <SubItem layerKey="kwp-energietraeger" label="TG-Potenzial Raster"      dotColor="#f97316" dotShape="square" badge="LANUK" />
          <SubItem layerKey="kwp-waermecluster"  label="FW-Ausbaucluster"          dotColor="#22c55e" dotShape="square" badge="LANUK" />
        </LayerGroup>

        <LayerGroup
          id="cities"
          label="Fernwärme-Märkte"
          dotColor="#5bd68a"
          dotShape="circle"
          groupKeys={['fw-cities-hi','fw-cities-mid','fw-cities-lo']}
          defaultOpen={false}
        >
          <SubItem layerKey="fw-cities-hi"  label="Fernwärme &gt;50%"   dotColor="#5bd68a" dotShape="circle" />
          <SubItem layerKey="fw-cities-mid" label="Fernwärme 30–50%"    dotColor="#e8a857" dotShape="circle" />
          <SubItem layerKey="fw-cities-lo"  label="Fernwärme 20–30%"    dotColor="#5bafd6" dotShape="circle" />
          <div className="leg-section-label">Ausbau</div>
          <SubItem layerKey="fw-expand" label="FW-Ausbau geplant"   dotColor="#5bd68a" dotShape="circle" badge="Neu" />
          <SubItem layerKey="fw-new"    label="Neuanschluss-Gebiete" dotColor="#a87cd6" dotShape="circle" badge="Neu" />
        </LayerGroup>
      </div>

      {/* Sources panel */}
      <div id="sources-panel" className={srcOpen ? '' : 'collapsed'}>
        <h3 onClick={() => setSrcOpen(o => !o)}>
          <span>Quellen</span>
          <span style={{fontSize:'9px',opacity:.6}}>{srcOpen ? '▾' : '▸'}</span>
        </h3>
        <div className="src-scroll">
          {SOURCES.map(s => (
            <div className="src-row" key={s.name}>
              <div className="src-dot" style={{background:s.color}} />
              <div className="src-text">
                <div className="src-name">{s.name}</div>
                <div className="src-desc">{s.desc}</div>
                <span className="src-type">{s.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
