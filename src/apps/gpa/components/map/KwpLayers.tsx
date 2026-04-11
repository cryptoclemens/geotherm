// @ts-nocheck
import { useEffect, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import { useLayerStore } from '../../store/useLayerStore'
import { useGpaStore } from '../../store/useGpaStore'

// ── TG-Raster: Farbskala nach Geothermie-Potenzial (T_P50_MW) ─────────────────
function tgRasterStyle(feature) {
  const mw = feature.properties?.T_P50_MW ?? feature.properties?.MT_P50_MW ?? 0
  let color
  if      (mw >= 20)  color = '#dc2626' // sehr hoch → rot
  else if (mw >= 10)  color = '#f97316' // hoch → orange
  else if (mw >= 5)   color = '#facc15' // mittel → gelb
  else if (mw > 0)    color = '#86efac' // gering → hellgrün
  else                color = '#94a3b8' // kein Potenzial → grau
  return { color, fillColor: color, fillOpacity: 0.45, weight: 0.5, opacity: 0.7 }
}

// ── Wärmecluster: Farbskala nach Wärmeliniendichte (WLD) ─────────────────────
function waermeclusterStyle(feature) {
  const wld = feature.properties?.WLD ?? 0
  let color
  if      (wld >= 500) color = '#22c55e' // sehr hoch → grün
  else if (wld >= 200) color = '#f59e0b' // hoch → gelb
  else if (wld >= 50)  color = '#94a3b8' // mittel → grau
  else                 color = '#64748b' // niedrig → dunkelgrau
  return { color, fillColor: color, fillOpacity: 0.3, weight: 1.5, opacity: 0.8 }
}

function row(label, value) {
  return `<div class="det-row"><span class="det-k">${label}</span><span class="det-v">${value}</span></div>`
}

// ── Popup: TG-Raster ─────────────────────────────────────────────────────────
function tgRasterPopupHtml(p) {
  const mw = p.T_P50_MW ?? p.MT_P50_MW ?? 0
  let color = mw >= 20 ? '#dc2626' : mw >= 10 ? '#f97316' : mw >= 5 ? '#facc15' : '#94a3b8'
  const rows = [
    p.T_P50_MW  != null ? row('Tiefe Geoth. P50',    `${p.T_P50_MW.toFixed(1)} MW`) : '',
    p.MT_P50_MW != null ? row('Mitteltiefe Geoth. P50', `${p.MT_P50_MW.toFixed(1)} MW`) : '',
    p.T_P50_GWh  != null ? row('Ertrag Tiefe Geoth.',   `${p.T_P50_GWh.toFixed(1)} GWh/a`) : '',
    p.MT_P50_GWh != null ? row('Ertrag Mitteltiefe',     `${p.MT_P50_GWh.toFixed(1)} GWh/a`) : '',
    p.Volllastst != null ? row('Volllaststunden',  `${Math.round(p.Volllastst).toLocaleString('de-DE')} h/a`) : '',
    p.Hinweis1   ? row('Hinweis', p.Hinweis1) : '',
  ].filter(Boolean).join('')
  return `<div class="det-popup-wrap"><div class="det-popup">
    <div class="det-header" style="border-color:${color}">
      <div class="det-title">🌋 TG-Potenzial-Rasterzelle</div>
      <div class="det-op">Tiefe/Mitteltiefe Geothermie (KWP NRW)</div>
    </div>
    <div class="det-body">${rows || '<div class="det-row"><span class="det-k">Potenzial</span><span class="det-v">keine Daten</span></div>'}
      <div class="det-disclaimer">Quelle: LANUK NRW / opengeodata.nrw.de</div>
    </div>
  </div></div>`
}

// ── Popup: Wärmecluster ──────────────────────────────────────────────────────
function waermeclusterPopupHtml(p) {
  const wld = p.WLD ?? 0
  const color = wld >= 500 ? '#22c55e' : wld >= 200 ? '#f59e0b' : '#94a3b8'
  const bestand = p.FW_Bestand === 1 ? 'Ja' : 'Nein'
  const rows = [
    p.Gemeinde          ? row('Gemeinde',          p.Gemeinde) : '',
    p.WLD        != null ? row('Wärmeliniendichte', `${p.WLD.toFixed(1)} MWh/m`) : '',
    p.WLD_2045   != null ? row('WLD 2045',          `${p.WLD_2045.toFixed(1)} MWh/m`) : '',
    p.Bed_Fernwaerme != null
      ? row('FW-Bedarf', `${(p.Bed_Fernwaerme / 1000).toFixed(1)} GWh/a`) : '',
    p.Verteilnetzlaenge != null
      ? row('Netzlänge', `${Math.round(p.Verteilnetzlaenge).toLocaleString('de-DE')} m`) : '',
    p.Anz_Besitzeinheiten != null
      ? row('Besitzeinheiten', p.Anz_Besitzeinheiten.toLocaleString('de-DE')) : '',
    row('FW-Bestand', bestand),
    p.FW_Ausbaucluster != null ? row('Ausbaucluster', p.FW_Ausbaucluster) : '',
  ].filter(Boolean).join('')
  return `<div class="det-popup-wrap"><div class="det-popup">
    <div class="det-header" style="border-color:${color}">
      <div class="det-title">♨️ ${p.Gemeinde || 'Wärmecluster'}</div>
      <div class="det-op">KWP Fernwärme-Ausbaupotenzial</div>
    </div>
    <div class="det-body">${rows}
      <div class="det-disclaimer">Quelle: LANUK NRW / opengeodata.nrw.de</div>
    </div>
  </div></div>`
}

// ── GeoJSON-Layer ─────────────────────────────────────────────────────────────
function KwpGeoJsonLayer({ dataUrl, styleFunc, popupHtmlFn, layerKey }) {
  const [data, setData] = useState(null)
  const { addLog } = useGpaStore.getState()

  useEffect(() => {
    fetch(dataUrl)
      .then(r => r.json())
      .then(json => {
        setData(json)
        addLog(`${layerKey}: ${json.features?.length ?? 0} Objekte geladen`, 'ok')
      })
      .catch(() => addLog(`${layerKey}: Ladefehler`, 'error'))
  }, [dataUrl]) // eslint-disable-line

  if (!data) return null

  return (
    <GeoJSON
      key={layerKey}
      data={data}
      style={styleFunc}
      onEachFeature={(feature, layer) => {
        layer.bindPopup(popupHtmlFn(feature.properties || {}), { maxWidth: 320 })
      }}
    />
  )
}

export default function KwpLayers() {
  const layers = useLayerStore(s => s.layers)

  return (
    <>
      {layers['kwp-energietraeger'] && (
        <KwpGeoJsonLayer
          dataUrl="geodata/kwp-energietraeger.geojson"
          styleFunc={tgRasterStyle}
          popupHtmlFn={tgRasterPopupHtml}
          layerKey="kwp-energietraeger"
        />
      )}
      {layers['kwp-waermecluster'] && (
        <KwpGeoJsonLayer
          dataUrl="geodata/kwp-waermecluster.geojson"
          styleFunc={waermeclusterStyle}
          popupHtmlFn={waermeclusterPopupHtml}
          layerKey="kwp-waermecluster"
        />
      )}
    </>
  )
}
