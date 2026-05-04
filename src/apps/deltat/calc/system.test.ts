import { describe, it, expect } from 'vitest'
import { calculateSystem, DEFAULT_INPUTS, calcDefaultFoerderhoehe, calcEtaPump, calcDefaultTGW } from './system'
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
  it('P = Q[m³/s] × ρ × g × H / η(tiefe) — η tiefenabhängig (Grundfos-Kataloge)', () => {
    // Q=1 l/s, foerderhoehe=100m, tiefe=500m → η(500) = 0.72 − 0.08×0.25 = 0.70
    // P = 0.001 × 1000 × 9.81 × 100 / (0.70 × 1000) = 1.401 kW
    const r = calculateSystem(inp({ Q: 1, foerderhoehe: 100, tiefe: 500 }))
    const eta = calcEtaPump(500)  // 0.70
    expect(r.tauchpumpenLeistung).toBeCloseTo(0.001 * 1000 * 9.81 * 100 / (eta * 1000), 2)
  })
  it('größere Förderhöhe → mehr Pumpenleistung', () => {
    const r200 = calculateSystem(inp({ foerderhoehe: 200 }))
    const r100 = calculateSystem(inp({ foerderhoehe: 100 }))
    expect(r200.tauchpumpenLeistung).toBeGreaterThan(r100.tauchpumpenLeistung)
  })
  it('tiefere Bohrung → niedrigerer η → höhere Pumpenleistung bei gleicher Förderhöhe', () => {
    // η(3000) = 0.72 − 0.12 = 0.60 < η(100) = 0.716
    const rTief = calculateSystem(inp({ tiefe: 3000, foerderhoehe: 150 }))
    const rFlach = calculateSystem(inp({ tiefe: 100, foerderhoehe: 150 }))
    expect(rTief.tauchpumpenLeistung).toBeGreaterThan(rFlach.tauchpumpenLeistung)
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

// ─── calcEtaPump ──────────────────────────────────────────────────────────────
describe('calcEtaPump — tiefenabhängiger Pumpenwirkungsgrad (Grundfos)', () => {
  it('η(0) = 0,72 (Maximum)', () => {
    expect(calcEtaPump(0)).toBeCloseTo(0.72)
  })
  it('η(500) = 0,70', () => {
    expect(calcEtaPump(500)).toBeCloseTo(0.70, 3)
  })
  it('η(3000) = 0,60', () => {
    expect(calcEtaPump(3000)).toBeCloseTo(0.60, 3)
  })
  it('η(9000) geclampt auf 0,45', () => {
    expect(calcEtaPump(9000)).toBe(0.45)
  })
})

// ─── Regional-Gradient ────────────────────────────────────────────────────────
describe('calcDefaultTGW — regionale Gradienten (Agemar et al. 2014)', () => {
  it('URG 500m: 11 + 0,045×500 = 33,5 °C', () => {
    expect(calcDefaultTGW(500, 'URG')).toBeCloseTo(33.5, 1)
  })
  it('NDB 1000m: 9 + 0,028×1000 = 37 °C', () => {
    expect(calcDefaultTGW(1000, 'NDB')).toBeCloseTo(37, 1)
  })
  it('custom (default) entspricht globalem Gradienten 0,03 °C/m', () => {
    expect(calcDefaultTGW(500)).toBeCloseTo(calcDefaultTGW(500, 'custom'), 2)
  })
})

// ─── Injektionspumpe ──────────────────────────────────────────────────────────
describe('Injektionspumpenleistung', () => {
  it('P_inj = Q × ΔP / η_inj (Grundfos-Kataloge)', () => {
    // Q=10 l/s, P=10 bar → P = (10/1000) × (10×1e5) / (0.55×1000) = 18.18 kW
    const r = calculateSystem(inp({ Q: 10, injektionsdruck: 10 }))
    expect(r.injektionsPumpenLeistung).toBeCloseTo(18.18, 1)
  })
  it('höherer Druck → mehr Injektionsleistung', () => {
    const r20 = calculateSystem(inp({ injektionsdruck: 20 }))
    const r10 = calculateSystem(inp({ injektionsdruck: 10 }))
    expect(r20.injektionsPumpenLeistung).toBeGreaterThan(r10.injektionsPumpenLeistung)
  })
})

// ─── Kluftaquifer-Warnung ─────────────────────────────────────────────────────
describe('kluftaquiferWarnung (Gringarten & Sauty 1975)', () => {
  it('true wenn Porosität < 0,05', () => {
    const r = calculateSystem(inp({ porositaet: 0.03 }))
    expect(r.kluftaquiferWarnung).toBe(true)
  })
  it('false wenn Porosität ≥ 0,05', () => {
    const r = calculateSystem(inp({ porositaet: 0.05 }))
    expect(r.kluftaquiferWarnung).toBe(false)
  })
  it('false für Standard-Sandstein (n=0,25)', () => {
    const r = calculateSystem(inp())
    expect(r.kluftaquiferWarnung).toBe(false)
  })
})

// ─── T_GW Auto-Berechnung aus Tiefe ──────────────────────────────────────────
describe('T_GW Auto-Berechnung — calcDefaultTGW (VDI 4640 Bl. 1)', () => {
  it('T_GW = Oberfläche + Gradient × Tiefe (custom/Deutschland-Mittel)', () => {
    // T = 10 + 0.03 × 500 = 25 °C
    expect(calcDefaultTGW(500, 'custom')).toBeCloseTo(25, 1)
  })
  it('tiefe=0 → Oberflächentemperatur (10 °C für custom)', () => {
    expect(calcDefaultTGW(0, 'custom')).toBe(10)
  })
  it('tiefe=1000 → 10 + 0.03×1000 = 40 °C (gerundet auf 0.5)', () => {
    expect(calcDefaultTGW(1000, 'custom')).toBeCloseTo(40, 1)
  })
  it('Molasse 500m: 10 + 0.030×500 = 25 °C', () => {
    expect(calcDefaultTGW(500, 'Molasse')).toBeCloseTo(25, 1)
  })
  it('Ergebnis ist auf 0.5 gerundet', () => {
    // 10 + 0.03 × 333 = 10 + 9.99 = 19.99 → round to 20.0
    const v = calcDefaultTGW(333, 'custom')
    expect(v % 0.5).toBe(0)
  })
})

// ─── Einheiten-Konvertierung l/s ↔ m³/min ────────────────────────────────────
describe('Einheiten-Konvertierung Förderrate', () => {
  it('1 l/s = 0.06 m³/min', () => {
    expect(1 * 0.06).toBeCloseTo(0.06, 5)
  })
  it('15 l/s = 0.90 m³/min', () => {
    expect(15 * 0.06).toBeCloseTo(0.9, 5)
  })
  it('Rückrechnung: 0.9 m³/min = 15 l/s', () => {
    expect(0.9 / 0.06).toBeCloseTo(15, 5)
  })
  it('Förderrate intern bleibt l/s — calculateSystem unverändert', () => {
    const r = calculateSystem(inp({ Q: 15 }))
    expect(r.qThPerDoublet).toBeCloseTo(15 * (DEFAULT_INPUTS.tGW - DEFAULT_INPUTS.tR) * 4.18, 0)
  })
})

// ─── qWP — WP-Wärmebeitrag ───────────────────────────────────────────────────
describe('qWP — WP-Wärmebeitrag (Kondensator, T-Hub)', () => {
  it('qWP = qDelivered − qThGesamt wenn WP aktiv', () => {
    const r = calculateSystem(inp({ tVL: 90, tGW: 25 }))
    expect(r.wpAktiv).toBe(true)
    expect(r.qWP).toBeCloseTo(r.qDelivered - r.qThGesamt, 3)
  })
  it('qWP = elLeistungWP (W_el wird vollständig zu Wärme)', () => {
    const r = calculateSystem(inp({ tVL: 90, tGW: 25 }))
    expect(r.qWP).toBeCloseTo(r.elLeistungWP, 3)
  })
  it('qWP = 0 wenn WP nicht aktiv (tVL ≤ tGW)', () => {
    const r = calculateSystem(inp({ tVL: 20, tGW: 25 }))
    expect(r.qWP).toBe(0)
  })
  it('Energiebilanz: qThGesamt + qWP = qDelivered', () => {
    const r = calculateSystem(inp({ tVL: 90, tGW: 25 }))
    expect(r.qThGesamt + r.qWP).toBeCloseTo(r.qDelivered, 2)
  })
})

// ─── Sichardt Q_max ───────────────────────────────────────────────────────────
describe('qMaxHydraulisch — Sichardt-Einflussradius (Kruseman & de Ridder 1990)', () => {
  it('ist kleiner als mit R=500m (konservativer) bei hoher Transmissivität', () => {
    // T=4e-3 m²/s (default kf=1e-4, b=40): R_Sichardt >> 500m → ln(R/r_w) größer → Q_max kleiner
    const r = calculateSystem(inp())
    // Mit R=500: Q_max = 2π × 4e-3 × (40/3) / ln(500/0.15) × 1000 ≈ 41 l/s
    expect(r.qMaxHydraulisch).toBeLessThan(41)
  })
  it('ist positiv für jede realistische Transmissivität', () => {
    const r = calculateSystem(inp({ kf: 1e-6, maechtig: 10 }))
    expect(r.qMaxHydraulisch).toBeGreaterThan(0)
  })
})
