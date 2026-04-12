// @ts-nocheck
import { useState } from 'react'
import { useGpaStore } from '../../store/useGpaStore'
import { FW_CITIES } from '../../data/fwCities'
import { getMapInstance } from '../../lib/mapInstance'

const PRINT_OPTIONS = [
  { key: 'fw',    label: 'Fernwärme-Städte' },
  { key: 'dc',    label: 'Rechenzentren (OSM)' },
  { key: 'pp',    label: 'Kraftwerke (OSM)' },
  { key: 'waste', label: 'Müllverbrennung (OSM)' },
  { key: 'steel', label: 'Stahlwerke (OSM)' },
]

function geoHint(lat, lng) {
  if (lat >= 51.2 && lat <= 51.75 && lng >= 6.85 && lng <= 7.85)
    return '⚪ Festgestein (Ruhrgebiet / Karbon)'
  if (lat >= 50.5 && lat <= 51.8 && lng >= 5.5 && lng <= 6.85)
    return '🟢 Lockergestein (Niederrheinische Bucht)'
  if (lat >= 50.5 && lat <= 51.1 && lng >= 6.5 && lng <= 7.1)
    return '🟢 Lockergestein (Kölner Bucht)'
  if (lat >= 52.0 && lng >= 6.0 && lng <= 14.0)
    return '🟢 Lockergestein (Norddeutsches Tiefland)'
  if (lat >= 47.5 && lat <= 49.5 && lng >= 7.0 && lng <= 9.0)
    return '🟢 Lockergestein (Oberrhein)'
  if (lat >= 48.0 && lat <= 49.5 && lng >= 10.0 && lng <= 13.5)
    return '🔵 Lockergestein (Molasse Oberbayern)'
  return '⚪ Festgestein / unbekannt'
}

function geoClass(hint) {
  if (hint.includes('Locker')) return 'geo-green'
  if (hint.includes('Molasse')) return 'geo-blue'
  return 'geo-grey'
}

function secHtml(title, color, rows, useBounds) {
  if (!rows.length) return ''
  const header = '<tr><th style="width:22%">Name</th><th style="width:10%">Ort</th><th style="width:10%">Kat.</th><th style="width:20%">Kennzahlen</th><th style="width:38%">Geothermie-Potenzial</th></tr>'
  return `<div class="section"><div class="sec-head" style="border-color:${color}"><span class="sec-title">${title}</span><span class="sec-count">${rows.length} ${useBounds ? 'im Ausschnitt' : 'gesamt'}</span></div><table><thead>${header}</thead><tbody>${rows.join('')}</tbody></table></div>`
}

function buildPrintHTML(selected, region, heatMarkers) {
  const map = getMapInstance()
  const bounds = map ? map.getBounds() : null
  const useBounds = region === 'viewport' && bounds
  const now = new Date().toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
  const boundsStr = useBounds
    ? `${bounds.getSouth().toFixed(2)}°N–${bounds.getNorth().toFixed(2)}°N, ${bounds.getWest().toFixed(2)}°E–${bounds.getEast().toFixed(2)}°E`
    : 'Gesamtbestand'

  let fwRows = []
  if (selected.includes('fw')) {
    const cities = useBounds ? FW_CITIES.filter(c => bounds.contains([c.lat, c.lng])) : FW_CITIES
    fwRows = cities.map(c => {
      const geo = geoHint(c.lat, c.lng)
      const kenn = `FW-Anteil: ${c.dh > 0 ? c.dh + '%' : 'Geplant'}<br>Netz: ${c.net_km > 0 ? c.net_km.toLocaleString('de-DE') + ' km' : '–'}<br>Pop: ${c.pop} Mio.`
      return `<tr><td class="name">🏙 ${c.n}</td><td class="ort">${c.c}</td><td class="kat">FW-Netz</td><td class="kenn">${kenn}</td><td class="begruend">${c.src_mix || '–'}<br><span class="${geoClass(geo)}">${geo}</span></td></tr>`
    })
  }

  const osmConfig = {
    dc:    { label: '🖥 Rechenzentren (OSM)',          color: '#6b3fa0', kat: 'Rechenzentrum',   kenn: d => `Typ: RZ / Colocation<br>Status: ${d.status || '–'}` },
    pp:    { label: '⚡ Kraftwerke & Industrie (OSM)', color: '#a04a2a', kat: 'Kraftwerk / Ind.', kenn: d => `Brennstoff: ${(d.tags && (d.tags['plant:source'] || d.tags.fuel)) || '–'}<br>Status: ${d.status || '–'}` },
    waste: { label: '♻ Müllverbrennung MVA (OSM)',     color: '#1a8a80', kat: 'MVA',              kenn: d => `Anlage: MVA / MHKW<br>Status: ${d.status || '–'}` },
    steel: { label: '🏭 Stahl- & Hüttenwerke (OSM)',  color: '#8a7a10', kat: 'Stahl / Hütte',   kenn: d => `Typ: ${(d.tags && (d.tags.industrial || d.tags.product)) || '–'}<br>Abwärme: typ. >400 GWh/a` },
  }

  let osmSections = ''
  Object.entries(osmConfig).forEach(([key, cfg]) => {
    if (!selected.includes(key)) return
    const all = (heatMarkers && heatMarkers[`heat-${key}`]) || []
    const markers = useBounds ? all.filter(d => bounds.contains([d.lat, d.lng])) : all
    const rows = markers.map(d => {
      const geo = geoHint(d.lat, d.lng)
      const ort = (d.tags && (d.tags['addr:city'] || d.tags['addr:town'])) || ''
      return `<tr><td class="name">${d.name || '(unbenannt)'}</td><td class="ort">${ort}</td><td class="kat">${cfg.kat}</td><td class="kenn">${cfg.kenn(d)}</td><td class="begruend">Abwärme geothermisch nutzbar<br><span class="${geoClass(geo)}">${geo}</span></td></tr>`
    })
    osmSections += secHtml(cfg.label, cfg.color, rows, useBounds)
  })

  const totalCount = fwRows.length + Object.keys(osmConfig).reduce((s, key) => {
    if (!selected.includes(key)) return s
    const all = (heatMarkers && heatMarkers[`heat-${key}`]) || []
    return s + (useBounds ? all.filter(d => bounds.contains([d.lat, d.lng])).length : all.length)
  }, 0)

  const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;padding:28px 36px;font-size:12px}h1{font-family:Georgia,serif;font-size:20px;margin-bottom:3px;color:#0d1b2a}.meta{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}.total{font-size:11px;color:#1d5a96;font-weight:600;margin-bottom:22px}.section{margin-bottom:22px;break-inside:avoid}.sec-head{display:flex;justify-content:space-between;align-items:baseline;padding:6px 10px;background:#f0f4fa;margin-bottom:0;border-left:4px solid #ccc}.sec-title{font-weight:700;font-size:12px;color:#1a1a2e}.sec-count{font-size:10px;color:#888}table{width:100%;border-collapse:collapse;font-size:11px}th{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#888;padding:5px 8px;background:#fafafe;border-bottom:2px solid #e0e4f0;text-align:left;white-space:nowrap}td{padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top;line-height:1.45}td.name{font-weight:600;color:#1a1a2e;width:22%}td.ort{color:#555;width:10%;white-space:nowrap}td.kat{color:#555;width:10%;white-space:nowrap}td.kenn{color:#334;width:20%;font-size:10px}td.begruend{color:#444;width:38%;font-size:10.5px}.geo-green{color:#1a7a30;font-weight:500}.geo-blue{color:#1a4a8a;font-weight:500}.geo-grey{color:#666}.no-print{margin-bottom:20px;display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #e0e4f0}.print-btn{padding:7px 18px;background:#1d5a96;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-weight:600}.print-hint{font-size:11px;color:#888}.footer{font-size:9px;color:#bbb;margin-top:24px;padding-top:8px;border-top:1px solid #eee;display:flex;justify-content:space-between}@media print{.no-print{display:none!important}body{padding:12px 20px}}`

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Geothermie — Potentiale im Ausschnitt</title><style>${css}</style></head><body><div class="no-print"><button class="print-btn" onclick="window.print()">🖨 Jetzt drucken</button><span class="print-hint">Tipp: Querformat + „Hintergrundgrafiken" aktivieren.</span></div><h1>Geothermie-Potential-Atlas — Potentiale im Ausschnitt</h1><p class="meta">${boundsStr} · Stand: ${now}</p><p class="total">${totalCount} Potentiale identifiziert</p>${secHtml('🌡 Fernwärme-Städte', '#1d5a96', fwRows, useBounds)}${osmSections}<div class="footer"><span>Geothermie-Potential-Atlas · Quellen: OpenStreetMap, BGR, AGFW/Euroheat</span><span>⚪ Geologie: grobe Heuristik</span></div></body></html>`
}

export default function PrintDialog() {
  const { printDialogOpen, hidePrintDialog, heatMarkers } = useGpaStore()
  const [selected, setSelected] = useState(['fw', 'dc'])
  const [region, setRegion]   = useState('viewport')

  if (!printDialogOpen) return null

  function toggleOption(key) {
    setSelected(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key])
  }

  function handlePrint() {
    hidePrintDialog()
    const html = buildPrintHTML(selected, region, heatMarkers)
    const w = window.open('', '_blank')
    if (!w) { alert('Bitte Pop-up-Fenster für diese Seite erlauben.'); return }
    w.document.write(html)
    w.document.close()
  }

  return (
    <div id="print-dialog-backdrop" onClick={hidePrintDialog}>
      <div id="print-dialog" onClick={e => e.stopPropagation()}>
        <div id="print-dialog-hdr">
          <span>🖨 Karte drucken / exportieren</span>
          <button id="print-dialog-close" onClick={hidePrintDialog}>×</button>
        </div>
        <div id="print-dialog-body">
          <div className="pd-section">
            <div className="pd-section-label">Sichtbare Layer</div>
            <div className="pd-options">
              {PRINT_OPTIONS.map(opt => (
                <label key={opt.key} className="pd-option">
                  <input type="checkbox" checked={selected.includes(opt.key)} onChange={() => toggleOption(opt.key)} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="pd-section">
            <div className="pd-section-label">Ausschnitt</div>
            <div className="pd-options">
              {[{val:'viewport',label:'Aktueller Viewport'},{val:'aktionsraum',label:'Aktionsraum'},{val:'nrw',label:'NRW gesamt'}].map(opt => (
                <label key={opt.val} className="pd-option">
                  <input type="radio" name="region" value={opt.val} checked={region === opt.val} onChange={() => setRegion(opt.val)} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="pd-hint">💡 Öffnet neuen Tab mit formatierter Liste — dort „Jetzt drucken" klicken.</div>
        </div>
        <div id="print-dialog-footer">
          <button className="pd-btn-cancel" onClick={hidePrintDialog}>Abbrechen</button>
          <button className="pd-btn-print" onClick={handlePrint}>🖨 Vorschau öffnen</button>
        </div>
      </div>
    </div>
  )
}
