'use client'

import { useDeltaTStore } from '../store/useDeltaTStore'
import { KpiTile } from './KpiTile'
import { AmpelBadge } from './AmpelBadge'

export function ResultColumn() {
  const r = useDeltaTStore(s => s.outputs)
  const inputs = useDeltaTStore(s => s.inputs)

  return (
    <div className="flex flex-col gap-5 p-4 bg-card rounded-xl border overflow-y-auto">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ergebnisse</h2>

      {/* Ampeln */}
      <section>
        <h3 className="text-xs font-medium mb-2 text-muted-foreground">Systemampeln</h3>
        <div className="flex flex-wrap gap-2">
          <AmpelBadge color={r.sHydraulik}  label="Hydraulik" />
          <AmpelBadge color={r.sThermik}    label="Thermik" />
          <AmpelBadge color={r.sDurchbruch} label="Durchbruch" />
          <AmpelBadge color={r.sCOP}        label="COP" />
          <AmpelBadge color={r.sMaterial}   label="Material" />
        </div>
      </section>

      {/* Leistung */}
      <section>
        <h3 className="text-xs font-medium mb-2 text-muted-foreground">Leistung</h3>
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Gelieferte Wärme"   value={r.qDelivered}   unit="kW"  color={r.sThermik} />
          <KpiTile label="Geo-Leistung"        value={r.qThGesamt}    unit="kW"  />
          <KpiTile label="Anzahl Dubletten"    value={r.anzahlDoubletten} />
          <KpiTile label="Jahreswärmemenge"    value={r.jahreswaerme} unit="MWh/a" />
        </div>
      </section>

      {/* Hydraulik */}
      <section>
        <h3 className="text-xs font-medium mb-2 text-muted-foreground">Hydraulik</h3>
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Transmissivität"  value={r.transmissiv.toExponential(1)} unit="m²/s" color={r.sHydraulik} />
          <KpiTile label="Gesamtförderrate" value={r.gesamtFoerderrate} unit="l/s" />
          <KpiTile label="Tauchpumpe"       value={r.tauchpumpenLeistung} unit="kW/Bohrg." />
          <KpiTile label="Spez. Leistung"   value={r.spezLeistung} unit="W/m" />
        </div>
      </section>

      {/* Wärmepumpe */}
      <section>
        <h3 className="text-xs font-medium mb-2 text-muted-foreground">Wärmepumpe</h3>
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="COP real"         value={r.cop < 90 ? r.cop : '—'} color={r.sCOP} />
          <KpiTile label="Temperaturhub"    value={r.tHub} unit="K" />
          <KpiTile label="WP-Elektroleistung" value={r.elLeistungWP} unit="kW" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{r.wpType}</p>
        <p className="text-xs text-muted-foreground">{r.wpModel}</p>
      </section>

      {/* Thermischer Durchbruch */}
      <section>
        <h3 className="text-xs font-medium mb-2 text-muted-foreground">Thermischer Durchbruch (Drost 1978)</h3>
        <div className="grid grid-cols-2 gap-2">
          <KpiTile label="Durchbruchszeit"   value={r.tBreak} unit="Jahre" color={r.sDurchbruch} />
          <KpiTile label="Optimaler Abstand" value={Math.round(r.abstandOpt)} unit="m"
            sub={`für t_break = 25 a bei Q=${inputs.Q} l/s`} />
        </div>
      </section>

      {/* Wärmetauscher */}
      {r.lmtdValid && r.lmtd !== null && (
        <section>
          <h3 className="text-xs font-medium mb-2 text-muted-foreground">Wärmetauscher (Gegenstrom)</h3>
          <div className="grid grid-cols-2 gap-2">
            <KpiTile label="LMTD"     value={r.lmtd} unit="K" />
            {r.wtFlaeche !== null && (
              <KpiTile label="WT-Fläche" value={r.wtFlaeche} unit="m²" sub="U = 4000 W/(m²·K)" />
            )}
          </div>
        </section>
      )}

      {/* Material */}
      <section>
        <h3 className="text-xs font-medium mb-2 text-muted-foreground">Material &amp; Scaling — DVGW W 115</h3>
        <div className="flex flex-col gap-1.5">
          <AmpelBadge color={r.materialColor}  label={r.material} />
          <AmpelBadge color={r.scalingColor}   label={r.scaling} />
        </div>
      </section>
    </div>
  )
}
