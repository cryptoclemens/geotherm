// @ts-nocheck
import { useState } from 'react'
import { useLayerStore } from '../../store/useLayerStore'

// ── AqChips ────────────────────────────────────────────────────────────────
export function AqChips() {
  const { layers, toggle } = useLayerStore()
  const chips = [
    { key: 'aq-niederrhein', label: 'Niederrhein', color: '#4ecdc4' },
    { key: 'aq-norddeutsch', label: 'Norddeutsch', color: '#5bafd6' },
    { key: 'aq-molasse',     label: 'Molasse',     color: '#f0c040' },
    { key: 'aq-oberrhein',   label: 'Oberrhein',   color: '#e8a857' },
  ]
  return (
    <div className="aq-chips" role="group" aria-label="Aquifer-Filter">
      {chips.map(c => {
        const on = layers[c.key]
        return (
          <div
            key={c.key}
            role="checkbox"
            aria-checked={!!on}
            tabIndex={0}
            className={'aq-chip' + (on ? ' on' : '')}
            style={on ? { background: c.color + '33', borderColor: c.color } : {}}
            onClick={() => toggle(c.key)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(c.key))}
          >
            <div className="aq-chip-dot" style={{ background: c.color }} aria-hidden="true" />
            {c.label}
          </div>
        )
      })}
    </div>
  )
}

// ── SubItem ─────────────────────────────────────────────────────────────────
export function SubItem({ layerKey, label, dotColor, dotShape = 'circle', badge, children }) {
  const { layers, toggle } = useLayerStore()
  const on = layers[layerKey] ?? false

  const badgeLabel = badge === '⟳' ? 'lädt…' : badge === '✓' ? 'aktiv' : badge === '✗' ? 'Fehler' : badge

  return (
    <div className="sub-item">
      <div
        role="checkbox"
        aria-checked={on}
        aria-label={`Layer ${label} ${on ? 'deaktivieren' : 'aktivieren'}`}
        tabIndex={0}
        className={'sub-toggle' + (on ? ' on' : '')}
        onClick={() => toggle(layerKey)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(layerKey))}
      />
      {dotColor && (
        <div
          className={'sub-dot' + (dotShape === 'square' ? ' square' : '')}
          style={{ background: dotColor }}
          aria-hidden="true"
        />
      )}
      <span className="sub-label">{label}</span>
      {badge && (
        <span
          className="loading-badge"
          role="status"
          aria-label={`WMS-Status: ${badgeLabel}`}
          title={`Status: ${badgeLabel}`}
        >
          {badge}
        </span>
      )}
      {children}
    </div>
  )
}

// ── LayerGroup ───────────────────────────────────────────────────────────────
export default function LayerGroup({ id, label, dotColor, dotShape = 'square', groupKeys = [], defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const { setGroup, isGroupOn } = useLayerStore()
  const on = isGroupOn(groupKeys)

  return (
    <div className="layer-group">
      <div
        className="group-header"
        role="button"
        aria-expanded={open}
        aria-controls={id ? `layergroup-${id}` : undefined}
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(o => !o))}
      >
        <span className={'group-arrow' + (open ? ' open' : '')} aria-hidden="true">▶</span>
        <div
          role="checkbox"
          aria-checked={on}
          aria-label={`Gruppe ${label} ${on ? 'deaktivieren' : 'aktivieren'}`}
          tabIndex={0}
          className={'group-toggle' + (on ? ' on' : '')}
          onClick={e => { e.stopPropagation(); setGroup(groupKeys, !on) }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setGroup(groupKeys, !on) } }}
        />
        {dotColor && (
          <div
            className={'group-dot' + (dotShape === 'circle' ? ' circle' : '')}
            style={{ background: dotColor }}
            aria-hidden="true"
          />
        )}
        <span className="group-label">{label}</span>
      </div>
      <div
        id={id ? `layergroup-${id}` : undefined}
        className={'sub-layers' + (open ? ' open' : '')}
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  )
}
