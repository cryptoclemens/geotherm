import { describe, it, expect } from 'vitest'
import { calculateSystem, DEFAULT_INPUTS, calcDefaultFoerderhoehe } from './system'
import type { DeltaTInputs } from './system'

// ─── Helper ────────────────────────────────────────────────────────────────
function inp(overrides: Partial<DeltaTInputs> = {}): DeltaTInputs {
  return { ...DEFAULT_INPUTS, ...overrides }
}

// ─── Transmissivität ────────────────────────────────────────────────────────
describe('Transmissivität', () => {
  it('berechnet kf × Mächtigkeit', () => {
    const r = calculateSystem(inp({ kf: 1e-3, maechtig: 50 }))
    expect(r.transmissiv).toBeCloseTo(0.05)
  })
  it('Ampel grün bei T > 1e-3', () => {
    const r = calculateSystem(inp({ kf: 2e-2, maechtig: 10 }))
    expect(r.sHydraulik).toBe('green')
  })
  it('Ampel gelb bei 1e-4 < T ≤ 1e-3', () => {
    const r = calculateSystem(inp({ kf: 1e-4, maechtig: 5 }))
    expect(r.sHydraulik).toBe('yellow')
  })
  it('Ampel rot bei T ≤ 1e-4', () => {
    const r = calculateSystem(inp({ kf: 1e-5, maechtig: 5 }))
    expect(r.sHydraulik).toBe('red')
  })
})

// ─── Wärmeleistung ──────────────────────────────────────────────────────────
describe('Wärmeleistung Q_th', () => {
  it('Q_th = Q[l/s] × ΔT × 4.18 kJ/(kg·K)', () => {
    const r = calculateSystem(inp({ Q: 10, tGW: 20, tR: 10, tVL: 20 }))
    // ΔT=10, Q_th = 10×10×4.18 = 418 kW
    expect(r.qThPerDoublet).toBeCloseTo(418, 0)
  })
  it('deltaT = tGW - tR', () => {
    const r = calculateSystem(inp({ tGW: 25, tR: 10, tVL: 20 }))
    expect(r.deltaT).toBe(15)
  })
  it('qThPerDoublet = 0 wenn deltaT ≤ 0 (unphysikalisch)', () => {
    // tR = tGW → kein Wärmeentzug möglich
    const r = calculateSystem(inp({ tGW: 10, tR: 10 }))
    expect(r.qThPerDoublet).toBe(0)
  })
  it('Anzahl Dubletten ≥ 1', () => {
    const r = calculateSystem(inp({ Q: 50, tGW: 30, tR: 5, zielLeistung: 100 }))
    expect(r.anzahlDubletten).toBeGreaterThanOrEqual(1)
  })
  it('anzahlDubletten = null wenn deltaT ≤ 0 (unphysikalisch)', () => {
    const r = calculateSystem(inp({ tGW: 10, tR: 10 }))
    expect(r.anzahlDubletten).toBeNull()
  })
  it('anzahlDubletten = null wenn tR > tGW', () => {
    const r = calculateSystem(inp({ tGW: 11.5, tR: 12 }))
    expect(r.anzahlDubletten).toBeNull()
  })
})

// ─── Tauchpumpe ─────────────────────────────────────────────────────────────
describe('Tauchpumpenleistung', () => {
  it('P = Q[m³/s] × ρ × g × H / η — VDI 4640, H=foerderhoehe', () => {
    // Q=1 l/s = 0.001 m³/s, foerderhoehe=100 m, η=0.6
    // P = 0.001 × 1000 × 9.81 × 100 / (0.6 × 1000) = 1.635 kW
    const r = calculateSystem(inp({ Q: 1, foerderhoehe: 100 }))
    expect(r.tauchpumpenLeistung).toBeCloseTo(1.635, 2)
  })
  it('größere Förderhöhe → mehr Pumpenleistung', () => {
    const r200 = calculateSystem(inp({ foerderhoehe: 200 }))
    const r100 = calculateSystem(inp({ foerderhoehe: 100 }))
    expect(r200.tauchpumpenLeistung).toBeGreaterThan(r100.tauchpumpenLeistung)
  })
  it('Bohrtiefe hat keinen Einfluss auf Pumpenleistung', () => {
    const rTief = calculateSystem(inp({ tiefe: 3000, foerderhoehe: 150 }))
    const rFlach = calculateSystem(inp({ tiefe: 100, foerderhoehe: 150 }))
    expect(rTief.tauchpumpenLeistung).toBeCloseTo(rFlach.tauchpumpenLeistung, 5)
  })
})

// ─── Durchbruchszeit ─────────────────────────────────────────────────────────
describe('Durchbruchszeit (Gringarten & Sauty 1975)', () => {
  it('t = π·n·b·d²/(3·Q) × HC-Ratio 0.55 in Jahren (Gringarten & Sauty 1975)', () => {
    // n=0.25, maechtig=40, abstand=500, Q=15 l/s=0.015 m³/s
    // hcRatio=0.55 (Sandstein gesättigt: ρc≈2,3 MJ/m³K / 4,18 MJ/m³K) — VDI 4640 Bl. 1 Tab. B1
    const r = calculateSystem(inp())
    const expected = (Math.PI * 0.25 * 40 * 500 * 500) / (3 * 0.015) * 0.55 / (365 * 24 * 3600)
    expect(r.tBreak).toBeCloseTo(expected, 2)
  })
  it('Ampel grün wenn t_break > 25 Jahre', () => {
    // Großer Abstand → lange Durchbruchszeit
    const r = calculateSystem(inp({ abstand: 2000 }))
    expect(r.sDurchbruch).toBe('green')
  })
  it('Ampel rot wenn t_break < 15 Jahre', () => {
    const r = calculateSystem(inp({ abstand: 50, Q: 50 }))
    expect(r.sDurchbruch).toBe('red')
  })
  it('optimaler Abstand für 25 Jahre positiv', () => {
    const r = calculateSystem(inp())
    expect(r.abstandOpt).toBeGreaterThan(0)
  })
})

// ─── COP ────────────────────────────────────────────────────────────────────
describe('COP — IEA HPP Annex 35 / Arpagaus 2018', () => {
  it('COP = (T_VL_K / (T_VL_K − T_R_K)) × 0.5 (Arpagaus 2018)', () => {
    // tVL=90, tR=12 (Default) → T_VL=363.15, T_R=285.15, ΔT=78 → COP≈2.33
    const r = calculateSystem(inp({ tVL: 90, tR: 12 }))
    expect(r.cop).toBeCloseTo((363.15 / 78) * 0.5, 2)
  })
  it('COP = 99 wenn T_VL − T_R ≤ 0.5 K', () => {
    // tVL=12, tR=12 → tDiff_K = 0 → COP = 99
    const r = calculateSystem(inp({ tVL: 12, tR: 12 }))
    expect(r.cop).toBe(99)
  })
  it('Ampel grün bei COP > 3', () => {
    const r = calculateSystem(inp({ tVL: 50, tGW: 25 }))
    expect(r.sCOP).toBe('green')
  })
  it('elLeistungWP = 0 wenn WP nicht aktiv (tVL ≤ tGW)', () => {
    const r = calculateSystem(inp({ tVL: 20, tGW: 25 }))
    expect(r.elLeistungWP).toBe(0)
  })
  it('W_el = Q_geo / (COP − 1)', () => {
    const r = calculateSystem(inp({ tVL: 90, tGW: 25 }))
    const expectedEl = r.qThGesamt / (r.cop - 1)
    expect(r.elLeistungWP).toBeCloseTo(expectedEl, 2)
  })
})

// ─── LMTD ────────────────────────────────────────────────────────────────────
describe('LMTD Gegenstrom — VDI Wärmeatlas 2019', () => {
  it('LMTD berechnet korrekt bei tGW>tVL und tR>tRL', () => {
    // heiß: GW→R; kalt: RL→VL
    // dT1 = tGW−tVL, dT2 = tR−tRL
    const r = calculateSystem(inp({ tGW: 30, tVL: 20, tR: 15, tRL: 10 }))
    expect(r.lmtdValid).toBe(true)
    expect(r.lmtd).toBeGreaterThan(0)
  })
  it('LMTD ungültig wenn tGW < tVL', () => {
    const r = calculateSystem(inp({ tGW: 25, tVL: 90, tR: 12, tRL: 55 }))
    // dT1 = 25-90 = -65 < 0 → ungültig
    expect(r.lmtdValid).toBe(false)
    expect(r.lmtd).toBeNull()
  })
  it('Wärmetauscherfläche null wenn LMTD ungültig', () => {
    const r = calculateSystem(inp({ tGW: 25, tVL: 90, tR: 12, tRL: 55 }))
    expect(r.wtFlaeche).toBeNull()
  })
  it('LMTD = dT1 wenn dT1 ≈ dT2', () => {
    // dT1 = dT2 → LMTD = dT1 (logarithmische Singularität vermieden)
    const r = calculateSystem(inp({ tGW: 30, tVL: 20, tR: 20, tRL: 10 }))
    // dT1 = 30-20=10, dT2 = 20-10=10 → gleich
    if (r.lmtdValid) expect(r.lmtd).toBeCloseTo(10, 1)
  })
})

// ─── WP-Typ ──────────────────────────────────────────────────────────────────
describe('WP-Typ — VDI 4640 / Arpagaus 2018', () => {
  it('Direktnutzung wenn tVL ≤ tGW', () => {
    const r = calculateSystem(inp({ tVL: 20, tGW: 25 }))
    expect(r.wpColor).toBe('green')
    expect(r.tHub).toBeLessThanOrEqual(0)
  })
  it('Standard-WP bei Hub ≤ 35 K', () => {
    const r = calculateSystem(inp({ tVL: 55, tGW: 25 }))
    expect(r.tHub).toBeLessThanOrEqual(35)
    expect(r.wpColor).toBe('green')
  })
  it('HT-WP bei Hub 35–60 K', () => {
    const r = calculateSystem(inp({ tVL: 80, tGW: 25 }))
    expect(r.tHub).toBeGreaterThan(35)
    expect(r.wpColor).toBe('yellow')
  })
  it('Industrielle HT-WP bei Hub > 60 K', () => {
    const r = calculateSystem(inp({ tVL: 90, tGW: 25 }))
    expect(r.tHub).toBeGreaterThan(60)
    expect(r.wpColor).toBe('red')
  })
})

// ─── Material DVGW W 115 ─────────────────────────────────────────────────────
describe('Material — DVGW W 115', () => {
  it('Edelstahl 1.4571 bei TDS < 1000', () => {
    const r = calculateSystem(inp({ tds: 500 }))
    expect(r.materialColor).toBe('green')
  })
  it('Duplex-Stahl bei 1000 ≤ TDS < 10000', () => {
    const r = calculateSystem(inp({ tds: 5000 }))
    expect(r.materialColor).toBe('yellow')
  })
  it('Titan/Hastelloy bei TDS ≥ 10000', () => {
    const r = calculateSystem(inp({ tds: 15000 }))
    expect(r.materialColor).toBe('red')
  })
})

// ─── Scaling ─────────────────────────────────────────────────────────────────
describe('Scaling-Risiko', () => {
  it('gering bei TDS < 500', () => {
    const r = calculateSystem(inp({ tds: 200 }))
    expect(r.scalingColor).toBe('green')
  })
  it('mittel bei 500 ≤ TDS < 5000', () => {
    const r = calculateSystem(inp({ tds: 1000 }))
    expect(r.scalingColor).toBe('yellow')
  })
  it('hoch bei TDS ≥ 5000', () => {
    const r = calculateSystem(inp({ tds: 8000 }))
    expect(r.scalingColor).toBe('red')
  })
})

// ─── Jahreswärmemenge ────────────────────────────────────────────────────────
describe('Jahreswärmemenge', () => {
  it('= qDelivered × laufstunden / 1000 [MWh/a] — gesamte ans Netz gelieferte Wärme', () => {
    const r = calculateSystem(inp({ laufstunden: 2000 }))
    expect(r.jahreswaerme).toBeCloseTo(r.qDelivered * 2000 / 1000, 3)
  })
  it('ohne WP: jahreswaerme = qThGesamt × laufstunden / 1000', () => {
    // tVL ≤ tGW → kein WP → qDelivered = qThGesamt
    const r = calculateSystem(inp({ tVL: 20, tGW: 25, laufstunden: 3000 }))
    expect(r.jahreswaerme).toBeCloseTo(r.qThGesamt * 3000 / 1000, 3)
  })
})

// ─── spezifische Leistung ────────────────────────────────────────────────────
describe('Spezifische Leistung', () => {
  it('= qThPerDoublet × 1000 / tiefe [W/m]', () => {
    const r = calculateSystem(inp({ tiefe: 500 }))
    expect(r.spezLeistung).toBeCloseTo(r.qThPerDoublet * 1000 / 500, 2)
  })
  it('= 0 wenn tiefe = 0', () => {
    const r = calculateSystem(inp({ tiefe: 0 }))
    expect(r.spezLeistung).toBe(0)
  })
})

// ─── WP aktiv ────────────────────────────────────────────────────────────────
describe('wpAktiv', () => {
  it('true wenn tVL > tGW', () => {
    const r = calculateSystem(inp({ tVL: 90, tGW: 25 }))
    expect(r.wpAktiv).toBe(true)
  })
  it('false wenn tVL ≤ tGW', () => {
    const r = calculateSystem(inp({ tVL: 20, tGW: 25 }))
    expect(r.wpAktiv).toBe(false)
  })
})

// ─── calcDefaultFoerderhoehe ─────────────────────────────────────────────────
describe('calcDefaultFoerderhoehe', () => {
  it('Flachwasser 35 m → ~33 m (nicht 150 m)', () => {
    expect(calcDefaultFoerderhoehe(35)).toBe(33)
  })
  it('Standard 500 m → 265 m', () => {
    expect(calcDefaultFoerderhoehe(500)).toBe(265)
  })
  it('Tiefe 1000 m → capped 300 m', () => {
    expect(calcDefaultFoerderhoehe(1000)).toBe(300)
  })
  it('Minimum 10 m → capped 25 m', () => {
    expect(calcDefaultFoerderhoehe(10)).toBe(25)
  })
  it('DEFAULT_INPUTS.foerderhoehe entspricht Formel für tiefe=500', () => {
    expect(DEFAULT_INPUTS.foerderhoehe).toBe(calcDefaultFoerderhoehe(500))
  })
})

// ─── DEFAULT_INPUTS Smoke-Test ────────────────────────────────────────────────
describe('Default-Inputs Smoke-Test', () => {
  it('läuft ohne Fehler durch', () => {
    expect(() => calculateSystem(DEFAULT_INPUTS)).not.toThrow()
  })
  it('liefert alle Output-Felder', () => {
    const r = calculateSystem(DEFAULT_INPUTS)
    expect(r.transmissiv).toBeTypeOf('number')
    expect(r.anzahlDubletten).toBeGreaterThanOrEqual(1)
    expect(r.cop).toBeTypeOf('number')
    expect(r.sHydraulik).toMatch(/green|yellow|red/)
    expect(r.sThermik).toMatch(/green|yellow|red/)
    expect(r.sDurchbruch).toMatch(/green|yellow|red/)
    expect(r.sCOP).toMatch(/green|yellow|red/)
    expect(r.sMaterial).toMatch(/green|yellow|red/)
  })
})
