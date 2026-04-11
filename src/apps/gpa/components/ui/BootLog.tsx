// @ts-nocheck
import { useEffect, useRef } from 'react'
import { useGpaStore } from '../../store/useGpaStore'

export default function BootLog() {
  const { bootLogOpen, bootLogEntries, toggleBootLog, clearLog } = useGpaStore()
  const bodyRef = useRef(null)

  // Keyboard shortcut: B = toggle boot log
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'b' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        toggleBootLog()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleBootLog])

  // Auto-scroll to bottom
  useEffect(() => {
    if (bootLogOpen && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [bootLogOpen, bootLogEntries])

  function copyLog() {
    const text = bootLogEntries.map(e => `[${e.time}] ${e.msg}`).join('\n')
    navigator.clipboard?.writeText(text)
  }

  const statusColor = { ok: '#5bd68a', warn: '#e8a857', error: '#d65b5b', info: '#5bafd6' }

  return (
    <div id="boot-log-panel" className={bootLogOpen ? '' : 'collapsed'}>
      <div id="boot-log-header" onClick={toggleBootLog}>
        <span id="boot-log-title">▶ BOOT LOG <span style={{ opacity: .5, fontSize: 9 }}>(B)</span></span>
        <div id="boot-log-btns" onClick={e => e.stopPropagation()}>
          <button onClick={copyLog}>Kopieren</button>
          <button onClick={clearLog}>Leeren</button>
        </div>
      </div>
      {bootLogOpen && (
        <div id="boot-log-entries" ref={bodyRef}>
          {bootLogEntries.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 10, padding: '4px 0' }}>Keine Einträge</div>
          )}
          {bootLogEntries.map((e, i) => (
            <div key={i} className="bl-entry">
              <span className="bl-time">{e.time}</span>
              <span className="bl-status" style={{ color: statusColor[e.status] || '#5bafd6' }}>●</span>
              <span className="bl-msg">{e.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
