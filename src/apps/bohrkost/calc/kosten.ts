/**
 * berechneBohrkosten — Kernberechnung Bohrkostenrechner
 *
 * Quellen:
 *   - Bohrkosten:    Lukawski et al. (2014), J. Pet. Sci. Eng. 118, 1–14
 *                   (146 hydrothermal/EGS-Bohrungen; gilt für Produktions- +
 *                    Injektionsbohrungen — NICHT für Erdwärmesonden/BHE)
 *   - Linearer Fallback: GtV Bohrpreise (2024); DVGW W 115
 *   - Gestein-Faktoren: Baujard et al. (2017), Stanford SGW
 *   - Währungsfaktor: BLS CPI 2009–2026 (×1.54) + ECB EUR/USD → f_waehrung=1.34
 *   - Marktaufschlag: GtV Bundesverband Geothermie; LIAG Broschüre Tiefe Geothermie
 *   - Komplettierung: DVGW W 115; Stober & Bucher (2012) Kap. 7
 *   - Förderung:     BEG / MAP-Programm KfW 2024
 *   - Thermische Leistung: Drost (1978); VDI 4640 Bl. 2
 */

export type Gesteinstyp = 'Lockergestein' | 'Festgestein_sed' | 'Festgestein_kristallin'
export type Bohrungszweck = 'Dublette' | 'Einzelbohrung' | 'Explorationsbohrung'
export type Produktionsdurchmesser = '7"' | '9 5/8"' | '13 3/8"'
export type Region = 'NDB' | 'Molasse' | 'Oberrheingraben' | 'Sonstiges'

/** Projektkosten außerhalb der Bohrbaustelle [EUR] */
export interface OverheadInputs {
  projektmanagement: number
  hydrogeologie: number
  bauueberwachung: number
  rechtsberatung: number
  oeffentlichkeitsarbeit: number
}

export const DEFAULT_OVERHEAD: OverheadInputs = {
  projektmanagement:     80_000,  // ≈ 8 % von 1 Mio. EUR Investition; HOAI §§ 53–56
  hydrogeologie:         50_000,  // DVGW W 115; Stober & Bucher (2012)
  bauueberwachung:       35_000,  // HOAI Leistungsphase 8
  rechtsberatung:        25_000,  // Branchenschätzung; GtV Tiefe Geothermie
  oeffentlichkeitsarbeit: 0,      // Projektabhängig
}

export interface BohrkostInputs {
  /** Bohrtiefe [m], 100–3000 */
  tiefe: number
  /** Gesteinstyp */
  gesteinstyp: Gesteinstyp
  /** Bohrungszweck */
  zweck: Bohrungszweck
  /** Produktionsdurchmesser */
  durchmesser: Produktionsdurchmesser
  /** Region */
  region: Region
  /** Förderrate [l/s], 5–100 (nur bei Dublette/Einzelbohrung relevant) */
  foerderrate: number
  /** Grundwassertemperatur [°C], 10–120 */
  tGW: number
  /** Reinjektionstemperatur [°C], 5–60 */
  tReinjektion: number
  /** MAP/KfW-Förderung einbeziehen */
  foerderungAktiv: boolean
  /** Fündigkeitsrisiko [%], 0–30 */
  fuendigkeitsRisiko: number
  /** Overhead-Kostenstellen aktiv */
  overheadAktiv: boolean
  /** Projektkosten außerhalb Bohrbaustelle */
  overhead: OverheadInputs
}

export interface BohrkostOutputs {
  // Bohrkosten (eine Bohrung)
  bohrkosten_min: number
  bohrkosten_mid: number
  bohrkosten_max: number
  // Gesamtprojektkosten (inkl. alle Bohrungen + Komplettierung)
  projektkosten_min: number
  projektkosten_mid: number
  projektkosten_max: number
  // nach Förderung
  foerderung_betrag: number
  projektkosten_netto_min: number
  projektkosten_netto_mid: number
  projektkosten_netto_max: number
  // KPIs
  leistung_kw: number
  kosten_pro_kw_mid: number
  kosten_pro_kw_netto_mid: number
  /** Bohrkosten einer Bohrung / Tiefe [EUR/m] */
  bohrkosten_pro_m: number
  // Overhead
  overhead_gesamt: number
  projektkosten_inkl_overhead_mid: number
  projektkosten_netto_inkl_overhead_mid: number
  // Ampeln
  ampel_kosten: 'green' | 'yellow' | 'red'
  ampel_risiko: 'green' | 'yellow' | 'red'
  ampel_tiefe: 'green' | 'yellow' | 'red'
  // Anzahl Bohrungen (für Anzeige)
  anzahl_bohrungen: number
}

export const DEFAULT_INPUTS: BohrkostInputs = {
  tiefe: 700,
  gesteinstyp: 'Festgestein_sed',
  zweck: 'Dublette',
  durchmesser: '9 5/8"',
  region: 'NDB',
  foerderrate: 15,
  tGW: 35,
  tReinjektion: 15,
  foerderungAktiv: true,
  fuendigkeitsRisiko: 10,
  overheadAktiv: false,
  overhead: { ...DEFAULT_OVERHEAD },
}

// ── Korrekturfaktoren ────────────────────────────────────────────────────────

const GESTEINS_FAKTOR: Record<Gesteinstyp, number> = {
  // Abgeleitet aus ROP-Verhältnissen; Baujard et al. (2017), Stanford SGW
  'Lockergestein':          0.70,
  'Festgestein_sed':        1.00,
  'Festgestein_kristallin': 1.30,
}

const REGION_FAKTOR: Record<Region, number> = {
  'NDB':             0.95,
  'Molasse':         1.00,
  'Oberrheingraben': 1.05,
  'Sonstiges':       1.00,
}

const DURCHMESSER_FAKTOR: Record<Produktionsdurchmesser, number> = {
  '7"':      0.85,
  '9 5/8"':  1.00,
  '13 3/8"': 1.25,
}

// Linearer Fallback für d < 500 m — GtV Bohrpreise (2024); DVGW W 115
const LINEAR_PREIS_PRO_M: Record<Gesteinstyp, number> = {
  'Lockergestein':          300,
  'Festgestein_sed':        700,
  'Festgestein_kristallin': 1200,
}

const LINEAR_MOBILISIERUNG: Record<Gesteinstyp, number> = {
  'Lockergestein':          75_000,
  'Festgestein_sed':        100_000,
  'Festgestein_kristallin': 150_000,
}

/**
 * Bohrkosten für EINE Bohrung (Mittelpunkt, ohne Bandbreite)
 *
 * Formel-Basis: Lukawski et al. (2014), J. Pet. Sci. Eng. 118, 1–14
 * Datenbasis: 146 US-Geothermiebohrungen (hydrothermal + EGS; Produktions- &
 *   Injektionsbohrungen) — NICHT für Erdwärmesonden/BHE/DBHE geeignet.
 * Für Dublette: Kosten = 2 × Einzelbohrung (konservativ; Injektionsbohrung
 *   real ca. 15 % günstiger — liegt in ±35–50 %-Bandbreite, AACE Class 5).
 */
function berechneBohrkostenEine(inp: BohrkostInputs): number {
  const { tiefe, gesteinstyp, durchmesser, region } = inp

  let basiskosten: number

  if (tiefe < 500) {
    // Linearer Fallback — GtV Bohrpreise (2024); DVGW W 115
    basiskosten = LINEAR_PREIS_PRO_M[gesteinstyp] * tiefe + LINEAR_MOBILISIERUNG[gesteinstyp]
  } else {
    // Lukawski-Formel: C(d) = (1.72e-7 × d² + 2.3e-3 × d − 0.62) × 10⁶ [USD 2009]
    // Lukawski et al. (2014), J. Pet. Sci. Eng. 118, 1–14
    const c_usd_2009 = (1.72e-7 * tiefe * tiefe + 2.3e-3 * tiefe - 0.62) * 1e6

    // Korrekturfaktoren
    // f_waehrung: USD₂₀₀₉ → EUR₂₀₂₆
    //   US CPI 2009–2026: ×1.54 (BLS, in2013dollars.com)
    //   EUR/USD: 1.39 (2009) → 1.15 (2026, ECB)
    //   Faktor: 1.54 / (1.15/1.39) ≈ 1.34
    //   Nächste Prüfung: April 2027 (f_markt deckt deutschen Marktaufschlag separat ab)
    const f_waehrung     = 1.34
    const f_gestein      = GESTEINS_FAKTOR[gesteinstyp]
    const f_region       = REGION_FAKTOR[region]
    const f_durchmesser  = DURCHMESSER_FAKTOR[durchmesser]
    const f_markt        = 1.40  // Deutscher Marktaufschlag; GtV / LIAG Broschüre Tiefe Geothermie

    basiskosten = c_usd_2009 * f_waehrung * f_gestein * f_region * f_durchmesser * f_markt
  }

  // Explorationsbohrung: +15 % Aufschlag (höhere Unsicherheit)
  if (inp.zweck === 'Explorationsbohrung') {
    basiskosten *= 1.15
  }

  return basiskosten
}

/**
 * Komplettierungskosten (pauschal) — DVGW W 115; Stober & Bucher (2012) Kap. 7; Branchenschätzung
 */
function berechneKomplettierung(inputs: BohrkostInputs, bohrkostenMid: number): number {
  const { tiefe, zweck, fuendigkeitsRisiko } = inputs
  const isDublette = zweck === 'Dublette'

  // Pumpe + Steigleitung: tiefe × 60 EUR/m (Dublette: ×2)
  const pumpe = tiefe * 60 * (isDublette ? 2 : 1)

  // Pumptest
  const pumptest = isDublette ? 80_000 : 60_000

  // Genehmigung WHG/BBergG
  const genehmigung = 25_000

  // Geologisches Gutachten
  const gutachten = 30_000

  // Versicherung Fündigkeitsrisiko
  const versicherung = bohrkostenMid * (fuendigkeitsRisiko / 100)

  return pumpe + pumptest + genehmigung + gutachten + versicherung
}

/**
 * MAP/KfW-Förderung — BEG / MAP-Programm KfW 2024
 * 375 EUR/m × min(tiefe, 2500), max. 2.500.000 EUR
 * Dublette: nur Förderbohrung (eine der zwei)
 */
function berechneFoerderung(inputs: BohrkostInputs): number {
  if (!inputs.foerderungAktiv) return 0
  const tiefeFoerder = Math.min(inputs.tiefe, 2500)
  return Math.min(375 * tiefeFoerder, 2_500_000)
}

/**
 * Thermische Leistung [kW]
 * Q_th = foerderrate [l/s = kg/s] × (tGW − tReinjektion) [K] × c_p [kJ/(kg·K)]
 * Drost (1978); VDI 4640 Bl. 2
 */
function berechneLeistung(inputs: BohrkostInputs): number {
  if (inputs.zweck === 'Explorationsbohrung') return 0
  const deltaT = inputs.tGW - inputs.tReinjektion
  if (deltaT <= 0) return 0
  return inputs.foerderrate * deltaT * 4.18
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────────

export function berechneBohrkosten(inputs: BohrkostInputs): BohrkostOutputs {
  const basisMid = berechneBohrkostenEine(inputs)

  // Bandbreite: min=mid×0.65, max=mid×1.50
  const basisMin = basisMid * 0.65
  const basisMax = basisMid * 1.50

  // Anzahl Bohrungen
  const anzahl_bohrungen = inputs.zweck === 'Dublette' ? 2 : 1

  // Gesamte Bohrkosten (alle Bohrungen)
  const bohrkosten_min = basisMin * anzahl_bohrungen
  const bohrkosten_mid = basisMid * anzahl_bohrungen
  const bohrkosten_max = basisMax * anzahl_bohrungen

  // Komplettierungskosten (Basis auf Mid-Bohrkosten für Risikoversicherung)
  const komplettierung = berechneKomplettierung(inputs, bohrkosten_mid)

  // Gesamtprojektkosten
  const projektkosten_min = bohrkosten_min + komplettierung
  const projektkosten_mid = bohrkosten_mid + komplettierung
  const projektkosten_max = bohrkosten_max + komplettierung

  // Förderung
  const foerderung_betrag = berechneFoerderung(inputs)

  const projektkosten_netto_min = Math.max(0, projektkosten_min - foerderung_betrag)
  const projektkosten_netto_mid = Math.max(0, projektkosten_mid - foerderung_betrag)
  const projektkosten_netto_max = Math.max(0, projektkosten_max - foerderung_betrag)

  // Thermische Leistung
  const leistung_kw = berechneLeistung(inputs)

  // Spezifische Investitionskosten [EUR/kW_th]
  const kosten_pro_kw_mid      = leistung_kw > 0 ? projektkosten_mid / leistung_kw : 0
  const kosten_pro_kw_netto_mid = leistung_kw > 0 ? projektkosten_netto_mid / leistung_kw : 0

  // Bohrkosten pro Meter [EUR/m] — eine Bohrung, Mittelpunkt
  const bohrkosten_pro_m = basisMid / inputs.tiefe

  // Overhead — Projektkosten außerhalb Bohrbaustelle
  const oh = inputs.overhead
  const overhead_gesamt = inputs.overheadAktiv
    ? oh.projektmanagement + oh.hydrogeologie + oh.bauueberwachung + oh.rechtsberatung + oh.oeffentlichkeitsarbeit
    : 0
  // Overhead wird nicht durch MAP/KfW gefördert → addiert sich auf Nettobasis
  const projektkosten_inkl_overhead_mid       = projektkosten_mid + overhead_gesamt
  const projektkosten_netto_inkl_overhead_mid = projektkosten_netto_mid + overhead_gesamt

  // Ampeln
  const ampel_kosten: BohrkostOutputs['ampel_kosten'] =
    kosten_pro_kw_mid <= 0     ? 'green'
    : kosten_pro_kw_mid < 500  ? 'green'
    : kosten_pro_kw_mid <= 1500 ? 'yellow'
    : 'red'

  const ampel_risiko: BohrkostOutputs['ampel_risiko'] =
    inputs.gesteinstyp === 'Lockergestein'          ? 'green'
    : inputs.gesteinstyp === 'Festgestein_sed'       ? 'yellow'
    : 'red'

  const ampel_tiefe: BohrkostOutputs['ampel_tiefe'] =
    inputs.tiefe <= 700  ? 'green'
    : inputs.tiefe <= 1500 ? 'yellow'
    : 'red'

  return {
    bohrkosten_min,
    bohrkosten_mid,
    bohrkosten_max,
    projektkosten_min,
    projektkosten_mid,
    projektkosten_max,
    foerderung_betrag,
    projektkosten_netto_min,
    projektkosten_netto_mid,
    projektkosten_netto_max,
    leistung_kw,
    kosten_pro_kw_mid,
    kosten_pro_kw_netto_mid,
    bohrkosten_pro_m,
    overhead_gesamt,
    projektkosten_inkl_overhead_mid,
    projektkosten_netto_inkl_overhead_mid,
    ampel_kosten,
    ampel_risiko,
    ampel_tiefe,
    anzahl_bohrungen,
  }
}
