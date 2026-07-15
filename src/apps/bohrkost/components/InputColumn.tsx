'use client'

import { ParamSlider } from '@/core/ui/ParamSlider'
import type { BohrkostInputs, BohrkostOutputs, Gesteinstyp, Bohrungszweck, Produktionsdurchmesser, Region, OverheadInputs } from '../calc/kosten'

interface InputColumnProps {
  inputs: BohrkostInputs
  outputs: BohrkostOutputs
  onChange: <K extends keyof BohrkostInputs>(key: K, value: BohrkostInputs[K]) => void
  onReset: () => void
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const id = `select-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="text-xs bg-background border border-input rounded-md px-2 py-1.5 text-foreground outline-none focus:border-primary/50 cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function InputColumn({ inputs, outputs, onChange, onReset }: InputColumnProps) {
  const isDublette = inputs.zweck !== 'Explorationsbohrung'

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Parameter</h2>
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Zurücksetzen
        </button>
      </div>

      {/* ── Sektion: Bohrung ─────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-primary/80 mb-1">Bohrung</legend>
        <ParamSlider
          label="Bohrtiefe"
          value={inputs.tiefe}
          min={100}
          max={3000}
          step={50}
          unit="m"
          onChange={v => onChange('tiefe', v)}
          info={'Tiefe der Bohrung [m].\nBestimmt maßgeblich die Bohrkosten (Lukawski-Kurve).\nFaustformel: T_GW ≈ 10 °C + tiefe × 0,03 °C/m\n(Lukawski et al. 2014, J. Pet. Sci. Eng. 118)'}
        />
        {/* Gültigkeitshinweis, keine Fehlermeldung: Der Rechner rechnet über die volle Spanne
            100–3000 m. Unterhalb 400 m stammt der Preis aus GtV/DVGW und ist dort für
            klein-kalibrige Brunnen kalibriert. Bewusst das blaue Hinweis-Muster (wie der
            Optimierungshinweis in DeltaT), nicht das amber-Muster für „Formel nicht anwendbar"
            (kluftaquiferWarnung) — siehe PLAUSI_CHECK.md, Befund A. */}
        {outputs.kleinkaliberHinweis && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs -mt-1 leading-snug">
            <span className="text-blue-700 dark:text-blue-300 font-medium">Kalibrierung:</span>
            <span className="text-blue-600 dark:text-blue-400">
              {' '}Bis 400 m rechnet der Rechner mit GtV-/DVGW-Preisen. Die sind für klein-kalibrige
              Brunnen bis 13 3/8&quot; Ausbau kalibriert — dafür ist das Ergebnis belastbar. Bei
              größerem Ausbau liegt es zu niedrig; dort ist ein Bohrangebot die bessere Quelle.
              Details im Formelwerk.
            </span>
          </div>
        )}
        <SelectField<Gesteinstyp>
          label="Gesteinstyp"
          value={inputs.gesteinstyp}
          options={[
            { value: 'Lockergestein',           label: 'Lockergestein' },
            { value: 'Festgestein_sed',          label: 'Festgestein (sedimentär)' },
            { value: 'Festgestein_kristallin',   label: 'Festgestein (kristallin)' },
          ]}
          onChange={v => onChange('gesteinstyp', v)}
        />
        <SelectField<Bohrungszweck>
          label="Bohrungszweck"
          value={inputs.zweck}
          options={[
            { value: 'Dublette',            label: 'Dublette (Förder + Injektion)' },
            { value: 'Einzelbohrung',       label: 'Einzelbohrung' },
            { value: 'Explorationsbohrung', label: 'Explorationsbohrung (+15 %)' },
          ]}
          onChange={v => onChange('zweck', v)}
        />
        {inputs.zweck === 'Dublette' && (
          <div className="flex flex-col gap-1">
            <ParamSlider
              label="Anzahl Dubletten"
              value={inputs.anzahlDubletten}
              min={1}
              max={8}
              step={1}
              unit=""
              onChange={v => onChange('anzahlDubletten', v)}
              info={'Anzahl Förder-/Injektionsbohrpaare.\nAus DeltaT-Auslegung vorbelegt — kann manuell überschrieben werden.\n1 Dublette = 2 Bohrungen (Förder + Injektion)\nRealistisch für Fernwärme: 1–4 Dubletten (GtV 2024)\nÜber 4: Mengenrabatt 5–15 % nicht berücksichtigt (konservativ)\nLimit 8 Dubletten: Lukawski-Formel und Overhead-Koeffizienten\nnur für diesen Bereich kalibriert; größere Vorhaben\nerfordern individuelle Projektplanung.\n(Stober & Bucher 2012, Kap. 7; GtV Bohrpreise 2024;\nLukawski et al. 2014, J. Pet. Sci. Eng. 118)'}
            />
            {inputs.anzahlDubletten > 4 && inputs.anzahlDubletten <= 8 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 -mt-1 leading-snug">
                {inputs.anzahlDubletten} Dubletten — ungewöhnlich für Einzelstandort. Skalenrabatt (5–15 %) nicht berücksichtigt (konservativ).
              </p>
            )}
            {inputs.anzahlDubletten > 8 && (
              <p className="text-xs text-red-600 dark:text-red-400 -mt-1 leading-snug">
                &gt; 8 Dubletten — separate Projektplanung empfohlen (GtV 2024).
              </p>
            )}
          </div>
        )}
        <SelectField<Produktionsdurchmesser>
          label="Produktionsdurchmesser"
          value={inputs.durchmesser}
          options={[
            { value: '7"',      label: '7" (klein)' },
            { value: '9 5/8"',  label: '9 5/8" (Standard)' },
            { value: '13 3/8"', label: '13 3/8" (groß)' },
          ]}
          onChange={v => onChange('durchmesser', v)}
        />
      </fieldset>

      {/* ── Sektion: Standort ────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-primary/80 mb-1">Standort</legend>
        <SelectField<Region>
          label="Region"
          value={inputs.region}
          options={[
            { value: 'NDB',             label: 'Norddeutsches Becken (NDB)' },
            { value: 'Molasse',         label: 'Molasse (Bayern)' },
            { value: 'Oberrheingraben', label: 'Oberrheingraben' },
            { value: 'Sonstiges',       label: 'Sonstiges / unbekannt' },
          ]}
          onChange={v => onChange('region', v)}
        />
        {isDublette && (
          <ParamSlider
            label="Förderrate"
            value={inputs.foerderrate}
            min={5}
            max={100}
            step={1}
            unit="l/s"
            onChange={v => onChange('foerderrate', v)}
            info={'Volumenstrom der Förderbohrung [l/s].\nBestimmt die thermische Leistung:\nQ_th = Q × ΔT × c_p [kW]\n(Drost 1978; VDI 4640 Bl. 2)'}
          />
        )}
        <ParamSlider
          label="Grundwassertemperatur"
          value={inputs.tGW}
          min={10}
          max={120}
          step={1}
          unit="°C"
          onChange={v => onChange('tGW', v)}
          info={'Temperatur des geförderten Grundwassers [°C].\nFaustformel: T_GW ≈ 10 °C + tiefe × 0,03 °C/m\n(geothermischer Gradient; VDI 4640 Bl. 1)'}
        />
        {isDublette && (
          <ParamSlider
            label="Reinjektionstemperatur"
            value={inputs.tReinjektion}
            min={5}
            max={60}
            step={1}
            unit="°C"
            onChange={v => onChange('tReinjektion', v)}
            info={'Temperatur des rückgeführten Wassers [°C].\nΔT = T_GW − T_R → thermische Leistung.\n(VDI 4640 Bl. 2)'}
          />
        )}
      </fieldset>

      {/* ── Sektion: Kalkulation ─────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium text-primary/80 mb-1">Kalkulation</legend>

        {/* Förderung Toggle */}
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="toggle-foerderung"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            MAP/KfW-Förderung einbeziehen
          </label>
          <button
            id="toggle-foerderung"
            role="switch"
            aria-checked={inputs.foerderungAktiv}
            onClick={() => onChange('foerderungAktiv', !inputs.foerderungAktiv)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              inputs.foerderungAktiv ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                inputs.foerderungAktiv ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <ParamSlider
          label="Fündigkeitsrisiko"
          value={inputs.fuendigkeitsRisiko}
          min={0}
          max={30}
          step={1}
          unit="%"
          onChange={v => onChange('fuendigkeitsRisiko', v)}
          info={'Zuschlag für Fündigkeitsrisiko-Versicherung [%].\nVersicherungskosten = Bohrkosten_mid × (Risiko/100).\n(Branchenschätzung; GtV)'}
        />
      </fieldset>

      {/* ── Sektion: Overhead ────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <legend className="text-xs font-medium text-primary/80">Projektkosten (Overhead)</legend>
          <button
            type="button"
            role="switch"
            aria-checked={inputs.overheadAktiv}
            onClick={() => onChange('overheadAktiv', !inputs.overheadAktiv)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              inputs.overheadAktiv ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${inputs.overheadAktiv ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {inputs.overheadAktiv && <OverheadEditor overhead={inputs.overhead} onChange={oh => onChange('overhead', oh)} />}
      </fieldset>
    </div>
  )
}

const OVERHEAD_FIELDS: Array<{
  key: keyof OverheadInputs
  label: string
  quelle: string
}> = [
  { key: 'projektmanagement',      label: 'Projektmanagement',           quelle: 'HOAI §§ 53–56; ca. 8 % der Investitionskosten (VDI 4640 Bl. 1)' },
  { key: 'hydrogeologie',          label: 'Hydrogeolog. Begleitung',      quelle: 'DVGW W 115; Stober & Bucher (2012)' },
  { key: 'bauueberwachung',        label: 'Bauüberwachung',               quelle: 'HOAI Leistungsphase 8' },
  { key: 'rechtsberatung',         label: 'Rechtsberatung / Genehmigung', quelle: 'Branchenschätzung; GtV Tiefe Geothermie' },
  { key: 'oeffentlichkeitsarbeit', label: 'Öffentlichkeitsarbeit',        quelle: 'Projektabhängig (0–50.000 EUR)' },
]

function OverheadEditor({
  overhead,
  onChange,
}: {
  overhead: OverheadInputs
  onChange: (oh: OverheadInputs) => void
}) {
  function set(key: keyof OverheadInputs, raw: string) {
    const v = parseInt(raw.replace(/\D/g, ''), 10)
    onChange({ ...overhead, [key]: isNaN(v) ? 0 : v })
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
      {OVERHEAD_FIELDS.map(({ key, label, quelle }) => (
        <div key={key} className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs text-foreground/80 min-w-0">{label}</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                value={overhead[key].toLocaleString('de-DE')}
                onChange={e => set(key, e.target.value)}
                className="w-28 text-right text-xs bg-background border border-input rounded px-2 py-1 text-foreground outline-none focus:border-primary/50 font-mono"
              />
              <span className="text-[10px] text-muted-foreground shrink-0">EUR</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60 leading-snug">{quelle}</p>
        </div>
      ))}
    </div>
  )
}
