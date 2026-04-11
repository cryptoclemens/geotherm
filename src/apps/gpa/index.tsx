'use client'

// TODO M3: Migration aus github.com/cryptoclemens/geopotatlas
// - Leaflet/react-leaflet (Dynamic Import, ssr: false ist bereits in der Route)
// - WMS-Layer, FW-Städte-Marker, OSM-Heat-Sources
// - Passwort-Gate entfernen — RequireAuth ersetzt es
// - FeedbackModal, BootLog → Core-Versionen nutzen

export default function GpaApp() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">GPA – Geothermie-Potenzial-Atlas</h1>
        <p className="text-muted-foreground">Migration aus geopotatlas startet in Milestone 3.</p>
      </div>
    </div>
  )
}
