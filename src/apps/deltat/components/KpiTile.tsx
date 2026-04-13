import type { TrafficLight } from '../calc/system'

interface KpiTileProps {
  label: string
  value: number | string
  unit?: string
  color?: TrafficLight | 'navy'
  sub?: string
}

const colorMap: Record<string, string> = {
  green:  'border-green-500  bg-green-950/40',
  yellow: 'border-yellow-500 bg-yellow-950/40',
  red:    'border-red-500    bg-red-950/40',
  navy:   'border-blue-600   bg-blue-950/30',
}

const textMap: Record<string, string> = {
  green:  'text-green-300',
  yellow: 'text-yellow-200',
  red:    'text-red-300',
  navy:   'text-blue-200',
}

export function KpiTile({ label, value, unit, color = 'navy', sub }: KpiTileProps) {
  return (
    <div className={`rounded-lg border-l-4 px-3 py-2.5 ${colorMap[color]}`}>
      <div className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold font-mono tabular-nums leading-tight ${textMap[color]}`}>
        {typeof value === 'number' ? value.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : value}
        {unit && <span className="text-sm font-normal ml-1 opacity-70">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}
