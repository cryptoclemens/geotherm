'use client'

import { InfoIcon } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip'

// UI/UX Pro Max: form-labels (label+for), touch-target-size (≥44px via py-2), focus-states

interface ParamSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (val: number) => void
  /** Optionale Formatierungsfunktion für den angezeigten Wert */
  format?: (val: number) => string
  /** Logarithmische Skala */
  log?: boolean
  /** Formel / Erläuterung als Tooltip */
  info?: string
}

export function ParamSlider({
  label, value, min, max, step, unit, onChange, format, log = false, info,
}: ParamSliderProps) {
  const display = format ? format(value) : value.toLocaleString('de-DE')
  // Stable ID from label — letters + numbers only
  const id = `slider-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseFloat(e.target.value)
    if (log) {
      // slider position 0–100 maps to [min, max] on log scale
      const logMin = Math.log10(min)
      const logMax = Math.log10(max)
      onChange(Math.pow(10, logMin + (raw / 100) * (logMax - logMin)))
    } else {
      onChange(raw)
    }
  }

  const sliderVal = log
    ? ((Math.log10(value) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))) * 100
    : value

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between items-baseline text-xs">
        <div className="flex items-center gap-1">
          {/* form-labels: <label for="…"> verknüpft visuelles Label mit Input */}
          <label htmlFor={id} className="text-muted-foreground cursor-pointer select-none">
            {label}
          </label>
          {info && (
            <Tooltip>
              <TooltipTrigger
                className="inline-flex items-center text-muted-foreground/50 hover:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
                aria-label={`Info zu ${label}`}
              >
                <InfoIcon className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-64 text-left whitespace-pre-line">
                {info}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <span
          className="font-mono font-semibold text-foreground tabular-nums"
          aria-live="polite"
          aria-label={`${label}: ${display} ${unit}`}
        >
          {display} <span className="text-muted-foreground font-normal">{unit}</span>
        </span>
      </div>
      {/* touch-target-size: py-2 erhöht den klickbaren Bereich auf ≥ 44px */}
      <input
        id={id}
        type="range"
        min={log ? 0 : min}
        max={log ? 100 : max}
        step={log ? 0.5 : step}
        value={sliderVal}
        onChange={handleChange}
        aria-label={label}
        aria-valuetext={`${display} ${unit}`}
        className="w-full h-1.5 py-2 accent-primary cursor-pointer focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded"
      />
    </div>
  )
}
