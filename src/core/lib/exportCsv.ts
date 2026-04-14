/**
 * CSV-Export-Utility für Geotherm-Projekte
 */

import type { Project } from '@/core/api/projects'

const INPUT_LABELS: Record<string, string> = {
  tiefe: 'Bohrtiefe [m]',
  maechtig: 'Aquifer-Mächtigkeit [m]',
  kf: 'kf [m/s]',
  tGW: 'GW-Temperatur [°C]',
  tds: 'TDS [mg/l]',
  Q: 'Förderrate [l/s]',
  tR: 'Reinjektionstemperatur [°C]',
  abstand: 'Bohrlochabstand [m]',
  zielLeistung: 'Ziel-Wärmeleistung [kW]',
  tVL: 'Vorlauftemperatur [°C]',
  tRL: 'Rücklauftemperatur [°C]',
  laufstunden: 'Laufstunden [h/a]',
  foerderhoehe: 'Förderhöhe Tauchpumpe [m]',
}

const RESULT_LABELS: Record<string, string> = {
  anzahlDubletten: 'Anzahl Dubletten',
  qDelivered: 'Gelieferte Wärmeleistung [kW]',
  qThGesamt: 'Geothermische Leistung [kW]',
  cop: 'COP',
  elLeistungWP: 'WP-Elektrikleistung [kW]',
  jahreswaerme: 'Jahreswärmemenge [MWh/a]',
  transmissiv: 'Transmissivität [m²/s]',
  tBreak: 'Thermische Durchbruchszeit [Jahre]',
  tauchpumpenLeistung: 'Tauchpumpenleistung [kW]',
  spezLeistung: 'Spezifische Leistung [W/m]',
  abstandOpt: 'Optimaler Abstand [m]',
  deltaT: 'ΔT GW–Reinjektion [K]',
  tHub: 'Temperaturhub WP [K]',
  lmtd: 'LMTD [K]',
  wtFlaeche: 'Wärmetauscherfläche [m²]',
  wpType: 'WP-Typ',
  wpModel: 'WP-Modell',
  material: 'Material-Empfehlung',
  scaling: 'Scaling-Risiko',
  sHydraulik: 'Ampel Hydraulik',
  sThermik: 'Ampel Thermik',
  sDurchbruch: 'Ampel Durchbruch',
  sCOP: 'Ampel COP',
  sMaterial: 'Ampel Material',
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    return isFinite(value) ? String(value) : ''
  }
  return String(value)
}

export function exportProjectsToCsv(projects: Project[]): void {
  if (projects.length === 0) return

  const rows: string[][] = []

  // Header-Zeile
  const headers = [
    'Projektname',
    'Beschreibung',
    'Gespeichert am',
    ...Object.values(INPUT_LABELS),
    ...Object.values(RESULT_LABELS),
  ]
  rows.push(headers)

  // Datenzeilen
  for (const project of projects) {
    const inputs = project.deltat_input
    const results = project.deltat_result

    const row = [
      project.name,
      project.description ?? '',
      project.created_at
        ? new Intl.DateTimeFormat('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(project.created_at))
        : '',
      ...Object.keys(INPUT_LABELS).map((key) =>
        formatValue(inputs ? (inputs as unknown as Record<string, unknown>)[key] : null)
      ),
      ...Object.keys(RESULT_LABELS).map((key) =>
        formatValue(results ? (results as unknown as Record<string, unknown>)[key] : null)
      ),
    ]
    rows.push(row)
  }

  const csvContent = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')

  // BOM für korrekte Umlaute in Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `geotherm-projekte-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
