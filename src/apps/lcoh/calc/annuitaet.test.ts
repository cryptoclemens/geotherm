import { describe, it, expect } from 'vitest'
import { crf, METHODIK_VERSORGER, METHODIK_INVESTOR, METHODIK_DEFAULT, type Methodik } from './annuitaet'

describe('crf — Annuitätenfaktor (VDI 2067 Bl. 1)', () => {
  it('Versorger-Konvention 6 % / 30 a → 0,07265', () => {
    expect(crf(METHODIK_VERSORGER)).toBeCloseTo(0.0726489, 6)
  })

  it('Investor-Konvention 10 % / 20 a → 0,11746', () => {
    expect(crf(METHODIK_INVESTOR)).toBeCloseTo(0.1174596, 6)
  })

  // Der Grund, warum M8.1c überhaupt ein Blocker ist: Allein die Konvention verschiebt
  // jeden kapitalgetriebenen LCOH um Faktor 1,62 — ohne dass sich am Projekt etwas ändert.
  it('die Konvention allein macht Faktor 1,617 aus', () => {
    expect(crf(METHODIK_INVESTOR) / crf(METHODIK_VERSORGER)).toBeCloseTo(1.6168, 4)
  })

  // Zerlegung: Der Zinssatz ist der dominante Hebel, nicht die Nutzungsdauer.
  // Festgehalten, damit die Diskussion beim nächsten Mal nicht bei „20 vs. 30 Jahre" landet.
  it('vom Faktor 1,62 kommen 1,46 vom Zins und nur 1,20 von der Laufzeit', () => {
    const q = (m: Partial<Methodik>) => crf({ ...METHODIK_VERSORGER, ...m })
    expect(q({ zins: 0.10 }) / crf(METHODIK_VERSORGER)).toBeCloseTo(1.460, 3)
    expect(q({ jahre: 20 }) / crf(METHODIK_VERSORGER)).toBeCloseTo(1.200, 3)
  })
})

describe('crf — Grenzfälle', () => {
  // Ohne Sonderfall ist die Formel bei zins = 0 ein 0/0 und liefert still NaN.
  // Der Grenzwert ist 1/n: Ohne Zins wird das Kapital linear über die Jahre verteilt.
  it('zins = 0 → 1/jahre statt NaN', () => {
    const r = crf({ ...METHODIK_VERSORGER, zins: 0, jahre: 30 })
    expect(Number.isNaN(r)).toBe(false)
    expect(r).toBeCloseTo(1 / 30, 10)
  })

  it('zins = 0 bei 20 a → 0,05', () => {
    expect(crf({ ...METHODIK_VERSORGER, zins: 0, jahre: 20 })).toBeCloseTo(0.05, 10)
  })

  it('jahre = 1 → 1 + zins (alles im ersten Jahr zurück)', () => {
    expect(crf({ ...METHODIK_VERSORGER, zins: 0.06, jahre: 1 })).toBeCloseTo(1.06, 10)
  })

  it('sehr lange Laufzeit nähert sich dem Zinssatz (ewige Rente)', () => {
    expect(crf({ ...METHODIK_VERSORGER, zins: 0.06, jahre: 1000 })).toBeCloseTo(0.06, 6)
  })

  // jahre <= 0 ist fachlich sinnlos, aber über die Registry (M8.2) editierbar: Prämissen sind
  // dort Daten, die ein Fachplaner eintippt. Ohne Guard wäre crf({jahre: 0}) eine Division
  // durch null → Infinity, und der LCOH zeigte still "∞ €/MWh" statt eines Fehlers.
  it('jahre = 0 → NaN statt Infinity', () => {
    expect(crf({ ...METHODIK_VERSORGER, jahre: 0 })).toBeNaN()
  })

  it('negative Laufzeit → NaN', () => {
    expect(crf({ ...METHODIK_VERSORGER, jahre: -5 })).toBeNaN()
  })

  it('der Guard greift vor dem zins-0-Zweig (jahre = 0 und zins = 0)', () => {
    expect(crf({ ...METHODIK_VERSORGER, zins: 0, jahre: 0 })).toBeNaN()
  })
})

describe('crf — Monotonie', () => {
  it('steigt mit dem Zins', () => {
    for (let z = 0; z < 0.20; z += 0.01) {
      expect(crf({ ...METHODIK_VERSORGER, zins: z + 0.01 }))
        .toBeGreaterThan(crf({ ...METHODIK_VERSORGER, zins: z }))
    }
  })

  it('fällt mit der Laufzeit', () => {
    for (let n = 1; n < 50; n++) {
      expect(crf({ ...METHODIK_VERSORGER, jahre: n + 1 }))
        .toBeLessThan(crf({ ...METHODIK_VERSORGER, jahre: n }))
    }
  })
})

describe('Methodik — die Prämisse klebt an der Zahl', () => {
  it('Default ist die Versorger-Konvention (6 % / 30 a)', () => {
    expect(METHODIK_DEFAULT).toEqual(METHODIK_VERSORGER)
    expect(METHODIK_DEFAULT.zins).toBe(0.06)
    expect(METHODIK_DEFAULT.jahre).toBe(30)
  })

  it('jedes Preset trägt Label und Quelle — eine Zahl ohne Prämisse ist nicht darstellbar', () => {
    for (const m of [METHODIK_VERSORGER, METHODIK_INVESTOR]) {
      expect(m.label.length).toBeGreaterThan(0)
      expect(m.quelle.length).toBeGreaterThan(0)
    }
  })

  it('das Label nennt Zins und Laufzeit, damit die Zahl selbsterklärend bleibt', () => {
    expect(METHODIK_VERSORGER.label).toContain('6')
    expect(METHODIK_VERSORGER.label).toContain('30')
    expect(METHODIK_INVESTOR.label).toContain('10')
    expect(METHODIK_INVESTOR.label).toContain('20')
  })
})
