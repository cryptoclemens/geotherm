/**
 * berechneBohrkosten — Kernberechnung Bohrkostenrechner
 *
 * Quellen:
 *   - Bohrkosten:    Lukawski et al. (2014), J. Pet. Sci. Eng. 118, 1–14
 *                   (146 hydrothermal/EGS-Bohrungen; gilt für Produktions- +
 *                    Injektionsbohrungen — NICHT für Erdwärmesonden/BHE)
 *   - Linearer Fallback: GtV Bohrpreise (2024); DVGW W 115
 *   - Gestein-Faktoren: Baujard et al. (2017), Stanford SGW
 *   - Währungsfaktor: BLS CPI 2009–2026 (×1.54) ÷ ECB-Kurs 2026 (1.15) → f_waehrung=1.34
 *   - Marktaufschlag: GtV Bundesverband Geothermie; LIAG Broschüre Tiefe Geothermie
 *   - Komplettierung: DVGW W 115; Stober & Bucher (2012) Kap. 7
 *   - Förderung:     BEG / MAP-Programm KfW 2024
 *   - Thermische Leistung: Drost (1978); VDI 4640 Bl. 2
 */

export type Gesteinstyp = 'Lockergestein' | 'Festgestein_sed' | 'Festgestein_kristallin'
export type Bohrungszweck = 'Dublette' | 'Einzelbohrung' | 'Explorationsbohrung'
export type Produktionsdurchmesser = '7"' | '9 5/8"' | '13 3/8"' | 'Sonderausbau'
export type Region = 'NDB' | 'Molasse' | 'Oberrheingraben' | 'Sonstiges'

/** Herkunft eines Bohrplatz-Profils. Die Quelle ist Teil der Aussage, nicht Beiwerk:
 *  ein Schichtenverzeichnis des Landesamts trägt anders als eine Schätzung. */
export type Profilquelle = 'Schichtenverzeichnis' | 'Nachbarbohrung' | 'Bohrunternehmen' | 'Schätzung'

/** Eine durchbohrte Schicht [m unter GOK]. bis_m > von_m. */
export interface Schicht {
  von_m: number
  bis_m: number
  gesteinstyp: Gesteinstyp
}

/** Schichtenfolge eines konkreten Bohrplatzes.
 *  Kommt NICHT aus dem Atlas: dessen feinste Ebene (GÜK250, 1:250.000) zeigt
 *  Oberflächengeologie, der Rechner braucht die durchbohrte Folge — ein Standort kann
 *  oben Lockergestein führen und bei 150 m Festgestein. Quellen sind daher
 *  Schichtenverzeichnisse der Landesämter, Nachbarbohrungen oder das Bohrunternehmen.
 *  Siehe docs/requirements/bohrplatz-profil.md */
export interface BohrplatzProfil {
  schichten: Schicht[]
  quelle: Profilquelle
}

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
  /** Pauschal-Gesteinstyp für die ganze Bohrung. Gilt, wenn kein gültiges `profil` gesetzt ist. */
  gesteinstyp: Gesteinstyp
  /** Optionales Schichtenprofil des konkreten Bohrplatzes. Überschreibt `gesteinstyp`.
   *  null oder ungültig (Lücke/Überlappung/deckt tiefe nicht ab) → Rückfall auf `gesteinstyp`. */
  profil: BohrplatzProfil | null
  /** Ausbaudurchmesser [mm] bei durchmesser === 'Sonderausbau'. Reine Dokumentation:
   *  Es gibt keine belastbare Stützstelle jenseits 340 mm, deshalb geht der Wert NICHT in
   *  die Rechnung ein — siehe DURCHMESSER_FAKTOR. */
  sonderausbauMm?: number
  /** Bohrungszweck */
  zweck: Bohrungszweck
  /** Anzahl Dubletten [1–8] — aus DeltaT-Ergebnis vorbelegt, manuell überschreibbar.
   *  Nur relevant wenn zweck === 'Dublette'.
   *  Conservative: kein Skalenrabatt (liegt in ±35–50 %-AACE-Class-5-Bandbreite).
   *  Quelle: GtV Bohrpreise 2024 (Pad-Drilling-Rabatt 5–15 % ab 2. Bohrung). */
  anzahlDubletten: number
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
  // Bohrkosten gesamt (alle Bohrungen des Projekts summiert)
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
  /** true wenn tiefe ≤ 400 m → linearer GtV-/DVGW-Zweig aktiv.
   *  KEIN Fehler und keine Rechenlücke: Der Rechner liefert über die volle Spanne 100–3000 m
   *  ein Ergebnis. Das Flag sagt nur, dass der Preis hier aus GtV/DVGW stammt und dort für
   *  klein-kalibrige Brunnen (Ausbau bis 13 3/8") kalibriert ist — für die ist er belastbar.
   *  Bei größerem Ausbau liegt er zu niedrig. Im UI deshalb als Hinweis darstellen, nicht als
   *  Warnung — siehe PLAUSI_CHECK.md, Befund A (Juli 2026). */
  kleinkaliberHinweis: boolean
  /** true wenn ein gültiges Schichtenprofil in die Rechnung eingeht.
   *  false auch dann, wenn ein Profil gesetzt, aber ungültig ist → Rückfall auf `gesteinstyp`. */
  profilAktiv: boolean
  /** true bei durchmesser === 'Sonderausbau'.
   *  Anders als kleinkaliberHinweis ein echter Gültigkeitsbruch: DURCHMESSER_FAKTOR endet bei
   *  13 3/8" (340 mm), darüber gibt es keine Stützstelle. Das Ergebnis ist dann der Wert für
   *  13 3/8" — kein Schätzwert für den eingegebenen Ausbau. Im UI als Warnung darstellen
   *  (amber-Stufe wie kluftaquiferWarnung), nicht als Hinweis. */
  ausserhalbKalibrierung: boolean
}

export const DEFAULT_INPUTS: BohrkostInputs = {
  tiefe: 700,
  gesteinstyp: 'Festgestein_sed',
  profil: null,
  zweck: 'Dublette',
  anzahlDubletten: 1,
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
  // Kristallin 1.30 am unteren Rand der Literatur (real 1.5–2.5 möglich je nach Mineralogie);
  // AACE Class 5 ±35–50 % deckt erhöhte Unsicherheit ab.
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
  // Sonderausbau (> 13 3/8" / 340 mm): BEWUSST KEIN eigener Faktor.
  // Es existiert keine belastbare Stützstelle jenseits 340 mm — ein extrapolierter Wert wäre
  // Scheingenauigkeit. Gerechnet wird mit dem letzten kalibrierten Faktor; das Ergebnis ist
  // damit der Wert für 13 3/8" und ausdrücklich KEINE Schätzung für den realen Ausbau.
  // Kenntlich über BohrkostOutputs.ausserhalbKalibrierung.
  'Sonderausbau': 1.25,
}

/** Härte-Rangfolge für die Mobilisierung: Das Bohrgerät muss die härteste durchbohrte
 *  Schicht schaffen, nicht die durchschnittliche. */
const HAERTE_RANG: Record<Gesteinstyp, number> = {
  'Lockergestein':          0,
  'Festgestein_sed':        1,
  'Festgestein_kristallin': 2,
}

/**
 * Schichten bis zur Bohrtiefe, sortiert und auf `tiefe` beschnitten.
 * Ein Profil darf tiefer reichen als die Bohrung — dann zählt nur der durchbohrte Teil.
 */
function schichtenBis(profil: BohrplatzProfil, tiefe: number): Schicht[] {
  return profil.schichten
    .filter(s => s.von_m < tiefe)
    .map(s => ({ ...s, bis_m: Math.min(s.bis_m, tiefe) }))
    .sort((a, b) => a.von_m - b.von_m)
}

/** Warum ein Profil nicht rechnet. Strukturiert statt als Text, damit die Formulierung
 *  im UI liegt und der Rechenkern textfrei bleibt. */
export type ProfilProblem =
  | { art: 'leer' }
  | { art: 'startet_nicht_bei_null'; von: number }
  | { art: 'leere_schicht'; index: number }
  | { art: 'luecke'; von: number; bis: number }
  | { art: 'ueberlappung'; von: number; bis: number }
  | { art: 'zu_kurz'; ende: number; tiefe: number }

/**
 * Prüft, ob ein Profil 0…tiefe lückenlos und überlappungsfrei abdeckt.
 * Gibt das erste Problem zurück oder null, wenn das Profil rechnet.
 *
 * EINZIGE Quelle dieser Regel: Der Rechenkern fällt bei ungültigen Profilen auf den
 * Pauschaltyp zurück, und das UI erklärt dem Nutzer warum. Eine zweite Implementierung im
 * UI würde driften — dann meldet das UI „gültig", während der Kern still zurückfällt.
 * Genau die Fehlerklasse von Befund B (stille No-Ops).
 *
 * Ungültige Profile rechnen NICHT teilweise mit, sondern fallen ganz zurück — ein halb
 * angewandtes Profil wäre eine stille Falschaussage.
 */
export function pruefeProfil(profil: BohrplatzProfil | null | undefined, tiefe: number): ProfilProblem | null {
  if (!profil || profil.schichten.length === 0) return { art: 'leer' }
  const s = [...profil.schichten].sort((a, b) => a.von_m - b.von_m)
  if (s[0].von_m !== 0) return { art: 'startet_nicht_bei_null', von: s[0].von_m }
  for (let i = 0; i < s.length; i++) {
    if (!(s[i].bis_m > s[i].von_m)) return { art: 'leere_schicht', index: i }
    if (i > 0 && s[i].von_m > s[i - 1].bis_m) return { art: 'luecke', von: s[i - 1].bis_m, bis: s[i].von_m }
    if (i > 0 && s[i].von_m < s[i - 1].bis_m) return { art: 'ueberlappung', von: s[i].von_m, bis: s[i - 1].bis_m }
  }
  const ende = s[s.length - 1].bis_m
  return ende >= tiefe ? null : { art: 'zu_kurz', ende, tiefe }
}

function profilIstGueltig(profil: BohrplatzProfil | null | undefined, tiefe: number): boolean {
  return pruefeProfil(profil, tiefe) === null
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
  const { tiefe, gesteinstyp, durchmesser, region, profil } = inp
  const profilAktiv = profilIstGueltig(profil, tiefe)
  const schichten = profilAktiv ? schichtenBis(profil!, tiefe) : []

  // Korrekturfaktoren (für beide Formeln benötigt)
  // f_waehrung: USD₂₀₀₉ → EUR₂₀₂₆ — zwei Schritte, ein Wechselkurs:
  //   1. Inflation in USD:  US CPI 2009–2026 ×1.54 (BLS) → USD₂₀₂₆
  //   2. Konversion:        Kurs 2026 EUR/USD 1.15 (ECB) → EUR₂₀₂₆
  //   Faktor: 1.54 / 1.15 ≈ 1.34
  //   Der Kurs 2009 (1.39) geht bewusst NICHT ein — CPI gilt in USD, daher wird erst
  //   innerhalb USD inflationiert und nur einmal konvertiert (sonst Kurs doppelt gezählt).
  //   Nächste Prüfung: April 2027 (f_markt deckt deutschen Marktaufschlag separat ab)
  //   Offene Frage: CPI misst Verbraucher-, nicht Bohrmarktpreise — PLAUSI_CHECK.md, Befund C
  const f_waehrung     = 1.34
  // f_gestein: bei aktivem Profil das TIEFENGEWICHTETE MITTEL der Schichtfaktoren.
  // Bewusst kein schichtweises Zerlegen der Lukawski-Kurve: Sie ist eine Regression über
  // 146 GANZE Bohrungen, keine EUR/m-Rate, und liefert unterhalb 264,3 m negative Kosten.
  // Zerlegbar wäre sie nur über die Grenzkosten dC/dd — dann bräuchte der Term −0,62 Mio.
  // (ein Fit-Artefakt ohne physikalische Bedeutung) eine Schichtzuordnung, die das Ergebnis
  // um rund 829 T€ verschiebt. Der Realismusgewinn läge unter der AACE-Class-5-Bandbreite
  // von ±35–50 %. Siehe docs/requirements/bohrplatz-profil.md.
  // Eine Schicht über die volle Tiefe ⇒ Mittel = GESTEINS_FAKTOR[gesteinstyp] (identisch).
  const f_gestein      = profilAktiv
    ? schichten.reduce((acc, s) => acc + GESTEINS_FAKTOR[s.gesteinstyp] * (s.bis_m - s.von_m) / tiefe, 0)
    : GESTEINS_FAKTOR[gesteinstyp]
  const f_region       = REGION_FAKTOR[region]
  const f_durchmesser  = DURCHMESSER_FAKTOR[durchmesser]
  const f_markt        = 1.40  // Deutscher Marktaufschlag; GtV / LIAG Broschüre Tiefe Geothermie
  const f_gesamt       = f_waehrung * f_gestein * f_region * f_durchmesser * f_markt

  // Lukawski-Formel: C(d) = (1.72e-7 × d² + 2.3e-3 × d − 0.62) × 10⁶ [USD 2009]
  // Lukawski et al. (2014), J. Pet. Sci. Eng. 118, 1–14
  const c_usd_2009 = (1.72e-7 * tiefe * tiefe + 2.3e-3 * tiefe - 0.62) * 1e6
  const lukawski = c_usd_2009 * f_gesamt

  // Linearer Fallback — GtV Bohrpreise (2024); DVGW W 115
  // f_region und f_durchmesser wirken hier ebenfalls (Befund B, PLAUSI_CHECK.md Juli 2026):
  // zuvor galt f_gesamt nur im Lukawski-Zweig, wodurch beide UI-Felder unterhalb 400 m
  // stille No-Ops waren (7" = 9 5/8" = 13 3/8" = 159,0 T€ bei 280 m).
  // Bewusst NICHT angewendet:
  //   f_markt    — GtV-/DVGW-Preise sind bereits deutsche Marktpreise (doppelter Aufschlag)
  //   f_waehrung — die Preise stehen bereits in EUR
  //   f_gestein  — steckt bereits in LINEAR_PREIS_PRO_M / LINEAR_MOBILISIERUNG
  // Der Faktor greift an der linear-Variablen selbst, damit der Blend 400–600 m ihn
  // anteilig mitnimmt und an der Naht bei 400 m keine Unstetigkeit entsteht.
  const f_linear = f_region * f_durchmesser

  // Bei aktivem Profil wird hier ECHT integriert: LINEAR_PREIS_PRO_M ist eine EUR/m-Rate und
  // lässt sich schichtweise summieren — anders als die Lukawski-Kurve (siehe f_gestein oben).
  // Mobilisierung nach dem HÄRTESTEN durchbohrten Gestein: Das Bohrgerät muss die härteste
  // Schicht schaffen, nicht die durchschnittliche. Mit einer Schicht ist das Maximum diese
  // Schicht ⇒ identisch zum Pauschalfall.
  const linearBasis = profilAktiv
    ? schichten.reduce((acc, s) => acc + LINEAR_PREIS_PRO_M[s.gesteinstyp] * (s.bis_m - s.von_m), 0)
      + LINEAR_MOBILISIERUNG[schichten.reduce(
          (haertestes, s) => HAERTE_RANG[s.gesteinstyp] > HAERTE_RANG[haertestes] ? s.gesteinstyp : haertestes,
          schichten[0].gesteinstyp,
        )]
    : LINEAR_PREIS_PRO_M[gesteinstyp] * tiefe + LINEAR_MOBILISIERUNG[gesteinstyp]
  const linear = linearBasis * f_linear

  let basiskosten: number
  if (tiefe <= 400) {
    // Unterhalb 400 m: lineares Modell (Lukawski nicht valide für flache Bohrungen)
    basiskosten = linear
  } else if (tiefe < 600) {
    // Übergangsbereich 400–600 m: linearer Blend — vermeidet Unstetigkeit bei 500 m
    // (Scientist-Review 2026-04-14: harter Sprung ~140 % ohne Blend)
    const blend = (tiefe - 400) / 200
    basiskosten = linear * (1 - blend) + lukawski * blend
  } else {
    // ≥ 600 m: Lukawski-Formel
    basiskosten = lukawski
  }

  // Explorationsbohrung: +15 % Aufschlag (höhere Unsicherheit)
  if (inp.zweck === 'Explorationsbohrung') {
    basiskosten *= 1.15
  }

  return basiskosten
}

/**
 * Komplettierungskosten — DVGW W 115; Stober & Bucher (2012) Kap. 7; Branchenschätzung
 *
 * Skalierungslogik bei n Dubletten (Scientist-Review 2026-04-14):
 *   Pumpe/Steigleitung: linear per Bohrung (× n × 2)
 *   Pumptest:           linear per Dublette (× n)
 *   Genehmigung:        einmalig pro Projekt, dann +5k EUR je weitere Dublette (BBergG/WHG)
 *   Gutachten:          weitgehend fix, moderate Steigerung (Stober & Bucher 2012, Kap. 6.2)
 *   Versicherung:       % von Bohrkosten → skaliert automatisch
 */
function berechneKomplettierung(inputs: BohrkostInputs, bohrkostenMid: number): number {
  const { tiefe, zweck, fuendigkeitsRisiko, anzahlDubletten } = inputs
  const isDublette = zweck === 'Dublette'
  const n = isDublette ? Math.max(1, anzahlDubletten) : 1

  // Pumpe + Steigleitung: tiefe × 60 EUR/m × Anzahl Bohrungen
  const pumpe = tiefe * 60 * (isDublette ? n * 2 : 1)

  // Pumptest: einmal pro Dublette
  const pumptest = isDublette ? 80_000 * n : 60_000

  // Genehmigung WHG/BBergG: einmalig pro Projekt + 5k EUR je weitere Dublette
  const genehmigung = 25_000 + 5_000 * Math.max(0, n - 1)

  // Geologisches Gutachten: weitgehend fix; +20 % je weitere Dublette (konservativ)
  const gutachten = 30_000 * (1 + 0.2 * Math.max(0, n - 1))

  // Versicherung Fündigkeitsrisiko: % von Bohrkosten (skaliert automatisch)
  const versicherung = bohrkostenMid * (fuendigkeitsRisiko / 100)

  return pumpe + pumptest + genehmigung + gutachten + versicherung
}

/**
 * MAP/KfW-Förderung — BEG / MAP-Programm KfW 2024
 * 375 EUR/m × min(tiefe, 2500), max. 2.500.000 EUR pro Förderbohrung
 * Bei n Dubletten: n × Förderbohrungen förderfähig (BEG EW 2024, Ziff. 5.3)
 * Programmobergrenze: 20.000.000 EUR pro Vorhaben (BEG EW 2024, Ziff. 9)
 */
function berechneFoerderung(inputs: BohrkostInputs): number {
  if (!inputs.foerderungAktiv) return 0
  const tiefeFoerder = Math.min(inputs.tiefe, 2500)
  const foerderungProBohrung = Math.min(375 * tiefeFoerder, 2_500_000)
  const n = inputs.zweck === 'Dublette' ? Math.max(1, inputs.anzahlDubletten) : 1
  return Math.min(foerderungProBohrung * n, 20_000_000)
}

/**
 * Thermische Leistung gesamt [kW] — alle Dubletten
 * Q_th = n × foerderrate [l/s = kg/s] × (tGW − tReinjektion) [K] × c_p [kJ/(kg·K)]
 * Drost (1978); VDI 4640 Bl. 2
 */
function berechneLeistung(inputs: BohrkostInputs): number {
  if (inputs.zweck === 'Explorationsbohrung') return 0
  const deltaT = inputs.tGW - inputs.tReinjektion
  if (deltaT <= 0) return 0
  const n = inputs.zweck === 'Dublette' ? Math.max(1, inputs.anzahlDubletten) : 1
  return n * inputs.foerderrate * deltaT * 4.18
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────────

export function berechneBohrkosten(inputs: BohrkostInputs): BohrkostOutputs {
  const basisMid = berechneBohrkostenEine(inputs)

  // Bandbreite: min=mid×0.65, max=mid×1.50
  const basisMin = basisMid * 0.65
  const basisMax = basisMid * 1.50

  // Anzahl Bohrungen: bei n Dubletten = n × 2 Bohrungen (konservativ linear, kein Skalenrabatt)
  // Skaleneffekte 5–15 % (GtV 2024, Pad-Drilling) liegen in ±35–50 %-AACE-Class-5-Bandbreite
  const n = inputs.zweck === 'Dublette' ? Math.max(1, inputs.anzahlDubletten) : 1
  const anzahl_bohrungen = inputs.zweck === 'Dublette' ? n * 2 : 1

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

  // Gültigkeitsgrenze linearer Zweig — PLAUSI_CHECK.md, Befund A (Juli 2026)
  const kleinkaliberHinweis = inputs.tiefe <= 400

  // Profil nur aktiv, wenn es 0…tiefe lückenlos abdeckt — sonst stiller Rückfall wäre schlimmer
  // als gar kein Profil. Dieselbe Prüfung wie in berechneBohrkostenEine.
  const profilAktiv = profilIstGueltig(inputs.profil, inputs.tiefe)

  // Echter Gültigkeitsbruch, nicht nur Kalibrierungsrand: DURCHMESSER_FAKTOR endet bei 340 mm.
  const ausserhalbKalibrierung = inputs.durchmesser === 'Sonderausbau'

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
    kleinkaliberHinweis,
    profilAktiv,
    ausserhalbKalibrierung,
  }
}
