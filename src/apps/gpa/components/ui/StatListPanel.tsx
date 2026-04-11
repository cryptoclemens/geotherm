// @ts-nocheck
import { useGpaStore } from '../../store/useGpaStore'

const CAT_LABELS = {
  dc:    { title: 'Rechenzentren', icon: '🖥', color: '#5bafd6' },
  pp:    { title: 'Kraftwerke (EE)',  icon: '⚡', color: '#5bd68a' },
  waste: { title: 'Müllverbrennung',  icon: '🔥', color: '#e8a857' },
  steel: { title: 'Stahlwerke',       icon: '🏭', color: '#d65b5b' },
  abw:   { title: 'Abwärme (BfEE)',   icon: '♨', color: '#a85bd6' },
  fw:    { title: 'Fernwärme-Städte', icon: '🏙', color: '#5bd6c8' },
}

export default function StatListPanel() {
  const { statListOpen, statListCategory, statListItems, hideStatList } = useGpaStore()

  if (!statListOpen) return null

  const meta = CAT_LABELS[statListCategory] || { title: 'Objekte', icon: '📍', color: '#5bafd6' }

  function flyTo(item) {
    if (window._map && item.lat && item.lng) {
      window._map.flyTo([item.lat, item.lng], 13, { duration: 1.2 })
      hideStatList()
    }
  }

  return (
    <div id="stat-list-backdrop" onClick={hideStatList}>
      <div id="stat-list-panel" onClick={e => e.stopPropagation()}>
        <div id="stat-list-hdr" style={{ borderColor: meta.color }}>
          <span id="stat-list-title">
            <span style={{ marginRight: 6 }}>{meta.icon}</span>
            {meta.title}
            <span id="stat-list-count">({statListItems.length})</span>
          </span>
          <button id="stat-list-close" onClick={hideStatList}>×</button>
        </div>
        <div id="stat-list-body">
          {statListItems.length === 0 && (
            <div id="stat-list-empty">Keine Objekte im aktuellen Viewport.</div>
          )}
          {statListItems.map((item, i) => (
            <div
              key={i}
              className="stat-list-item"
              onClick={() => flyTo(item)}
              title={item.lat ? 'Zur Karte springen' : ''}
            >
              <span className="sli-dot" style={{ background: meta.color }} />
              <span className="sli-name">{item.name || item.tags?.name || 'Unbekannt'}</span>
              {item.tags?.operator && (
                <span className="sli-op">{item.tags.operator}</span>
              )}
            </div>
          ))}
        </div>
        <div id="stat-list-footer">
          <span id="stat-list-hint">Klick auf Eintrag → Karte springt hin</span>
        </div>
      </div>
    </div>
  )
}
