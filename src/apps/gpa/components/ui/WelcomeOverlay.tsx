// @ts-nocheck
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
        <div id="welcome-badge">Geothermie-Potential-Atlas</div>
        <div id="welcome-title">Geothermie-Marktanalyse<br />Europa</div>
        <div id="welcome-desc">
          Diese Karte unterstützt die strategische Expansionsplanung
          über das Rheinische Revier hinaus.<br /><br />
          Sie überlagert <strong>geologische Bohrbedingungen</strong> (Lockergestein),{' '}
          <strong>bestehende Fernwärme-Infrastruktur</strong> und{' '}
          <strong>industrielle Wärmequellen</strong> — und zeigt, wo Geothermie-Projekte
          besonders wirtschaftlich realisierbar sind.
        </div>
        <div id="welcome-btns">
          <button className="welcome-btn-ok" onClick={setWelcomeSeen}>Verstanden</button>
          <button className="welcome-btn-tour" onClick={handleTour}>Gib mir eine Tour →</button>
        </div>
      </div>
    </div>
  )
}
