'use client'

import { ParamSlider } from '@/core/ui/ParamSlider'
import { useDeltaTStore } from '../store/useDeltaTStore'

export function InputColumn() {
  const inputs  = useDeltaTStore(s => s.inputs)
  const setInput = useDeltaTStore(s => s.setInput)
  const reset   = useDeltaTStore(s => s.resetInputs)

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Parameter</h2>
        <button
          onClick={reset}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Zurücksetzen
        </button>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-blue-700 mb-1">Bohrloch</legend>
        <ParamSlider label="Bohrtiefe" value={inputs.tiefe} min={50} max={3000} step={50} unit="m"
          onChange={v => setInput('tiefe', v)} />
        <ParamSlider label="Aquifer-Mächtigkeit" value={inputs.maechtig} min={5} max={500} step={5} unit="m"
          onChange={v => setInput('maechtig', v)} />
        <ParamSlider label="Bohrlochabstand" value={inputs.abstand} min={50} max={2000} step={50} unit="m"
          onChange={v => setInput('abstand', v)} />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-blue-700 mb-1">Hydrogeologie</legend>
        <ParamSlider label="k_f hydraul. Leitfähigkeit" value={inputs.kf}
          min={1e-7} max={1e-1} step={0} unit="m/s" log
          format={v => v.toExponential(1)}
          onChange={v => setInput('kf', v)} />
        <ParamSlider label="Förderrate Q" value={inputs.Q} min={1} max={100} step={1} unit="l/s"
          onChange={v => setInput('Q', v)} />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-blue-700 mb-1">Thermik</legend>
        <ParamSlider label="Grundwassertemperatur" value={inputs.tGW} min={5} max={60} step={0.5} unit="°C"
          onChange={v => setInput('tGW', v)} />
        <ParamSlider label="Reinjektionstemperatur" value={inputs.tR} min={2} max={40} step={0.5} unit="°C"
          onChange={v => setInput('tR', v)} />
        <ParamSlider label="Mineralisation TDS" value={inputs.tds} min={50} max={50000} step={50} unit="mg/l"
          onChange={v => setInput('tds', v)} />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-blue-700 mb-1">Wärmenetz</legend>
        <ParamSlider label="Ziel-Wärmeleistung" value={inputs.zielLeistung} min={100} max={50000} step={100} unit="kW"
          onChange={v => setInput('zielLeistung', v)} />
        <ParamSlider label="Vorlauftemperatur" value={inputs.tVL} min={30} max={140} step={1} unit="°C"
          onChange={v => setInput('tVL', v)} />
        <ParamSlider label="Rücklauftemperatur" value={inputs.tRL} min={20} max={90} step={1} unit="°C"
          onChange={v => setInput('tRL', v)} />
        <ParamSlider label="Laufstunden" value={inputs.laufstunden} min={500} max={8760} step={100} unit="h/a"
          onChange={v => setInput('laufstunden', v)} />
      </fieldset>
    </div>
  )
}
