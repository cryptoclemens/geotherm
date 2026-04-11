'use client'

// TODO M4: Migration aus github.com/cryptoclemens/vencly-delta-t
// - calculateSystem() → src/apps/deltat/calc/system.ts
// - Unit-Tests: mindestens 20 Testfälle (PLAUSI_CHECK.md)
// - ParamSlider → src/core/ui/ (shared)
// - State via useDeltaTStore (Zustand)
// - Tailwind statt inline CSS-Variablen

export default function DeltaTApp() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">DeltaT – Dubletten-Auslegungsrechner</h1>
        <p className="text-muted-foreground">Migration aus vencly-delta-t startet in Milestone 4.</p>
      </div>
    </div>
  )
}
