import { useState } from 'react'

export default function InfoPanel() {
  const [open, setOpen] = useState(false)
  if (!open) return (
    <button
      id="info-toggle"
      onClick={() => setOpen(true)}
      aria-label="Strategische Logik anzeigen"
      aria-expanded={false}
    >
      <span aria-hidden="true">💡</span>
    </button>
  )
  return (
    <div id="info-panel" role="region" aria-label="Strategische Logik">
      <div id="info-panel-hdr">
        <span>💡 Strategische Logik</span>
        <button onClick={() => setOpen(false)} aria-label="Panel schließen"><span aria-hidden="true">×</span></button>
      </div>
      <div id="info-panel-body">
        <p>
          Wo <strong>Lockergestein</strong> auf hochentwickelte
          <strong> Fernwärme-Infrastruktur</strong> trifft, entsteht natürlicher
          Expansionsraum für Geothermie-Bohrtechnologie.
        </p>
        <div className="info-insight">
          💡 Überlappungen von <em>WMS-Geothermie</em> + <em>OSM-Wärmeproduzenten</em> +
          <em> FW-Städten</em> = direkt verwertbare Bohrgebiets-Kandidaten.
        </div>
      </div>
    </div>
  )
}
