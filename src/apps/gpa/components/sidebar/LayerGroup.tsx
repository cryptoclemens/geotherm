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
    <div className="aq-chips">
      {chips.map(c => {
        const on = layers[c.key]
        return (
          <div
            key={c.key}
            className={'aq-chip' + (on ? ' on' : '')}
            style={on ? { background: c.color + '33', borderColor: c.color } : {}}
            onClick={() => toggle(c.key)}
          >
            <div className="aq-chip-dot" style={{ background: c.color }} />
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
  return (
    <div className="sub-item">
      <div className={'sub-toggle' + (on ? ' on' : '')} onClick={() => toggle(layerKey)} />
      {dotColor && (
        <div
          className={'sub-dot' + (dotShape === 'square' ? ' square' : '')}
          style={{ background: dotColor }}
        />
      )}
      <span className="sub-label">{label}</span>
      {badge && <span className="loading-badge">{badge}</span>}
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
      <div className="group-header" onClick={() => setOpen(o => !o)}>
        <span className={'group-arrow' + (open ? ' open' : '')}>▶</span>
        <div
          className={'group-toggle' + (on ? ' on' : '')}
          onClick={e => { e.stopPropagation(); setGroup(groupKeys, !on) }}
        />
        {dotColor && (
          <div
            className={'group-dot' + (dotShape === 'circle' ? ' circle' : '')}
            style={{ background: dotColor }}
          />
        )}
        <span className="group-label">{label}</span>
      </div>
      <div className={'sub-layers' + (open ? ' open' : '')}>
        {children}
      </div>
    </div>
  )
}
