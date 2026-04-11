// @ts-nocheck
import { useState } from 'react'

export default function InfoPanel() {
  const [open, setOpen] = useState(false)
  if (!open) return (
    <button id="info-toggle" onClick={() => setOpen(true)} title="Strategische Logik">
      💡
    </button>
  )
  return (
    <div id="info-panel">
      <div id="info-panel-hdr">
        <span>💡 Strategische Logik</span>
        <button onClick={() => setOpen(false)} title="Schließen">×</button>
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
