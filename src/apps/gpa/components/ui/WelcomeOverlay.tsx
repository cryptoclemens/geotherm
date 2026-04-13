import { useGpaStore } from '../../store/useGpaStore'

export default function WelcomeOverlay() {
  const { welcomeSeen, setWelcomeSeen, startTour } = useGpaStore()

  // Already dismissed — don't render
  if (welcomeSeen) return null

  function handleTour() {
    setWelcomeSeen()
    startTour()
  }

  return (
    <div id="welcome-overlay">
      <div id="welcome-box">
        <div id="welcome-badge">Geothermie-Potential-Atlas · Prototyp</div>
        <div id="welcome-title">Geothermie-Marktanalyse<br />Europa</div>
        <div id="welcome-desc">
          Sie überlagert <strong>geologische Bohrbedingungen</strong>,{' '}
          <strong>bestehende Fernwärme-Infrastruktur</strong> und{' '}
          <strong>industrielle Wärmequellen</strong> — und zeigt, wo Geothermie-Projekte
          besonders wirtschaftlich realisierbar sind.
        </div>
        <div id="welcome-disclaimer">
          <strong>Hinweis:</strong> Dies ist ein früher Prototyp. Alle Daten, insbesondere
          KI-generierte geologische Schätzungen, erheben keinen Anspruch auf Vollständigkeit
          oder Richtigkeit und ersetzen kein Standortgutachten. Die App wird durch euer
          kontinuierliches Feedback stetig verbessert — nutzt den Feedback-Button jederzeit.
        </div>
        <div id="welcome-btns">
          <button className="welcome-btn-ok" onClick={setWelcomeSeen}>Verstanden</button>
          <button className="welcome-btn-tour" onClick={handleTour}>Gib mir eine Tour →</button>
        </div>
      </div>
    </div>
  )
}
