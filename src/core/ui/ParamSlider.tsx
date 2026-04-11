'use client'

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
}

export function ParamSlider({
  label, value, min, max, step, unit, onChange, format, log = false,
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
        {/* form-labels: <label for="…"> verknüpft visuelles Label mit Input */}
        <label htmlFor={id} className="text-muted-foreground cursor-pointer select-none">
          {label}
        </label>
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
        className="w-full h-1.5 py-2 accent-blue-600 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 rounded"
      />
    </div>
  )
}
