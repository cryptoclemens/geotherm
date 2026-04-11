import type { TrafficLight } from '../calc/system'

interface AmpelBadgeProps {
  color: TrafficLight
  label: string
}

const colorMap: Record<TrafficLight, string> = {
  green:  'bg-green-100 text-green-800 border-green-300',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  red:    'bg-red-100 text-red-800 border-red-300',
}

const dotMap: Record<TrafficLight, string> = {
  green:  'bg-green-500',
  yellow: 'bg-yellow-500',
  red:    'bg-red-500',
}

export function AmpelBadge({ color, label }: AmpelBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium ${colorMap[color]}`}>
      <span className={`w-2 h-2 rounded-full ${dotMap[color]}`} />
      {label}
    </span>
  )
}
