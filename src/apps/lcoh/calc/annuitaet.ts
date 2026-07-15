/**
 * Annuitätenmethode — Kapitalwiedergewinnungsfaktor (CRF) für das LCOH-Modul
 *
 * Quelle: VDI 2067 Blatt 1 — Wirtschaftlichkeit gebäudetechnischer Anlagen,
 *         Grundlagen und Kostenberechnung (Annuitätenmethode)
 *
 * Warum das ein eigenes Modul ist (Tasks.md M8.1c):
 * Die beiden Fachmodelle im Projekt annualisieren unterschiedlich — 6 % WACC über 30 a
 * gegen 10 % Hurdle Rate über 20 a. Das sind Faktor 1,617 auf jeden kapitalgetriebenen
 * LCOH, ohne dass sich am Projekt selbst irgendetwas ändert. Solange die Konvention nicht
 * vereinbart und sichtbar ist, sind zwei Modelle nie vergleichbar.
 *
 * Vom Faktor 1,617 kommen rund 1,46 vom Zinssatz und nur 1,20 von der Laufzeit — der Zins
 * ist der dominante Hebel, nicht die Nutzungsdauer.
 *
 * Wichtig für den Technologievergleich: Innerhalb eines Vergleichs MUSS die Methodik über
 * alle Technologien identisch sein. Der CRF verschiebt nicht nur das Niveau, sondern die
 * Rangfolge — Geothermie ist kapitalintensiv, ein Gaskessel opex-lastig. Eine gemischte
 * Methodik erzeugt eine Reihenfolge, die es in keiner Welt gibt.
 */

/**
 * Eine Annualisierungs-Prämisse. Label und Quelle sind Teil des Typs, nicht Beiwerk:
 * Eine LCOH-Zahl ohne ihre Prämisse ist nicht interpretierbar, weil die Konvention allein
 * schon Faktor 1,6 ausmacht. Dieselbe Logik wie `wert + quelle + güte` in Tasks.md M8.2b.
 */
export interface Methodik {
  /** Kalkulationszinssatz p. a. als Dezimalbruch (0.06 = 6 %) */
  zins: number
  /** Betrachtungs-/Nutzungsdauer [a] */
  jahre: number
  /** Kurzform für die Anzeige an der Zahl — nennt Zins und Laufzeit */
  label: string
  /** Woher die Prämisse stammt */
  quelle: string
}

/**
 * Versorger-/Infrastruktur-Sicht — DEFAULT.
 * 30 a bilden die Lebensdauer eines Brunnens realistischer ab als 20 a.
 *
 * Bewusst dokumentiert: Dieser Default begünstigt die Geothermie, weil sie kapitalintensiv
 * ist und ein niedriger CRF Kapitalkosten kleiner rechnet. Deshalb ist die Prämisse an der
 * Zahl sichtbar zu halten und umschaltbar — nicht, weil sie falsch wäre, sondern damit der
 * Vorteil nachprüfbar bleibt statt in einer Voreinstellung zu verschwinden.
 */
export const METHODIK_VERSORGER: Methodik = {
  zins:   0.06,
  jahre:  30,
  label:  'Versorger — 6 % WACC / 30 a',
  quelle: 'Fachmodell Versorger-Perspektive; Annuität nach VDI 2067 Bl. 1',
}

/**
 * Investoren-/Bank-Sicht: risikoadjustierte Hurdle Rate über einen kürzeren Horizont.
 * Relevant für die Risikokalkulation einer Bank und für interne Gate-Prozesse (M8.0b).
 */
export const METHODIK_INVESTOR: Methodik = {
  zins:   0.10,
  jahre:  20,
  label:  'Investor — 10 % Hurdle Rate / 20 a',
  quelle: 'Fachmodell Investoren-Perspektive; Annuität nach VDI 2067 Bl. 1',
}

/** Voreinstellung der Suite — siehe Tasks.md M8.1c. */
export const METHODIK_DEFAULT: Methodik = METHODIK_VERSORGER

/**
 * Kapitalwiedergewinnungsfaktor (Capital Recovery Factor).
 *
 *   CRF = i · (1 + i)^n / ((1 + i)^n − 1)
 *
 * Annuität = CAPEX × CRF. Quelle: VDI 2067 Bl. 1.
 *
 * Grenzfall zins = 0: Die Formel ist dort 0/0 und liefert still NaN. Der Grenzwert für
 * i → 0 ist 1/n — ohne Zins wird das Kapital linear über die Jahre verteilt. Ohne diesen
 * Sonderfall zeigt eine 0-%-Annahme im UI „NaN €/MWh" statt einer Zahl.
 */
export function crf(m: Methodik): number {
  if (m.jahre <= 0) return NaN
  if (m.zins === 0) return 1 / m.jahre
  const q = Math.pow(1 + m.zins, m.jahre)
  return (m.zins * q) / (q - 1)
}
