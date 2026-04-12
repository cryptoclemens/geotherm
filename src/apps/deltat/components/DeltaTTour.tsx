'use client'

import { useState, useEffect } from 'react'

const TOUR_KEY = 'deltat-tour-seen'

const STEPS = [
  {
    title: 'Willkommen beim DeltaT-Rechner',
    body: 'Lege Bohrtiefe, Aquifer-Parameter und Wärmenetz-Temperaturen fest. Die Ergebnisse aktualisieren sich in Echtzeit.',
  },
  {
    title: 'Systemampeln',
    body: 'Die farbigen Badges oben rechts geben sofort Auskunft über Hydraulik, Thermik, Durchbruchszeit, COP und Materialverträglichkeit.',
  },
  {
    title: 'Optimaler Abstand',
    body: 'Der optimale Bohrlochabstand für 25 Jahre thermische Reichweite (Drost 1978) wird automatisch berechnet und angezeigt.',
  },
  {
    title: 'Aus GPA übernehmen',
    body: 'Im Geothermie-Potenzial-Atlas kannst du einen Standort auswählen und mit "In DeltaT öffnen" die Aquifer-Parameter direkt übertragen.',
  },
]

export function DeltaTTour() {
  const [step, setStep] = useState(0)
  // useState(false) auf Server + Client identisch → kein Hydration-Mismatch
  // useEffect liest localStorage erst nach Hydration
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setVisible(true)
  }, [])

  function close() {
    localStorage.setItem(TOUR_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm mx-4 bg-card border rounded-xl shadow-xl p-5">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-muted-foreground">
            Schritt {step + 1} / {STEPS.length}
          </span>
          {/* aria-labels: icon-only buttons need aria-label — UI/UX Pro Max */}
          <button
            onClick={close}
            aria-label="Tour schließen"
            className="text-muted-foreground hover:text-foreground text-lg leading-none p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <h3 className="font-semibold mb-1">{current.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{current.body}</p>
        <div className="flex justify-between items-center">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            aria-label="Vorheriger Schritt"
            className="text-xs text-muted-foreground disabled:opacity-30 hover:text-foreground min-h-[44px] px-2"
          >
            ← Zurück
          </button>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-blue-600' : 'bg-muted-foreground/30'}`}
              />
            ))}
          </div>
          {isLast
            ? <button onClick={close} aria-label="Tour beenden" className="text-xs font-medium text-blue-600 hover:underline min-h-[44px] px-2">Fertig</button>
            : <button onClick={() => setStep(s => s + 1)} aria-label="Nächster Schritt" className="text-xs font-medium text-blue-600 hover:underline min-h-[44px] px-2">Weiter →</button>
          }
        </div>
      </div>
    </div>
  )
}
