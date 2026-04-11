'use client'

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
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground tabular-nums">
          {display} <span className="text-muted-foreground font-normal">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={log ? 0 : min}
        max={log ? 100 : max}
        step={log ? 0.5 : step}
        value={sliderVal}
        onChange={handleChange}
        className="w-full h-1.5 accent-blue-600 cursor-pointer"
      />
    </div>
  )
}
