// @ts-nocheck
import { useGpaStore } from '../../store/useGpaStore'

const TOUR = [
  {
    title: 'Geologische Ausgangslage',
    body: 'Die <strong>hellblaue Fläche</strong> zeigt den Norddeutschen Tiefland-Gürtel — ein Band aus Lockergestein von den Niederlanden bis zur Ukraine. Geringere Bohrhärte = niedrigere Erschließungskosten. Das <strong>rote Polygon</strong> markiert das Kernarbeitsgebiet im Rheinischen Revier.',
  },
  {
    title: 'Geothermale Temperaturen (WMS)',
    body: 'Die <strong>WMS-Layer</strong> im linken Panel zeigen Untergrundtemperaturen — pan-europäisch via EGDI und hochaufgelöst via BGR. <strong>Zensus-2022-Layer</strong> zeigen Heizungsart und Energieträger auf 100m-Raster (bundesweit).',
  },
  {
    title: 'Fernwärme-Märkte',
    body: 'Farbige Kreise zeigen Städte mit hohem Fernwärmeanteil. <strong>Grün (&gt;50%)</strong> = Priorität 1 mit bestehender Abnahme-Infrastruktur. Orange und Blau sind weitere Expansionskandidaten — klicken für Betreiber, Netzlänge und Erzeugungsmix.',
  },
  {
    title: 'Industrielle Wärmeproduzenten',
    body: 'Vier Live-Layer aus OpenStreetMap: <strong>Rechenzentren</strong> (Abwärme nutzbar), <strong>Kraftwerke</strong>, <strong>Müllverbrennung</strong> und <strong>Stahlwerke</strong>. Klicke die <strong>Statistik-Kacheln</strong> oben rechts für eine Liste aller Standorte im aktuellen Ausschnitt.',
  },
]

export default function GuidedTour() {
  const { tourActive, tourStep, setTourStep, endTour } = useGpaStore()

  // Don't render when tour is not active
  if (!tourActive) return null
  const n = TOUR.length
  const s = TOUR[tourStep]

  function next() {
    if (tourStep < n - 1) setTourStep(tourStep + 1)
    else endTour()
  }
  function prev() {
    if (tourStep > 0) setTourStep(tourStep - 1)
  }

  return (
    <>
      <div className="tour-mask" />
      <div id="tour-card">
        <div className="tc-step">Schritt {tourStep + 1} von {n}</div>
        <div className="tc-title">{s.title}</div>
        <div className="tc-body" dangerouslySetInnerHTML={{ __html: s.body }} />
        <div className="tc-foot">
          <div className="tc-dots">
            {TOUR.map((_, i) => (
              <div key={i} className={`tc-dot${i === tourStep ? ' on' : ''}`} onClick={() => setTourStep(i)} />
            ))}
          </div>
          {tourStep > 0 && (
            <button className="tc-btn" onClick={prev}>← Zurück</button>
          )}
          <button className="tc-btn primary" onClick={next}>
            {tourStep < n - 1 ? 'Weiter →' : 'Fertig ✓'}
          </button>
          <button className="tc-btn" onClick={endTour} title="Tour überspringen" style={{ opacity: .5, fontSize: 10 }}>
            ✕
          </button>
        </div>
      </div>
    </>
  )
}
