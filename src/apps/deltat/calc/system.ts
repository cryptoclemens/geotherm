/**
 * calculateSystem — Kernberechnung Geothermische Dublette
 *
 * Quellen:
 *   - Wärmeinhalt:   Q_th = Q × ΔT × c_p  (c_p Wasser = 4.18 kJ/kg·K)
 *   - Tauchpumpe:    P = Q × ρ × g × H / η  (ρ=1000, g=9.81, η=0.6, H=foerderhoehe) — VDI 4640, Stober & Bucher (2012) Kap. 7.4
 *   - Durchbruch:    t = π·n·b·d² / (3·Q) × (ρc_Aquifer/ρc_Wasser)   (Gringarten & Sauty 1975)
 *   - COP:           COP_real = COP_Carnot × 0.5 = (T_VL / (T_VL − T_R)) × 0.5
 *                    (IEA HPP Annex 35, Arpagaus et al. 2018, Energy 152, Gl. 7)
 *   - WP-Elektrik:   W_el = Q_geo / (COP − 1)
 *   - LMTD:          (ΔT₁ − ΔT₂) / ln(ΔT₁/ΔT₂)  — VDI Wärmeatlas 2019
 *   - WP-Typen:      Zühlsdorf et al. 2019, Arpagaus et al. 2018, VDI 4640 Bl. 4
 *   - Material:      DVGW W 115 (TDS-Grenzwerte)
 *   - Transmissivität: VDI 4640 (T > 1e-3 m²/s = gut)
 */

export interface DeltaTInputs {
  /** Bohrtiefe [m] */
  tiefe: number
  /** Aquifer-Mächtigkeit [m] */
  maechtig: number
  /** hydraulische Leitfähigkeit k_f [m/s] */
  kf: number
  /** Grundwassertemperatur [°C] */
  tGW: number
  /** Mineralisation / TDS [mg/l] */
  tds: number
  /** Förderrate pro Dublette [l/s] */
  Q: number
  /** Reinjektionstemperatur [°C] */
  tR: number
  /** Bohrlochabstand [m] */
  abstand: number
  /** Ziel-Wärmeleistung gesamt [kW] */
  zielLeistung: number
  /** Vorlauftemperatur Wärmenetz [°C] */
  tVL: number
  /** Rücklauftemperatur Wärmenetz [°C] */
  tRL: number
  /** Laufstunden pro Jahr [h/a] */
  laufstunden: number
  /** Förderhöhe Tauchpumpe [m] — dynamischer Spiegel + Rohrreibung; typ. 100–250 m — Stober & Bucher (2012) Kap. 7.4 */
  foerderhoehe: number
}

export type TrafficLight = 'green' | 'yellow' | 'red'

export interface DeltaTOutputs {
  /** Transmissivität [m²/s] = k_f × Mächtigkeit */
  transmissiv: number
  /** Temperaturdifferenz Grundwasser – Reinjektion [K] */
  deltaT: number
  /** Thermische Leistung pro Dublette [kW] */
  qThPerDoublet: number
  /** Gesamte geothermische Leistung [kW] */
  qThGesamt: number
  /** Gelieferte Wärmeleistung inkl. WP-Beitrag [kW] */
  qDelivered: number
  /** Benötigte geothermische Leistung [kW] */
  qGeoBenoetigt: number
  /** Anzahl Dubletten */
  anzahlDoubletten: number
  /** Gesamtförderrate [l/s] */
  gesamtFoerderrate: number
  /** Tauchpumpenleistung pro Bohrung [kW] */
  tauchpumpenLeistung: number
  /** Thermische Durchbruchszeit [Jahre] */
  tBreak: number
  /** Spezifische Leistung [W/m] */
  spezLeistung: number
  /** Optimaler Abstand für t_break = 25 Jahre [m] */
  abstandOpt: number
  /** Realer COP (Carnot × 50%) */
  cop: number
  /** WP-Elektrikleistung [kW] */
  elLeistungWP: number
  /** LMTD Gegenstrom [K] oder null wenn ungültig */
  lmtd: number | null
  lmtdValid: boolean
  /** Wärmetauscherfläche [m²] oder null */
  wtFlaeche: number | null
  /** Temperaturdifferenz heiß-ein – kalt-aus */
  dT1: number
  /** Temperaturdifferenz heiß-aus – kalt-ein */
  dT2: number
  /** Jahreswärmemenge [MWh/a] */
  jahreswaerme: number
  /** Temperaturhub WP [K] = T_VL − T_GW */
  tHub: number
  /** WP-Typ Beschreibung */
  wpType: string
  wpColor: TrafficLight
  /** Empfohlenes WP-Modell */
  wpModel: string
  /** Material-Empfehlung (DVGW W 115) */
  material: string
  materialColor: TrafficLight
  /** Scaling-Risiko */
  scaling: string
  scalingColor: TrafficLight
  /** Ampeln */
  sHydraulik: TrafficLight
  sThermik: TrafficLight
  sDurchbruch: TrafficLight
  sCOP: TrafficLight
  sMaterial: TrafficLight
  /** WP aktiv? */
  wpAktiv: boolean
}

export const DEFAULT_INPUTS: DeltaTInputs = {
  tiefe: 500,
  maechtig: 40,
  kf: 1e-4,
  tGW: 25,
  tds: 500,
  Q: 15,
  tR: 12,
  abstand: 500,
  zielLeistung: 5000,
  tVL: 90,
  tRL: 55,
  laufstunden: 2000,
  foerderhoehe: 150,
}

export function calculateSystem(inp: DeltaTInputs): DeltaTOutputs {
  const { tiefe, maechtig, kf, tGW, tds, Q, tR, abstand, zielLeistung, tVL, tRL, laufstunden, foerderhoehe } = inp

  const transmissiv = kf * maechtig
  const deltaT = tGW - tR
  // Q_th = Q[l/s = kg/s] × c_p[kJ/kg·K] × ΔT[K] — kW
  const qThPerDoublet = Math.max(0.01, Q * deltaT * 4.18)

  // Vorab-COP für WP-Beitragsrechnung — T_R (Reinjektionstemperatur) als Quellen-Temp
  // Arpagaus et al. 2018, Energy 152, Gl. 7
  const _tVL_K = tVL + 273.15
  const _tR_K = tR + 273.15
  const _tDiff = _tVL_K - _tR_K
  const _copEst = _tDiff > 0.5 ? (_tVL_K / _tDiff) * 0.5 : 99

  const wpAktiv = tVL > tGW
  const qGeoBenoetigt = wpAktiv && _copEst < 90
    ? zielLeistung * (_copEst - 1) / _copEst  // WP addiert W_el → weniger Q_geo nötig
    : zielLeistung

  const anzahlDoubletten = deltaT > 0 ? Math.max(1, Math.ceil(qGeoBenoetigt / qThPerDoublet)) : 999
  const qThGesamt = anzahlDoubletten * qThPerDoublet
  const qDelivered = wpAktiv && _copEst < 90
    ? qThGesamt * _copEst / (_copEst - 1)
    : qThGesamt

  const gesamtFoerderrate = anzahlDoubletten * Q
  // P_pump = Q[m³/s] × ρ[kg/m³] × g[m/s²] × H[m] / η — VDI 4640, Stober & Bucher (2012) Kap. 7.4
  // H = foerderhoehe (dynamischer Spiegel + Rohrreibung), NICHT Bohrtiefe — Faktor 2-5 Unterschied!
  const tauchpumpenLeistung = (Q / 1000) * 1000 * 9.81 * foerderhoehe / (0.6 * 1000)

  // Durchbruchszeit [Jahre] — Gringarten & Sauty 1975, Water Resources Research
  // t = (π·n·b·D²) / (3·Q) × (ρc_Aquifer / ρc_Wasser) / (365·24·3600)
  const n = 0.25
  const hcRatio = 0.7  // ρc_Aquifer/ρc_Wasser = 2.3e6/4.18e6 ≈ 0.55 (Sandstein); Default 0.7 (konservativ)
  const tBreak = (Math.PI * n * maechtig * abstand * abstand) / (3 * (Q / 1000)) * hcRatio / (365 * 24 * 3600)

  const spezLeistung = tiefe > 0 ? (qThPerDoublet * 1000) / tiefe : 0

  // Optimaler Abstand für t_break = 25 Jahre
  const abstandOpt = Math.sqrt((3 * (Q / 1000) * 25 * 365 * 86400) / (Math.PI * 0.25 * maechtig * hcRatio))

  // COP real = COP_Carnot × 0.5, Quellen-Temp = T_R (Reinjektionstemperatur)
  // Arpagaus et al. 2018, Energy 152, Gl. 7 — T_R ist Verdampfer-Austrittstemperatur
  const tVL_K = tVL + 273.15
  const tR_K = tR + 273.15
  const tDiff_K = tVL_K - tR_K
  const cop = tDiff_K > 0.5 ? (tVL_K / tDiff_K) * 0.5 : 99

  // W_el = Q_geo / (COP − 1) — nur wenn WP aktiv
  const elLeistungWP = wpAktiv && cop < 90 ? qThGesamt / (cop - 1) : 0

  // LMTD Gegenstrom: heiß (T_GW→T_R), kalt (T_RL→T_VL) — VDI Wärmeatlas 2019
  const dT1 = tGW - tVL
  const dT2 = tR - tRL
  let lmtd: number | null = null
  let lmtdValid = false
  if (dT1 > 0 && dT2 > 0) {
    lmtdValid = true
    lmtd = Math.abs(dT1 - dT2) < 0.001 ? dT1 : (dT1 - dT2) / Math.log(dT1 / dT2)
  }

  const U = 4000 // W/(m²·K) — Plattenwärmetauscher, VDI Wärmeatlas
  const wtFlaeche = lmtdValid && lmtd && lmtd > 0
    ? (qThGesamt * 1000) / (U * lmtd)
    : null

  // WP-Typ — VDI 4640, Arpagaus 2018, Zühlsdorf 2019
  const tHub = tVL - tGW
  let wpType: string, wpColor: TrafficLight, wpModel: string
  if (tHub <= 0) {
    wpType = '✔ Direktnutzung möglich (kein Hub)'; wpColor = 'green'
    wpModel = 'Direkteinspeisung ins Netz (kein WP-Aufwand)'
  } else if (tHub <= 35) {
    wpType = '🔵 Standard-WP geeignet (Hub ≤ 35 K)'; wpColor = 'green'
    wpModel = 'Standard Sole-Wasser-WP (z.B. Viessmann Vitocal, Vaillant geoTHERM)'
  } else if (tHub <= 60) {
    wpType = '⚡ Hochtemperatur-WP erforderlich (Hub 35–60 K)'; wpColor = 'yellow'
    wpModel = 'Hochtemperatur-WP (z.B. Ochsner GMWW, Enwave HT-WP 90 °C)'
  } else {
    wpType = '🔴 Industrielle HT-WP / ORC prüfen (Hub > 60 K)'; wpColor = 'red'
    wpModel = 'Industrielle HT-WP oder ORC-Prozess (Projekt-Engineering erforderlich)'
  }

  // Material — DVGW W 115
  let material: string, materialColor: TrafficLight
  if (tds < 1000)       { material = '1.4571 (Edelstahl) ausreichend';       materialColor = 'green' }
  else if (tds < 10000) { material = '1.4462 (Duplex-Stahl) empfohlen';      materialColor = 'yellow' }
  else                  { material = 'Titan / Hastelloy C-276 erforderlich'; materialColor = 'red' }

  // Scaling
  let scaling: string, scalingColor: TrafficLight
  if (tds < 500)        { scaling = 'Gering – keine Sondermaßnahmen';             scalingColor = 'green' }
  else if (tds < 5000)  { scaling = 'Mittel – Enthärtung / Inhibitoren prüfen';   scalingColor = 'yellow' }
  else                  { scaling = 'Hoch – chem. Behandlung + Monitoring';        scalingColor = 'red' }

  // Ampeln — VDI 4640 Transmissivitätsgrenzen
  const sHydraulik: TrafficLight  = transmissiv > 1e-3 ? 'green' : transmissiv > 1e-4 ? 'yellow' : 'red'
  const sThermik: TrafficLight    = deltaT <= 0 ? 'red'
    : qDelivered >= zielLeistung * 0.99 ? 'green'
    : qDelivered >= zielLeistung * 0.80 ? 'yellow' : 'red'
  const sDurchbruch: TrafficLight = tBreak > 25 ? 'green' : tBreak > 15 ? 'yellow' : 'red'
  const sCOP: TrafficLight        = cop > 3 ? 'green' : cop > 2 ? 'yellow' : 'red'
  const sMaterial: TrafficLight   = materialColor

  // Jahreswärmemenge [MWh/a] — gesamte ans Netz gelieferte Wärme (inkl. WP-Beitrag)
  const jahreswaerme = qDelivered * (laufstunden || 2000) / 1000

  return {
    transmissiv, deltaT, qThPerDoublet, qThGesamt, qDelivered, qGeoBenoetigt,
    anzahlDoubletten, gesamtFoerderrate, tauchpumpenLeistung,
    tBreak, spezLeistung, abstandOpt,
    cop, elLeistungWP,
    lmtd, lmtdValid, wtFlaeche,
    wpType, wpColor, wpModel,
    material, materialColor, scaling, scalingColor,
    dT1, dT2,
    jahreswaerme, tHub,
    sHydraulik, sThermik, sDurchbruch, sCOP, sMaterial,
    wpAktiv,
  }
}
