import { describe, it, expect } from 'vitest'
import { berechneBohrkosten, DEFAULT_INPUTS, type BohrkostInputs } from './kosten'

// Hilfsfunktion: Default-Inputs mit Überschreibungen
function inp(overrides: Partial<BohrkostInputs>): BohrkostInputs {
  return { ...DEFAULT_INPUTS, ...overrides }
}

describe('berechneBohrkosten — Linearer Fallback (tiefe < 500 m)', () => {
  // Erwartungswerte seit Befund B (PLAUSI_CHECK.md, Juli 2026) inkl. f_durchmesser × f_region.
  // DEFAULT_INPUTS: durchmesser '9 5/8"' → 1,00 | region 'NDB' → 0,95 ⇒ Grundpreis × 0,95.
  it('Lockergestein 300m: (300×300 + 75.000) × 1,00 × 0,95 = 156.750 EUR (eine Bohrung Basis)', () => {
    const r = berechneBohrkosten(inp({ tiefe: 300, gesteinstyp: 'Lockergestein', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    // 300 EUR/m × 300 m + 75.000 = 165.000 EUR Grundpreis, × f_durchmesser × f_region
    // Komplettierung ohne Risiko: 300×60 + 60.000 + 25.000 + 30.000 = 133.000
    const erwartete_bohrkosten_mid = 156_750
    expect(r.bohrkosten_mid).toBeCloseTo(erwartete_bohrkosten_mid, -1)
  })

  it('Festgestein_sed 300m: (700×300 + 100.000) × 1,00 × 0,95 = 294.500 EUR (eine Bohrung Basis)', () => {
    const r = berechneBohrkosten(inp({ tiefe: 300, gesteinstyp: 'Festgestein_sed', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(r.bohrkosten_mid).toBeCloseTo(294_500, -1)
  })

  it('Kristallin 300m: (1200×300 + 150.000) × 1,00 × 0,95 = 484.500 EUR (eine Bohrung Basis)', () => {
    const r = berechneBohrkosten(inp({ tiefe: 300, gesteinstyp: 'Festgestein_kristallin', zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(r.bohrkosten_mid).toBeCloseTo(484_500, -1)
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

  it('Bohrkosten je Bohrung ableitbar: bohrkosten_mid / anzahl_bohrungen (Dublette, 700m)', () => {
    const r = berechneBohrkosten(inp({ tiefe: 700, zweck: 'Dublette', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    // bohrkosten_mid = basisMid × 2, bohrkosten_pro_m = basisMid / tiefe
    const eineBohrung = r.bohrkosten_mid / r.anzahl_bohrungen
    expect(eineBohrung).toBeCloseTo(r.bohrkosten_pro_m * 700, 0)
  })

  it('8 Dubletten: bohrkosten_mid = 16 × Einzelbohrungskosten', () => {
    const r8 = berechneBohrkosten(inp({ tiefe: 700, zweck: 'Dublette', anzahlDubletten: 8, foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    const r1 = berechneBohrkosten(inp({ tiefe: 700, zweck: 'Einzelbohrung', foerderungAktiv: false, fuendigkeitsRisiko: 0 }))
    expect(r8.anzahl_bohrungen).toBe(16)
    expect(r8.bohrkosten_mid).toBeCloseTo(r1.bohrkosten_mid * 16, -2)
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

// ─── Befund B: f_durchmesser + f_region im linearen Zweig ─────────────────────
// PLAUSI_CHECK.md → „Bohrkost ↔ LCOH-Modell", Befund B (Juli 2026): f_gesamt wirkte
// nur im Lukawski-Zweig; unterhalb 400 m waren die UI-Felder Durchmesser und Region
// stille No-Ops (7" = 9 5/8" = 13 3/8" = 159,0 T€ bei 280 m).
// f_markt bleibt bewusst außen vor — GtV-/DVGW-Preise sind bereits deutsche Marktpreise.
// f_waehrung und f_gestein ebenfalls nicht: EUR-Preise, Gestein steckt in LINEAR_PREIS_PRO_M.
describe('berechneBohrkosten — Korrekturfaktoren im linearen Zweig (Befund B)', () => {
  const basis = {
    tiefe: 280,
    gesteinstyp: 'Lockergestein',
    zweck: 'Einzelbohrung',
    foerderungAktiv: false,
    fuendigkeitsRisiko: 0,
  } as const
  // Grundpreis 280 m Lockergestein: 300 × 280 + 75.000 = 159.000 EUR

  it('Durchmesser wirkt bei 280 m: 7" < 9 5/8" < 13 3/8"', () => {
    const r7    = berechneBohrkosten(inp({ ...basis, durchmesser: '7"' }))
    const r958  = berechneBohrkosten(inp({ ...basis, durchmesser: '9 5/8"' }))
    const r1338 = berechneBohrkosten(inp({ ...basis, durchmesser: '13 3/8"' }))
    expect(r7.bohrkosten_mid).toBeLessThan(r958.bohrkosten_mid)
    expect(r958.bohrkosten_mid).toBeLessThan(r1338.bohrkosten_mid)
  })

  it('7" bei 280 m / NDB: 159.000 × 0,85 × 0,95 = 128.392,50 EUR', () => {
    const r = berechneBohrkosten(inp({ ...basis, durchmesser: '7"', region: 'NDB' }))
    expect(r.bohrkosten_mid).toBeCloseTo(128_392.5, -1)
  })

  it('13 3/8" bei 280 m / NDB: 159.000 × 1,25 × 0,95 = 188.812,50 EUR', () => {
    const r = berechneBohrkosten(inp({ ...basis, durchmesser: '13 3/8"', region: 'NDB' }))
    expect(r.bohrkosten_mid).toBeCloseTo(188_812.5, -1)
  })

  it('Region wirkt bei 280 m: NDB (0,95) < Molasse (1,00) < Oberrheingraben (1,05)', () => {
    const rNDB = berechneBohrkosten(inp({ ...basis, region: 'NDB' }))
    const rMol = berechneBohrkosten(inp({ ...basis, region: 'Molasse' }))
    const rORG = berechneBohrkosten(inp({ ...basis, region: 'Oberrheingraben' }))
    expect(rNDB.bohrkosten_mid).toBeLessThan(rMol.bohrkosten_mid)
    expect(rMol.bohrkosten_mid).toBeLessThan(rORG.bohrkosten_mid)
  })

  it('f_markt wirkt NICHT im linearen Zweig: 9 5/8"/NDB bleibt 151.050 EUR statt 211.470 EUR', () => {
    const r = berechneBohrkosten(inp({ ...basis, durchmesser: '9 5/8"', region: 'NDB' }))
    expect(r.bohrkosten_mid).toBeCloseTo(151_050, -1)
    // Mit f_markt = 1,40 wären es 211.470 EUR — doppelter deutscher Marktaufschlag
    expect(r.bohrkosten_mid).toBeLessThan(200_000)
  })
})

// ─── Stetigkeit an den Blend-Rändern ─────────────────────────────────────────
// Der Blend 400–600 m mischt linearen und Lukawski-Zweig. Da f_durchmesser/f_region
// auf die linear-Variable selbst wirken (nicht nur auf den < 400-m-Ast), bewegen sich
// beide Seiten der Naht gemeinsam — Befund-B-Fix darf hier keinen Sprung erzeugen.
describe('berechneBohrkosten — Stetigkeit an den Blend-Rändern (400 / 600 m)', () => {
  const basis = {
    gesteinstyp: 'Lockergestein',
    zweck: 'Einzelbohrung',
    durchmesser: '13 3/8"',
    region: 'Oberrheingraben',
    foerderungAktiv: false,
    fuendigkeitsRisiko: 0,
  } as const

  function mid(tiefe: number): number {
    return berechneBohrkosten(inp({ ...basis, tiefe })).bohrkosten_mid
  }

  it('kein Sprung bei 400 m: 399 → 401 unter 2 %', () => {
    const abweichung = Math.abs(mid(401) - mid(399)) / mid(399)
    expect(abweichung).toBeLessThan(0.02)
  })

  it('kein Sprung bei 600 m: 599 → 601 unter 2 %', () => {
    const abweichung = Math.abs(mid(601) - mid(599)) / mid(599)
    expect(abweichung).toBeLessThan(0.02)
  })

  it('Naht 400 m stetig: f(400) und f(400,1) unter 0,2 % auseinander', () => {
    const abweichung = Math.abs(mid(400.1) - mid(400)) / mid(400)
    expect(abweichung).toBeLessThan(0.002)
  })

  it('Naht 600 m stetig: f(599,9) und f(600) unter 0,2 % auseinander', () => {
    const abweichung = Math.abs(mid(600) - mid(599.9)) / mid(599.9)
    expect(abweichung).toBeLessThan(0.002)
  })

  it('monoton steigend über die gesamte Blend-Zone', () => {
    for (let t = 380; t < 620; t += 10) {
      expect(mid(t + 10)).toBeGreaterThan(mid(t))
    }
  })
})

// ─── Gültigkeitsbereich linearer Zweig (Befund A) ────────────────────────────
// Der lineare GtV-/DVGW-Zweig bildet klein-kalibrige Brunnenbohrungen ab. Zwei reale
// Angebote für Geothermie-Produktionsbrunnen < 400 m mit großem Ausbau liegen Faktor
// 3,4–5,0 darüber. Ohne Kostenaufschlüsselung wird nicht kalibriert, sondern der
// Gültigkeitsbereich deklariert — Muster wie kluftaquiferWarnung in DeltaT.
describe('berechneBohrkosten — kleinkaliberWarnung (Gültigkeitsbereich)', () => {
  it('true bei 280 m — reiner linearer Zweig', () => {
    expect(berechneBohrkosten(inp({ tiefe: 280 })).kleinkaliberWarnung).toBe(true)
  })
  it('true bei 400 m — obere Grenze des linearen Zweigs', () => {
    expect(berechneBohrkosten(inp({ tiefe: 400 })).kleinkaliberWarnung).toBe(true)
  })
  it('false bei 401 m — Blend-Zone, Lukawski wirkt mit', () => {
    expect(berechneBohrkosten(inp({ tiefe: 401 })).kleinkaliberWarnung).toBe(false)
  })
  it('false bei Default-Tiefe 700 m', () => {
    expect(berechneBohrkosten(inp({})).kleinkaliberWarnung).toBe(false)
  })
})
