import { useEffect } from 'react'
import { useGpaStore } from '../../store/useGpaStore'

export default function Loader() {
  const { loaderDone, loaderProgress, loaderDetail, setLoaderDone, setProgress } = useGpaStore()

  // Simulate initial load progress
  useEffect(() => {
    if (loaderDone) return
    const steps = [
      { delay: 100,  val: 20, msg: 'Initialisiere Karte…' },
      { delay: 400,  val: 45, msg: 'Lade Vektordaten…' },
      { delay: 700,  val: 70, msg: 'Verbinde WMS-Dienste…' },
      { delay: 1100, val: 90, msg: 'Bereite Daten vor…' },
      { delay: 1600, val: 100, msg: 'Fertig.' },
    ]
    const timers = steps.map(({ delay, val, msg }) =>
      setTimeout(() => {
        setProgress(val, msg)
        if (val === 100) setTimeout(() => setLoaderDone(), 400)
      }, delay)
    )
    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line

  if (loaderDone) return null

  return (
    <div id="loader-overlay">
      <div id="loader-box">
        <div id="loader-logo">
          <span id="loader-logo-geo">Geothermie</span>
          <span id="loader-logo-sub">Potential-Atlas</span>
        </div>
        <div id="loader-subtitle">Nordeuropäisches Tiefland · Fernwärme · Wärmeproduzenten</div>
        <div id="loader-bar-wrap">
          <div id="loader-fill" style={{ width: `${loaderProgress}%` }} />
        </div>
        <div id="loader-msg">{loaderDetail || 'Initialisiere…'}</div>
      </div>
    </div>
  )
}
