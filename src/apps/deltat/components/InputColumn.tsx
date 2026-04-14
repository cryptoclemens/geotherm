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
        <legend className="text-xs font-medium text-primary/80 mb-1">Bohrloch</legend>
        <ParamSlider label="Bohrtiefe" value={inputs.tiefe} min={50} max={3000} step={50} unit="m"
          onChange={v => setInput('tiefe', v)}
          info="Tiefe der Förder- und Injektionsbohrung. Bestimmt maßgeblich die erreichbare Grundwassertemperatur (geothermischer Gradient ≈ 3 °C/100 m)." />
        <ParamSlider label="Förderhöhe Tauchpumpe" value={inputs.foerderhoehe} min={20} max={500} step={5} unit="m"
          onChange={v => setInput('foerderhoehe', v)}
          info="Dynamische Förderhöhe der Tauchpumpe (Absenkung + Rohrreibung + Systemdruck).\nP_Pumpe = ρ·g·H·Q / η [W]\nFaustregel: H ≈ 0,5 × Bohrtiefe + 15 m\n(VDI 4640 Bl. 2; Stober & Bucher 2012 Kap. 7.4)" />
        {inputs.foerderhoehe > inputs.tiefe + 20 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 -mt-1 leading-snug">
            Förderhöhe {inputs.foerderhoehe} m unrealistisch für {inputs.tiefe} m Bohrtiefe — empfohlen: ≤ {inputs.tiefe + 20} m
          </p>
        )}
        <ParamSlider label="Aquifer-Mächtigkeit" value={inputs.maechtig} min={5} max={500} step={5} unit="m"
          onChange={v => setInput('maechtig', v)}
          info="Vertikale Ausdehnung des wasserführenden Horizonts.\nTransmissivität: T = k_f × b [m²/s]\n(Darcy; DVGW W 115)" />
        <ParamSlider label="Bohrlochabstand" value={inputs.abstand} min={50} max={2000} step={50} unit="m"
          onChange={v => setInput('abstand', v)}
          info="Abstand Förder- zu Injektionsbohrung. Zu gering → thermischer Kurzschluss.\nOptimaler Mindestabstand aus Durchbruchszeit-Kriterium (Gringarten & Sauty 1975)." />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-primary/80 mb-1">Hydrogeologie</legend>
        <ParamSlider label="k_f hydraul. Leitfähigkeit" value={inputs.kf}
          min={1e-7} max={1e-1} step={0} unit="m/s" log
          format={v => v.toExponential(1)}
          onChange={v => setInput('kf', v)}
          info="Hydraulische Leitfähigkeit nach Darcy [m/s].\nTransmissivität: T = k_f × b\nVDI 4640: T > 1×10⁻³ m²/s = gut nutzbar\nT > 1×10⁻² m²/s = sehr gut" />
        <ParamSlider label="Förderrate Q" value={inputs.Q} min={1} max={100} step={1} unit="l/s"
          onChange={v => setInput('Q', v)}
          info="Volumenstrom der Förderbohrung [l/s].\nBegrenzt durch Transmissivität und Absenkung.\nThermische Leistung: P = ρ·c_p·Q·ΔT\n(DVGW W 115)" />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-primary/80 mb-1">Thermik</legend>
        <ParamSlider label="Grundwassertemperatur" value={inputs.tGW} min={5} max={60} step={0.5} unit="°C"
          onChange={v => setInput('tGW', v)}
          info="Temperatur des geförderten Grundwassers [°C].\nFaustformel: T_GW ≈ 10 °C + Tiefe × 0,03 °C/m\n(geothermischer Gradient, mittlere Deutschland-Werte nach VDI 4640)" />
        <ParamSlider label="Reinjektionstemperatur" value={inputs.tR} min={2} max={40} step={0.5} unit="°C"
          onChange={v => setInput('tR', v)}
          info="Temperatur des rückgeführten Wassers nach Wärmeentzug.\nΔT = T_GW − T_R → thermische Leistung.\nMuss > 2 °C bleiben (Frostschutz, Ökologie)." />
        {inputs.tR >= inputs.tGW && (
          <p className="text-xs text-red-600 dark:text-red-400 -mt-1 leading-snug">
            Reinjektion ({inputs.tR} °C) ≥ Grundwasser ({inputs.tGW} °C) — kein Wärmeentzug möglich (VDI 4640 Bl. 2)
          </p>
        )}
        <ParamSlider label="Mineralisation TDS" value={inputs.tds} min={50} max={50000} step={50} unit="mg/l"
          onChange={v => setInput('tds', v)}
          info="Gesamtmineralisation des Thermalwassers [mg/l].\nBestimmt Materialklasse nach DVGW W 115:\n< 1.000 mg/l → Stahl möglich\n1.000–10.000 mg/l → hochwertiger Stahl\n> 10.000 mg/l → Duplex / Titan erforderlich" />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-primary/80 mb-1">Wärmenetz</legend>
        <ParamSlider label="Ziel-Wärmeleistung" value={inputs.zielLeistung} min={100} max={50000} step={100} unit="kW"
          onChange={v => setInput('zielLeistung', v)}
          info="Benötigte Wärmeleistung des Netzes [kW].\nBestimmt die Anzahl der Doubletten:\nn = ⌈P_Ziel / P_Doublette⌉" />
        <ParamSlider label="Vorlauftemperatur" value={inputs.tVL} min={30} max={140} step={1} unit="°C"
          onChange={v => setInput('tVL', v)}
          info="Vorlauftemperatur des Wärmenetzes [°C].\nBestimmt den Temperaturhub der Wärmepumpe:\nΔT_Hub = T_VL − T_GW\nGroßer Hub → schlechterer COP (Arpagaus et al. 2018)" />
        <ParamSlider label="Rücklauftemperatur" value={inputs.tRL} min={20} max={90} step={1} unit="°C"
          onChange={v => setInput('tRL', v)}
          info="Rücklauftemperatur aus dem Wärmenetz [°C].\nBeeinflusst LMTD des Wärmetauschers:\nLMTD = (ΔT₁ − ΔT₂) / ln(ΔT₁/ΔT₂)" />
        <ParamSlider label="Laufstunden" value={inputs.laufstunden} min={500} max={8760} step={100} unit="h/a"
          onChange={v => setInput('laufstunden', v)}
          info="Jährliche Volllaststunden des Systems [h/a].\nJahreswärmemenge: E = P_Dobl × h/a\n8.760 h/a = Volllast-Dauerbetrieb\nTypisch Fernwärme: 4.000–6.000 h/a" />
      </fieldset>
    </div>
  )
}
