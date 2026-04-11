import type { TrafficLight } from '../calc/system'

interface KpiTileProps {
  label: string
  value: number | string
  unit?: string
  color?: TrafficLight | 'navy'
  sub?: string
}

const colorMap: Record<string, string> = {
  green:  'border-green-400  bg-green-50',
  yellow: 'border-yellow-400 bg-yellow-50',
  red:    'border-red-400    bg-red-50',
  navy:   'border-blue-900   bg-blue-50',
}

const textMap: Record<string, string> = {
  green:  'text-green-800',
  yellow: 'text-yellow-800',
  red:    'text-red-800',
  navy:   'text-blue-900',
}

export function KpiTile({ label, value, unit, color = 'navy', sub }: KpiTileProps) {
  return (
    <div className={`rounded-lg border-l-4 px-3 py-2 ${colorMap[color]}`}>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className={`text-xl font-bold font-mono tabular-nums leading-tight ${textMap[color]}`}>
        {typeof value === 'number' ? value.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}
