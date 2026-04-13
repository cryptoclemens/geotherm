// @ts-nocheck
import { useState } from 'react'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'
import { getMapInstance } from '../../lib/mapInstance'

const POTENTIAL_COLOR = {
  'sehr hoch': '#16a34a',
  'hoch':      '#d97706',
  'mittel':    '#64748b',
}

export default function SearchResultsPanel() {
  const geoSpots    = useWorkspaceStore(s => s.geoSpots)
  const queryContext = useWorkspaceStore(s => s.queryContext)
  const clearGeoSpots = useWorkspaceStore(s => s.clearGeoSpots)
  const [expandedIdx, setExpandedIdx] = useState(null)

  if (!geoSpots || geoSpots.length === 0) return null

  function handleSpotClick(spot, idx) {
    const map = getMapInstance()
    if (map) map.flyTo([spot.lat, spot.lng], 11, { duration: 1.5, animate: true })
    setExpandedIdx(expandedIdx === idx ? null : idx)
  }

  return (
    <div id="geo-spots-panel">
      <div id="geo-spots-hdr">
        <div id="geo-spots-hdr-text">
          <div id="geo-spots-title">🔍 KI-Standortsuche</div>
          <div id="geo-spots-context">{queryContext}</div>
        </div>
        <button id="geo-spots-close" onClick={() => { clearGeoSpots(); setExpandedIdx(null) }} title="Ergebnisse schließen">×</button>
      </div>
      <div id="geo-spots-list">
        {geoSpots.map((spot, i) => {
          const color = POTENTIAL_COLOR[spot.potential] ?? '#64748b'
          const isExpanded = expandedIdx === i
          return (
            <div
              key={i}
              className={`geo-spot-item${isExpanded ? ' geo-spot-item--active' : ''}`}
              onClick={() => handleSpotClick(spot, i)}
            >
              <div className="geo-spot-row">
                <span className="geo-spot-num" style={{ background: color }}>{i + 1}</span>
                <div className="geo-spot-meta">
                  <div className="geo-spot-name">{spot.name}</div>
                  <div className="geo-spot-sub">{spot.aquifer} · {spot.depth} · {spot.temperature}</div>
                </div>
                <span className="geo-spot-badge" style={{ color, borderColor: color }}>{spot.potential}</span>
              </div>
              {isExpanded && (
                <div className="geo-spot-explanation">{spot.explanation}</div>
              )}
            </div>
          )
        })}
      </div>
      <div id="geo-spots-footer">
        <span id="geo-spots-hint">Klick auf Eintrag → Karte springt hin · erneuter Klick blendet Details ein/aus</span>
      </div>
    </div>
  )
}
