/**
 * optimize.ts — Automatische Parameteroptimierung für geothermische Dubletten
 *
 * Zwei Optimierungsmodi (Scientist-Review April 2026):
 *   1. MIN_DOUBLETTEN — minimiert CAPEX durch Reduktion der Dublettenanzahl
 *   2. MAX_SPF        — maximiert Seasonal Performance Factor (SPF = gelieferte Wärme / ges. Strom)
 *
 * Quellen:
 *   - Gringarten & Sauty (1975) Water Resources Research Vol. 11 No. 5
 *   - Thiem (1906) Hydrologische Methoden, Br.-Formel für Q_max
 *   - DVGW W 115 (2008) Abschn. 6.2 — hydraulische Auslegung Förderbohrung
 *   - VDI 4640 Bl. 2 (2001) Abschn. 5.4 — Reinjektion, Minimaltemperatur
 *   - VDI Wärmeatlas 2019 Abschn. C1 — Wärmetauscher Pinch-Point
 *   - Stober & Bucher (2012) Kap. 7.4 — Tauchpumpen Eigenverbrauch
 */

import { calculateSystem } from './system'
import type { DeltaTInputs } from './system'

export type OptimizeMode = 'MIN_DOUBLETTEN' | 'MAX_SPF'

export interface OptimizeChange {
  /** Parameter-Label für die UI */
  label: string
  /** Vorheriger Wert (formatiert) */
  vorher: string
  /** Neuer Wert (formatiert) */
  nachher: string
  /** Begründung (Quelle) */
  rationale: string
}

export type OptimizeResult =
  | {
      ok: true
      mode: OptimizeMode
      newInputs: Partial<DeltaTInputs>
      changes: OptimizeChange[]
      /** Wichtige Hinweise / Einschränkungen */
      hinweise: string[]
    }
  | {
      ok: false
      error: string
    }

/** Physikalische Konstanten für Optimierung */
const R_EINFLUSS  = 500  // m — Einflussradius Brunnen (DVGW W 115)
const R_BRUNNEN   = 0.15 // m — Brunnenradius
const HC_RATIO    = 0.7  // ρc_Aquifer/ρc_Wasser — konservativ (Sandstein 0,55; default 0,70)
const T_BREAK_ZIEL = 25  // Jahre — Auslegungslebensdauer (VDI 4640 Bl. 2)
const ABSTAND_MIN  = 300 // m — technisches Minimum (getrennte Bohrplätze)
/** Mindest-Reinjektionstemperatur [°C] — Frostschutz + Ökologie, VDI 4640 Bl. 2 Abschn. 5.4
 *  Im WP-Betrieb (tVL > tGW) ist tR unabhängig von tRL — die WP überbrückt den Temperaturhub. */
const TR_MIN = 2

/**
 * Berechnet hydraulisch maximal zulässige Förderrate nach Thiem (1906).
 * Q_max = 2π × T × s_zul / ln(R/r_w)  mit  s_zul = b/3  (DVGW W 115 Abschn. 6.2)
 */
function calcQMaxHydraulisch(kf: number, maechtig: number): number {
  const T = kf * maechtig             // Transmissivität [m²/s]
  const sZul = maechtig / 3           // zulässige Absenkung [m]
  const q = (2 * Math.PI * T * sZul) / Math.log(R_EINFLUSS / R_BRUNNEN)
  return Math.max(1, Math.round(q * 1000 * 10) / 10)  // l/s, mind. 1 l/s
}

/**
 * Optimaler Bohrlochabstand für gegebene Durchbruchszeit [m]
 * d = sqrt(3 × Q × t / (π × n × b × hcRatio))  — Gringarten & Sauty (1975)
 */
function calcAbstandOpt(Q_ls: number, porositaet: number, maechtig: number, tBreakJahre: number): number {
  const Q_m3s = Q_ls / 1000
  const tSek = tBreakJahre * 365 * 24 * 3600
  return Math.sqrt((3 * Q_m3s * tSek) / (Math.PI * porositaet * maechtig * HC_RATIO))
}

/**
 * Modus 1: Minimale Doubletten-Anzahl
 *
 * Algorithmus (analytisch, O(1)):
 *   1. Q_max aus Thiem-Formel (DVGW W 115)
 *   2. tR_opt = max(2 °C, tRL − WT_PINCH_K) — Pinch-Point Wärmetauscher
 *   3. Q = min(100, Q_max)
 *   4. n_opt = ceil(Q_geo / q_Dublett(Q, ΔT))
 *   5. Q' = min Q für exakt n_opt Doubletten (kein Reserve-Overhead)
 *   6. abstand = max(abstand_opt(Q', 25a), ABSTAND_MIN)
 */
export function optimizeMinDoubletten(inputs: DeltaTInputs): OptimizeResult {
  const { kf, maechtig, tGW, porositaet } = inputs

  const qMax = calcQMaxHydraulisch(kf, maechtig)
  const tRMin = TR_MIN  // 2 °C — Frostschutz/Ökologie (VDI 4640 Bl. 2 Abschn. 5.4)
  const deltaT = tGW - tRMin

  if (deltaT <= 0) {
    return {
      ok: false,
      error: `T_GW (${tGW} °C) ≤ T_R_min (${tRMin} °C) — kein Wärmeentzug möglich. Tiefere Bohrung oder niedrigere Vorlauftemperatur erforderlich.`,
    }
  }

  // Q auf 100 l/s cappen (Slider-Grenze) und auf 1 l/s-Schritte runden
  const qOpt = Math.min(100, Math.floor(qMax))

  // Geothermische Nettoleistung die benötigt wird (ohne WP-Überhöhung)
  const trialOutputs = calculateSystem({ ...inputs, Q: qOpt, tR: tRMin })
  const qGeoBenoetigt = trialOutputs.qGeoBenoetigt

  // n_opt: Anzahl Doubletten für maximales Q
  const qPerDoublet = qOpt * deltaT * 4.18  // kW
  if (qPerDoublet <= 0) {
    return { ok: false, error: 'Thermische Leistung je Dublette ≤ 0 — ΔT prüfen.' }
  }
  const nOpt = Math.max(1, Math.ceil(qGeoBenoetigt / qPerDoublet))

  // Minimales Q das genau nOpt Doubletten erfordert
  const qMin4n = qGeoBenoetigt / (nOpt * deltaT * 4.18)
  // Aufrunden auf 0,5 l/s, damit Berechnung stabil bleibt
  const qFinal = Math.min(qOpt, Math.max(1, Math.ceil(qMin4n * 2) / 2))

  // Optimaler Abstand für t_Break = 25 Jahre bei qFinal
  const abstandRaw = calcAbstandOpt(qFinal, porositaet, maechtig, T_BREAK_ZIEL)
  const abstandFinal = Math.max(ABSTAND_MIN, Math.ceil(abstandRaw / 50) * 50)

  const changes: OptimizeChange[] = []
  const hinweise: string[] = []

  if (Math.abs(qFinal - inputs.Q) > 0.4) {
    changes.push({
      label: 'Förderrate Q',
      vorher: `${inputs.Q} l/s`,
      nachher: `${qFinal} l/s`,
      rationale: qFinal > inputs.Q
        ? `Erhöht: hydraulisch zulässig (Q_max = ${qMax.toFixed(1)} l/s nach Thiem 1906 / DVGW W 115). Mehr Q → höhere Leistung je Dublette → weniger Doubletten.`
        : `Reduziert: minimales Q für ${nOpt} Doublette${nOpt > 1 ? 'n' : ''} (kein Reserve-Overhead).`,
    })
  }

  if (Math.abs(tRMin - inputs.tR) > 0.2) {
    changes.push({
      label: 'Reinjektionstemperatur T_R',
      vorher: `${inputs.tR} °C`,
      nachher: `${tRMin} °C`,
      rationale: `T_R = ${tRMin} °C — Mindesttemperatur (Frostschutz + Ökologie, VDI 4640 Bl. 2 Abschn. 5.4). Im WP-Betrieb ist T_R unabhängig von T_RL — die WP überbrückt den Temperaturhub. Niedrigeres T_R → größeres ΔT → mehr Wärmeleistung je m³.`,
    })
  }

  if (Math.abs(abstandFinal - inputs.abstand) > 24) {
    changes.push({
      label: 'Bohrlochabstand',
      vorher: `${inputs.abstand} m`,
      nachher: `${abstandFinal} m`,
      rationale: `Abstand_opt(Q=${qFinal} l/s, t=25 a) = ${Math.round(abstandRaw)} m → gerundet auf ${abstandFinal} m. Gewährleistet thermische Durchbruchszeit ≥ 25 Jahre (Gringarten & Sauty 1975).`,
    })
  }

  if (changes.length === 0) {
    return { ok: false, error: 'Parameter sind bereits optimal — keine Verbesserung möglich.' }
  }

  if (qMax < inputs.Q) {
    hinweise.push(`Hydraulischer Grenzwert Q_max = ${qMax.toFixed(1)} l/s nach Thiem (1906) liegt unter dem bisherigen Q. Aquifer-Transmissivität (T = ${(kf * maechtig).toExponential(1)} m²/s) begrenzt den Volumenstrom.`)
  }
  if (abstandFinal > 1000) {
    hinweise.push(`Abstand ${abstandFinal} m erfordert separate Bohrplätze und Leitungsinfrastruktur — Wirtschaftlichkeit prüfen.`)
  }

  return {
    ok: true,
    mode: 'MIN_DOUBLETTEN',
    newInputs: { Q: qFinal, tR: tRMin, abstand: abstandFinal },
    changes,
    hinweise,
  }
}

/**
 * Modus 2: Maximale Effizienz (SPF — Seasonal Performance Factor)
 *
 * Algorithmus (Grid-Scan, O(n×m)):
 *   - Q: 50 Schritte von 1 l/s bis Q_max
 *   - tR: 20 Schritte von 2 °C bis tGW − 1 K
 *   - Zielgröße: SPF = qDelivered / (n × P_pump + P_WP_el)
 *   - Constraint: tBreak ≥ 25 a (Abstand wird dynamisch gesetzt)
 *   - Constraint: n_Doubletten ≤ 2 × n_min (CAPEX-Limit)
 */
export function optimizeMaxSPF(inputs: DeltaTInputs): OptimizeResult {
  const { kf, maechtig, tGW, porositaet } = inputs

  const qMax = Math.min(100, calcQMaxHydraulisch(kf, maechtig))
  const tRMin = TR_MIN  // 2 °C — Frostschutz/Ökologie (VDI 4640 Bl. 2 Abschn. 5.4)

  if (tGW - tRMin <= 0) {
    return {
      ok: false,
      error: `T_GW (${tGW} °C) zu niedrig für effiziente WP-Nutzung. Tiefere Bohrung erforderlich.`,
    }
  }

  // Referenz: minimale Doublettenzahl bei Q_max, tR_min
  const refOut = calculateSystem({ ...inputs, Q: qMax, tR: tRMin })
  const nMin = refOut.anzahlDubletten ?? 1

  const Q_STEPS  = 50
  const TR_STEPS = 20

  let bestSPF = -Infinity
  let bestQ   = inputs.Q
  let bestTR  = inputs.tR
  let bestAbstand = inputs.abstand

  for (let qi = 0; qi < Q_STEPS; qi++) {
    const Q = 1 + (qi / (Q_STEPS - 1)) * (qMax - 1)

    for (let ti = 0; ti < TR_STEPS; ti++) {
      const tR = tRMin + (ti / (TR_STEPS - 1)) * (tGW - 1 - tRMin)

      // Abstand für t_Break = 25 a bei diesem Q
      const abstand = Math.max(ABSTAND_MIN, Math.ceil(calcAbstandOpt(Q, porositaet, maechtig, T_BREAK_ZIEL) / 50) * 50)

      const out = calculateSystem({ ...inputs, Q, tR, abstand })

      // Constraint: Doubletten ≤ 2 × n_min (CAPEX-Limit)
      if (out.anzahlDubletten == null) continue
      if (out.anzahlDubletten > 2 * Math.max(1, nMin)) continue

      // SPF = gelieferte Wärme / (Pumpen-Eigenverbrauch aller Bohrungen + WP-Strom)
      // P_pump_ges = n_Dobl × 2 Bohrungen × P_pump_je_Bohrg.  (Förder + Reinjekt.)
      const pPumpGes = out.anzahlDubletten * 2 * out.tauchpumpenLeistung
      const pGes = pPumpGes + out.elLeistungWP
      if (pGes <= 0) continue

      const spf = out.qDelivered / pGes
      if (spf > bestSPF) {
        bestSPF = spf
        bestQ   = Q
        bestTR  = tR
        bestAbstand = abstand
      }
    }
  }

  if (bestSPF === -Infinity) {
    return { ok: false, error: 'Keine gültige Parameterkombination gefunden — Aquifer-Parameter prüfen.' }
  }

  // Runden: Q auf 0,5 l/s, tR auf 0,5 K, abstand auf 50 m
  const qFinal      = Math.round(bestQ * 2) / 2
  const tRFinal     = Math.round(bestTR * 2) / 2
  const abstandFinal = bestAbstand

  const changes: OptimizeChange[] = []
  const hinweise: string[] = []

  if (Math.abs(qFinal - inputs.Q) > 0.4) {
    changes.push({
      label: 'Förderrate Q',
      vorher: `${inputs.Q} l/s`,
      nachher: `${qFinal} l/s`,
      rationale: `SPF-Optimum (Grid-Scan 50×20): Q = ${qFinal} l/s maximiert gelieferte Wärme / Stromaufnahme (SPF = ${bestSPF.toFixed(2)}).`,
    })
  }
  if (Math.abs(tRFinal - inputs.tR) > 0.2) {
    changes.push({
      label: 'Reinjektionstemperatur T_R',
      vorher: `${inputs.tR} °C`,
      nachher: `${tRFinal} °C`,
      rationale: `Niedrigeres T_R → größeres ΔT → mehr Q_geo je Dublette. T_R = ${tRMin} °C — Mindesttemperatur (Frostschutz/Ökologie, VDI 4640 Bl. 2). Im WP-Betrieb überbrückt die WP den Temperaturhub.`,
    })
  }
  if (Math.abs(abstandFinal - inputs.abstand) > 24) {
    changes.push({
      label: 'Bohrlochabstand',
      vorher: `${inputs.abstand} m`,
      nachher: `${abstandFinal} m`,
      rationale: `Abstand_opt für t_Break = 25 Jahre bei Q = ${qFinal} l/s (Gringarten & Sauty 1975). Thermischer Kurzschluss verhindert.`,
    })
  }

  if (changes.length === 0) {
    return { ok: false, error: 'Parameter sind bereits im SPF-Optimum — keine Verbesserung möglich.' }
  }

  hinweise.push(`SPF-Scan prüfte ${Q_STEPS * TR_STEPS} Kombinationen. Hydraulisches Limit Q_max = ${Math.min(100, calcQMaxHydraulisch(kf, maechtig)).toFixed(1)} l/s nach Thiem (1906) / DVGW W 115.`)
  if (nMin > 5) {
    hinweise.push(`Hohe Dublettenanzahl (Referenz: ${nMin} Stk.) — SPF-Optimierung hat begrenzten Einfluss. CAPEX-Reduktion (Modus "Minimale Doubletten") prüfen.`)
  }

  return {
    ok: true,
    mode: 'MAX_SPF',
    newInputs: { Q: qFinal, tR: tRFinal, abstand: abstandFinal },
    changes,
    hinweise,
  }
}

export function optimize(inputs: DeltaTInputs, mode: OptimizeMode): OptimizeResult {
  if (mode === 'MIN_DOUBLETTEN') return optimizeMinDoubletten(inputs)
  return optimizeMaxSPF(inputs)
}
