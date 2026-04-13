import { describe, it, expect } from 'vitest'
import { berechneBohrkosten, DEFAULT_INPUTS, type BohrkostInputs } from './kosten'

// Hilfsfunktion: Default-Inputs mit Überschreibungen
function inp(overrides: Partial<BohrkostInputs>): BohrkostInputs {
  return { ...DEFAULT_INPUTS, ...overrides }
}

describe('berechneBohrkosten — Linearer Fallback (tiefe < 500 m)', () => {
  it('Lockergestein 300m: Kosten = 300×300 + 75.000 = 165.000 EUR (eine Bohrung Basis)', () => {
    const r = berechneBohrkosten(inp({ tiefe: 300, gesteinstyp: 'Lockergestein', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    // 300 EUR/m × 300 m + 75.000 = 165.000 EUR (mid)
    // Komplettierung ohne Risiko: 300×60 + 60.000 + 25.000 + 30.000 = 133.000
    const erwartete_bohrkosten_mid = 165_000
    expect(r.bohrkosten_mid).toBeCloseTo(erwartete_bohrkosten_mid, -1)
  })

  it('Festgestein_sed 300m: Kosten = 700×300 + 100.000 = 310.000 EUR (eine Bohrung Basis)', () => {
    const r = berechneBohrkosten(inp({ tiefe: 300, gesteinstyp: 'Festgestein_sed', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(r.bohrkosten_mid).toBeCloseTo(310_000, -1)
  })

  it('Kristallin 300m: Kosten = 1200×300 + 150.000 = 510.000 EUR (eine Bohrung Basis)', () => {
    const r = berechneBohrkosten(inp({ tiefe: 300, gesteinstyp: 'Festgestein_kristallin', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(r.bohrkosten_mid).toBeCloseTo(510_000, -1)
  })

  it('Bandbreite: min=0.65×mid, max=1.50×mid', () => {
    const r = berechneBohrkosten(inp({ tiefe: 300, gesteinstyp: 'Festgestein_sed', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(r.bohrkosten_min).toBeCloseTo(r.bohrkosten_mid * 0.65, 0)
    expect(r.bohrkosten_max).toBeCloseTo(r.bohrkosten_mid * 1.50, 0)
  })
})

describe('berechneBohrkosten — Lukawski-Formel (tiefe ≥ 500 m)', () => {
  it('Tiefe 700m, Festgestein_sed: Bohrkosten_mid > 0 und sinnvoll positiv', () => {
    const r = berechneBohrkosten(inp({ tiefe: 700, gesteinstyp: 'Festgestein_sed', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(r.bohrkosten_mid).toBeGreaterThan(0)
    // Grobe Plausibilität: 700m sollte zwischen 500k und 5M EUR liegen
    expect(r.bohrkosten_mid).toBeGreaterThan(500_000)
    expect(r.bohrkosten_mid).toBeLessThan(5_000_000)
  })

  it('Tiefe 1000m, Festgestein_sed: Kosten steigen mit Tiefe', () => {
    const r700 = berechneBohrkosten(inp({ tiefe: 700, gesteinstyp: 'Festgestein_sed', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    const r1000 = berechneBohrkosten(inp({ tiefe: 1000, gesteinstyp: 'Festgestein_sed', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(r1000.bohrkosten_mid).toBeGreaterThan(r700.bohrkosten_mid)
  })

  it('Tiefe 2000m, Festgestein_sed: Kosten weiter steigend', () => {
    const r1000 = berechneBohrkosten(inp({ tiefe: 1000, gesteinstyp: 'Festgestein_sed', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    const r2000 = berechneBohrkosten(inp({ tiefe: 2000, gesteinstyp: 'Festgestein_sed', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(r2000.bohrkosten_mid).toBeGreaterThan(r1000.bohrkosten_mid)
  })

  it('Tiefe 3000m, Festgestein_sed: Sehr hohe Kosten', () => {
    const r = berechneBohrkosten(inp({ tiefe: 3000, gesteinstyp: 'Festgestein_sed', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(r.bohrkosten_mid).toBeGreaterThan(5_000_000)
  })
})

describe('berechneBohrkosten — Dublette vs Einzelbohrung', () => {
  it('Dublette hat 2× die Bohrkosten einer Einzelbohrung (ca.)', () => {
    const rDub = berechneBohrkosten(inp({ tiefe: 700, zweck: 'Dublette', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    const rEin = berechneBohrkosten(inp({ tiefe: 700, zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(rDub.bohrkosten_mid).toBeCloseTo(rEin.bohrkosten_mid * 2, -2)
  })

  it('Dublette: anzahl_bohrungen = 2, Einzelbohrung: anzahl_bohrungen = 1', () => {
    const rDub = berechneBohrkosten(inp({ zweck: 'Dublette' }))
    const rEin = berechneBohrkosten(inp({ zweck: 'Einzelbohrung' }))
    expect(rDub.anzahl_bohrungen).toBe(2)
    expect(rEin.anzahl_bohrungen).toBe(1)
  })
})

describe('berechneBohrkosten — Förderung', () => {
  it('Ohne Förderung: foerderung_betrag = 0, Nettokosten = Brutto', () => {
    const r = berechneBohrkosten(inp({ foerderungAktiv: false }))
    expect(r.foerderung_betrag).toBe(0)
    expect(r.projektkosten_netto_mid).toBeCloseTo(r.projektkosten_mid, 0)
  })

  it('Mit Förderung: Nettokosten < Bruttokosten', () => {
    const r = berechneBohrkosten(inp({ foerderungAktiv: true, tiefe: 700 }))
    expect(r.foerderung_betrag).toBeGreaterThan(0)
    expect(r.projektkosten_netto_mid).toBeLessThan(r.projektkosten_mid)
    // Differenz sollte dem Förderungsbetrag entsprechen
    expect(r.projektkosten_mid - r.projektkosten_netto_mid).toBeCloseTo(r.foerderung_betrag, 0)
  })

  it('MAP-Förderung: 375 EUR/m × 700 = 262.500 EUR (< 2.500.000)', () => {
    const r = berechneBohrkosten(inp({ foerderungAktiv: true, tiefe: 700 }))
    expect(r.foerderung_betrag).toBeCloseTo(375 * 700, 0)
  })

  it('MAP-Förderung: bei tiefe=2500 → 375×2500=937.500 EUR (max. Fördertiefe = 2500 m)', () => {
    const r = berechneBohrkosten(inp({ foerderungAktiv: true, tiefe: 2500 }))
    expect(r.foerderung_betrag).toBeCloseTo(375 * 2500, 0)
  })
})

describe('berechneBohrkosten — Ampel-Grenzen', () => {
  it('Ampel Tiefe: ≤700 m = green', () => {
    const r = berechneBohrkosten(inp({ tiefe: 700 }))
    expect(r.ampel_tiefe).toBe('green')
  })

  it('Ampel Tiefe: 701–1500 m = yellow', () => {
    const r = berechneBohrkosten(inp({ tiefe: 1000 }))
    expect(r.ampel_tiefe).toBe('yellow')
  })

  it('Ampel Tiefe: >1500 m = red', () => {
    const r = berechneBohrkosten(inp({ tiefe: 2000 }))
    expect(r.ampel_tiefe).toBe('red')
  })

  it('Ampel Risiko: Lockergestein = green', () => {
    const r = berechneBohrkosten(inp({ gesteinstyp: 'Lockergestein' }))
    expect(r.ampel_risiko).toBe('green')
  })

  it('Ampel Risiko: Festgestein_sed = yellow', () => {
    const r = berechneBohrkosten(inp({ gesteinstyp: 'Festgestein_sed' }))
    expect(r.ampel_risiko).toBe('yellow')
  })

  it('Ampel Risiko: Kristallin = red', () => {
    const r = berechneBohrkosten(inp({ gesteinstyp: 'Festgestein_kristallin' }))
    expect(r.ampel_risiko).toBe('red')
  })
})

describe('berechneBohrkosten — Explorationsbohrung', () => {
  it('Explorationsbohrung: 15% teurer als Einzelbohrung bei gleicher Tiefe', () => {
    const rExpl = berechneBohrkosten(inp({ zweck: 'Explorationsbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    const rEin  = berechneBohrkosten(inp({ zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(rExpl.bohrkosten_mid).toBeCloseTo(rEin.bohrkosten_mid * 1.15, -2)
  })

  it('Explorationsbohrung: leistung_kw = 0', () => {
    const r = berechneBohrkosten(inp({ zweck: 'Explorationsbohrung' }))
    expect(r.leistung_kw).toBe(0)
  })
})

describe('berechneBohrkosten — Kristallin-Faktor vs Festgestein', () => {
  it('Kristallin ca. 1.3× teurer als Festgestein_sed (Lukawski-Bereich)', () => {
    const rKrist = berechneBohrkosten(inp({ tiefe: 1000, gesteinstyp: 'Festgestein_kristallin', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    const rSed   = berechneBohrkosten(inp({ tiefe: 1000, gesteinstyp: 'Festgestein_sed', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    const ratio = rKrist.bohrkosten_mid / rSed.bohrkosten_mid
    expect(ratio).toBeCloseTo(1.3, 1)
  })
})

describe('berechneBohrkosten — Thermische Leistung', () => {
  it('Q_th = foerderrate × (tGW − tReinjektion) × 4.18', () => {
    const r = berechneBohrkosten(inp({ zweck: 'Dublette', foerderrate: 15, tGW: 35, tReinjektion: 15 }))
    const erwartet = 15 * (35 - 15) * 4.18
    expect(r.leistung_kw).toBeCloseTo(erwartet, 1)
  })

  it('tGW ≤ tReinjektion: leistung_kw = 0', () => {
    const r = berechneBohrkosten(inp({ zweck: 'Einzelbohrung', tGW: 15, tReinjektion: 20 }))
    expect(r.leistung_kw).toBe(0)
  })
})
