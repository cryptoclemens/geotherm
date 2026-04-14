// @ts-nocheck
import { useState } from 'react'
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore'
import { getMapInstance } from '../../lib/mapInstance'

const POTENTIAL_COLOR = {
  'sehr hoch': '#16a34a',
  'hoch':      '#d97706',
  'mittel':    '#64748b',
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(iso))
}

export default function SearchResultsPanel() {
  const geoSpots          = useWorkspaceStore(s => s.geoSpots)
  const queryContext      = useWorkspaceStore(s => s.queryContext)
  const clearGeoSpots     = useWorkspaceStore(s => s.clearGeoSpots)
  const saveCurrentSearch = useWorkspaceStore(s => s.saveCurrentSearch)
  const loadSavedSearch   = useWorkspaceStore(s => s.loadSavedSearch)
  const deleteSavedSearch = useWorkspaceStore(s => s.deleteSavedSearch)
  const savedSearches     = useWorkspaceStore(s => s.savedSearches)

  const [expandedIdx, setExpandedIdx] = useState(null)
  const [tab, setTab]       = useState('current')  // 'current' | 'saved'
  const [saved, setSaved]   = useState(false)      // kurzfristiges Feedback nach Speichern
  const [collapsed, setCollapsed] = useState(false)

  const hasCurrent = geoSpots && geoSpots.length > 0

  // Panel nur zeigen wenn es aktuelle Ergebnisse ODER gespeicherte Suchen gibt
  if (!hasCurrent && savedSearches.length === 0) return null

  function handleSpotClick(spot, idx) {
    const map = getMapInstance()
    if (map) map.flyTo([spot.lat, spot.lng], 11, { duration: 1.5, animate: true })
    setExpandedIdx(expandedIdx === idx ? null : idx)
  }

  function handleSave() {
    saveCurrentSearch()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleLoadSearch(id) {
    loadSavedSearch(id)
    setTab('current')
    setExpandedIdx(null)
  }

  return (
    <div id="geo-spots-panel" className={collapsed ? 'collapsed' : ''}>
      {/* Header */}
      <div id="geo-spots-hdr" onClick={() => setCollapsed(c => !c)} style={{ cursor: 'pointer' }}>
        <div id="geo-spots-hdr-text">
          <div id="geo-spots-title">🔍 KI-Standortsuche</div>
          {!collapsed && tab === 'current' && hasCurrent && (
            <div id="geo-spots-context">{queryContext}</div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }} onClick={e => e.stopPropagation()}>
          {/* Speichern-Button (nur wenn aktuelle Ergebnisse) */}
          {!collapsed && tab === 'current' && hasCurrent && (
            <button
              className="geo-spots-save-btn"
              onClick={handleSave}
              title="Suche speichern"
              style={{ color: saved ? '#16a34a' : undefined }}
            >
              {saved ? '✓' : '⭐'}
            </button>
          )}
          <span id="geo-spots-toggle" title={collapsed ? 'Aufklappen' : 'Einklappen'}>
            {collapsed ? '▸' : '▾'}
          </span>
        </div>
      </div>

      {/* Tab-Switcher wenn gespeicherte Suchen vorhanden */}
      {savedSearches.length > 0 && (
        <div id="geo-spots-tabs">
          <button
            className={`geo-spots-tab${tab === 'current' ? ' geo-spots-tab--active' : ''}`}
            onClick={() => setTab('current')}
          >
            Aktuell{hasCurrent ? ` (${geoSpots.length})` : ''}
          </button>
          <button
            className={`geo-spots-tab${tab === 'saved' ? ' geo-spots-tab--active' : ''}`}
            onClick={() => setTab('saved')}
          >
            Gespeichert ({savedSearches.length})
          </button>
        </div>
      )}

      {/* Aktuelle Ergebnisse */}
      {tab === 'current' && (
        <div id="geo-spots-list">
          {!hasCurrent ? (
            <div id="geo-spots-empty">Keine aktive Suche.<br/>Frag den KI-Assistenten auf dem Dashboard.</div>
          ) : (
            geoSpots.map((spot, i) => {
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
            })
          )}
        </div>
      )}

      {/* Gespeicherte Suchen */}
      {tab === 'saved' && (
        <div id="geo-spots-list">
          {savedSearches.map((search) => (
            <div key={search.id} className="geo-saved-item">
              <div className="geo-saved-row" onClick={() => handleLoadSearch(search.id)}>
                <div className="geo-saved-meta">
                  <div className="geo-saved-name">{search.name}</div>
                  <div className="geo-saved-sub">{search.spots.length} Standorte · {formatDate(search.savedAt)}</div>
                </div>
                <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                  <button className="geo-saved-load">Laden</button>
                  <button
                    className="geo-saved-del"
                    onClick={e => { e.stopPropagation(); deleteSavedSearch(search.id) }}
                    title="Löschen"
                  >×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div id="geo-spots-footer">
        {tab === 'current' && hasCurrent ? (
          <span id="geo-spots-hint">Klick → Karte springt hin · ⭐ Suche speichern</span>
        ) : (
          <span id="geo-spots-hint">Klick auf Eintrag lädt die Suche zurück</span>
        )}
      </div>
    </div>
  )
}
