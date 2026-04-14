import { describe, it, expect } from 'vitest'
import { optimizeMinDoubletten, optimizeMaxSPF } from './optimize'
import { DEFAULT_INPUTS, calculateSystem } from './system'
import type { DeltaTInputs } from './system'

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function inputs(overrides: Partial<DeltaTInputs> = {}): DeltaTInputs {
  return { ...DEFAULT_INPUTS, ...overrides }
}

// ── Modus 1: Minimale Doubletten ─────────────────────────────────────────────

describe('optimizeMinDoubletten', () => {
  it('liefert ok=true und verringert Doubletten bei guter Geologie', () => {
    const base = inputs({ kf: 1e-3, maechtig: 50, tGW: 30, tR: 10, Q: 5, zielLeistung: 5000 })
    const result = optimizeMinDoubletten(base)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const before = calculateSystem(base)
    const after  = calculateSystem({ ...base, ...result.newInputs })

    // Anzahl Doubletten ≤ vorher
    expect(after.anzahlDubletten ?? Infinity).toBeLessThanOrEqual(before.anzahlDubletten ?? Infinity)
    // Durchbruchszeit ≥ 25 a
    expect(after.tBreak).toBeGreaterThanOrEqual(25)
    // T_R ≥ 2 °C
    expect(result.newInputs.tR).toBeGreaterThanOrEqual(2)
    // Q ≤ 100 l/s
    expect(result.newInputs.Q ?? 0).toBeLessThanOrEqual(100)
    // Mindestens eine Änderung
    expect(result.changes.length).toBeGreaterThan(0)
  })

  it('setzt Q korrekt auf hydraulisches Limit (schwache Transmissivität)', () => {
    // kf=1e-4, b=20 → T=2e-3 m²/s → Q_max (Sichardt) ≈ 4–6 l/s, stark < Q=50 l/s
    const base = inputs({ kf: 1e-4, maechtig: 20, tGW: 25, Q: 50 })
    const result = optimizeMinDoubletten(base)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.newInputs.Q ?? 100).toBeLessThanOrEqual(10)  // stark gedrosselt
  })

  it('schlägt fehl wenn tGW ≤ TR_MIN (2 °C)', () => {
    // tGW=2°C → deltaT = tGW − tR_min = 2 − 2 = 0 → kein Wärmeentzug
    const base = inputs({ tGW: 2 })
    const result = optimizeMinDoubletten(base)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/T_GW/)
  })

  it('begrenzt Abstand auf Minimum 300 m', () => {
    // Sehr kleine Q → abstandOpt könnte < 300 m sein
    const base = inputs({ Q: 1, kf: 1e-3, maechtig: 100, tGW: 30, tR: 5 })
    const result = optimizeMinDoubletten(base)
    if (!result.ok) return
    expect(result.newInputs.abstand ?? 0).toBeGreaterThanOrEqual(300)
  })

  it('Stufenfunktion-Edge-Case: Q verringern wenn Doubletten-Sprung droht', () => {
    // Bei Q_max liefert 1,01 Doubletten → ceil → 2; Opt soll Q so wählen dass 1 reicht
    const base = inputs({
      kf: 1e-3, maechtig: 80, tGW: 40, tRL: 30, tVL: 90,
      Q: 10, zielLeistung: 1500,
    })
    const result = optimizeMinDoubletten(base)
    if (!result.ok) return
    const after = calculateSystem({ ...base, ...result.newInputs })
    // Ergebnis muss ganzzahlig und ≥ 1 sein
    expect(after.anzahlDubletten).toBeGreaterThanOrEqual(1)
    expect(Number.isInteger(after.anzahlDubletten)).toBe(true)
  })

  it('Direktnutzung-Fall: wenn tHub ≤ 0 (kein WP) funktioniert Optimierung trotzdem', () => {
    // T_GW > T_VL → Direkteinspeisung, kein WP
    const base = inputs({ tGW: 100, tVL: 80, tRL: 50, tR: 20, Q: 10, zielLeistung: 2000 })
    const result = optimizeMinDoubletten(base)
    // Darf ok=true oder ok=false sein, darf aber nicht crashen
    expect(typeof result.ok).toBe('boolean')
  })
})

// ── Modus 2: Maximale Effizienz (SPF) ────────────────────────────────────────

describe('optimizeMaxSPF', () => {
  it('liefert ok=true und SPF ≥ Ausgangswert bei guter Geologie', () => {
    const base = inputs({ kf: 1e-3, maechtig: 50, tGW: 30, tR: 15, Q: 10 })
    const result = optimizeMaxSPF(base)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // Neuer SPF besser als alter — SPF = qDelivered / (n × (P_prod + P_inj) + P_WP_el)
    const before = calculateSystem(base)
    const pPumpVorher = (before.anzahlDubletten ?? 0) * (before.tauchpumpenLeistung + before.injektionsPumpenLeistung)
    const spfVorher = before.qDelivered / (pPumpVorher + before.elLeistungWP || 1)

    const after = calculateSystem({ ...base, ...result.newInputs })
    const pPumpNachher = (after.anzahlDubletten ?? 0) * (after.tauchpumpenLeistung + after.injektionsPumpenLeistung)
    const spfNachher = after.qDelivered / (pPumpNachher + after.elLeistungWP || 1)

    expect(spfNachher).toBeGreaterThanOrEqual(spfVorher - 0.01)  // ±0,01 Toleranz
  })

  it('schlägt fehl wenn tGW ≤ TR_MIN (2 °C) — kein Scan-Punkt möglich', () => {
    // tGW=2°C → Scan-Range für tR kollabiert auf 0 Punkte
    const base = inputs({ tGW: 2 })
    const result = optimizeMaxSPF(base)
    expect(result.ok).toBe(false)
  })

  it('hält tBreak-Constraint ≥ 25 a ein', () => {
    const base = inputs({ kf: 1e-3, maechtig: 50, tGW: 40, Q: 5 })
    const result = optimizeMaxSPF(base)
    if (!result.ok) return
    const after = calculateSystem({ ...base, ...result.newInputs })
    expect(after.tBreak).toBeGreaterThanOrEqual(24)  // ±1 a Toleranz durch Rundung
  })
})
