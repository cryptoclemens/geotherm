import { InfoIcon } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/ui/tooltip'
import type { TrafficLight } from '../calc/system'

interface KpiTileProps {
  label: string
  value: number | string
  unit?: string
  color?: TrafficLight | 'navy'
  sub?: string
  info?: string
}

const colorMap: Record<string, string> = {
  green:  'border-green-500 bg-green-50 dark:bg-green-950/40',
  yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/40',
  red:    'border-red-500 bg-red-50 dark:bg-red-950/40',
  navy:   'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
}

const textMap: Record<string, string> = {
  green:  'text-green-700 dark:text-green-300',
  yellow: 'text-yellow-700 dark:text-yellow-200',
  red:    'text-red-700 dark:text-red-300',
  navy:   'text-blue-700 dark:text-blue-200',
}

export function KpiTile({ label, value, unit, color = 'navy', sub, info }: KpiTileProps) {
  return (
    <div className={`rounded-lg border-l-4 px-3 py-2.5 ${colorMap[color]}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
        {info && (
          <Tooltip>
            <TooltipTrigger
              className="inline-flex items-center text-muted-foreground/40 hover:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
              aria-label={`Info zu ${label}`}
            >
              <InfoIcon className="w-2.5 h-2.5" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-72 text-left whitespace-pre-line">
              {info}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className={`text-2xl font-bold font-mono tabular-nums leading-tight ${textMap[color]}`}>
        {typeof value === 'number' ? value.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : value}
        {unit && <span className="text-sm font-normal ml-1 opacity-70">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}
