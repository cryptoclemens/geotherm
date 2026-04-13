'use client'

import { useState } from 'react'
import { SendIcon, ChevronDownIcon } from 'lucide-react'

// ── Formel-Datensätze ────────────────────────────────────────────────────────
interface Formel {
  id: string
  kennzahl: string
  formel: string
  einheit: string
  erlaeuterung: string
  quelle: string
}

const FORMELN: Formel[] = [
  {
    id: 'q-th',
    kennzahl: 'Thermische Leistung',
    formel: 'Q_th = Q × ΔT × c_p',
    einheit: 'kW',
    erlaeuterung: 'Wärmeinhalt des geförderten Grundwassers. ΔT = T_GW − T_R, c_p = 4,18 kJ/(kg·K), Q in l/s = kg/s.',
    quelle: 'Drost 1978; VDI 4640 Bl. 2',
  },
  {
    id: 'transmissiv',
    kennzahl: 'Transmissivität',
    formel: 'T = k_f × b',
    einheit: 'm²/s',
    erlaeuterung: 'Produkt aus hydraulischer Leitfähigkeit k_f [m/s] und Aquifermächtigkeit b [m]. VDI 4640: T > 1×10⁻³ m²/s = gut nutzbar.',
    quelle: 'Darcy; DVGW W 115',
  },
  {
    id: 'pumpe',
    kennzahl: 'Tauchpumpenleistung',
    formel: 'P = ρ·g·H·Q / η',
    einheit: 'kW',
    erlaeuterung: 'ρ = 1.000 kg/m³, g = 9,81 m/s², H = dynamische Förderhöhe [m], η = 0,60. H ist nicht die Bohrtiefe, sondern der hydraulische Druckverlust (Faktor 2–5 kleiner).',
    quelle: 'VDI 4640 Bl. 2; Stober & Bucher (2012) Kap. 7.4',
  },
  {
    id: 'durchbruch',
    kennzahl: 'Thermische Durchbruchszeit',
    formel: 't_B = (π·n·b·d²) / (3·Q) × (ρc_Aq/ρc_W)',
    einheit: 'Jahre',
    erlaeuterung: 'Prognose des thermischen Kurzschlusses. n = 0,25 (Porosität), d = Bohrlochabstand, ρc-Verhältnis = 0,70 (konservativ für Sandstein). Ziel: t_B > 25–30 Jahre.',
    quelle: 'Gringarten & Sauty 1975; Water Resources Research 11(5)',
  },
  {
    id: 'abstand-opt',
    kennzahl: 'Optimaler Mindestabstand',
    formel: 'd_opt = √[ 3·Q·t_B·365·86400 / (π·n·b·ρc-Ratio) ]',
    einheit: 'm',
    erlaeuterung: 'Rückrechnung aus der Durchbruchszeit-Formel für t_B = 25 Jahre. Gibt den Mindestabstand an, bei dem die Doublette 25 Jahre ohne thermischen Kurzschluss betrieben werden kann.',
    quelle: 'Gringarten & Sauty 1975',
  },
  {
    id: 'cop',
    kennzahl: 'COP Wärmepumpe (real)',
    formel: 'COP = (T_VL / (T_VL − T_R)) × 0,50',
    einheit: '—',
    erlaeuterung: 'T_VL und T_R in Kelvin. Faktor 0,50 = 50 % Carnot-Effizienz (empirisch für Wasserkühlmittel-WP). T_R ist die Reinjektionstemperatur (= Verdampfer-Auslasstemperatur).',
    quelle: 'Arpagaus et al. 2018, Energy 152, Gl. 7; IEA HPP Annex 35',
  },
  {
    id: 'wp-elektrik',
    kennzahl: 'WP-Elektroleistung',
    formel: 'W_el = Q_geo / (COP − 1)',
    einheit: 'kW',
    erlaeuterung: 'Abgeleitet aus der COP-Definition: COP = Q_th / W_el → W_el = Q_th / COP, Q_th = Q_geo + W_el → Q_geo = W_el × (COP − 1).',
    quelle: 'VDI 4640 Bl. 4',
  },
  {
    id: 'lmtd',
    kennzahl: 'LMTD (Wärmetauscher)',
    formel: 'LMTD = (ΔT₁ − ΔT₂) / ln(ΔT₁/ΔT₂)',
    einheit: 'K',
    erlaeuterung: 'Mittlere logarithmische Temperaturdifferenz im Gegenstrom-Betrieb. ΔT₁ = T_GW − T_VL (warmes Ende), ΔT₂ = T_R − T_RL (kaltes Ende). Voraussetzung: T_GW > T_VL.',
    quelle: 'VDI Wärmeatlas 2019 Abschn. C1',
  },
  {
    id: 'wt-flaeche',
    kennzahl: 'Wärmetauscherfläche',
    formel: 'A = Q_geo / (U × LMTD)',
    einheit: 'm²',
    erlaeuterung: 'Näherungsauslegung für Plattenwärmetauscher. U = 4.000 W/(m²·K) (typischer Richtwert für Wasser–Wasser). Genauere Auslegung erfordert Herstellerdaten.',
    quelle: 'VDI Wärmeatlas 2019 Abschn. C1',
  },
  {
    id: 'spez-leistung',
    kennzahl: 'Spezifische Leistung',
    formel: 'q_spez = Q_th × 1000 / Tiefe',
    einheit: 'W/m',
    erlaeuterung: 'Geothermische Leistung bezogen auf die Bohrtiefe einer Bohrung. Orientierungswert VDI 4640: 30–100 W/m je nach Aquifer. Hydraulikampel: > 100 W/m = sehr gut.',
    quelle: 'VDI 4640 Bl. 1',
  },
  {
    id: 'material',
    kennzahl: 'Materialklasse (TDS-Grenzwerte)',
    formel: 'TDS < 1.000 → Baustahl | < 5.000 → Edelstahl | < 30.000 → Duplex | ≥ 30.000 → Titan',
    einheit: 'mg/l',
    erlaeuterung: 'Werkstoffempfehlung auf Basis des Gesamtmineralisationsgehalts (TDS). Korrosionsrisiko steigt mit TDS und Chloridgehalt. Entscheidend: Lochkorrosions-Index (DVGW W 115).',
    quelle: 'DVGW W 115 (2006) Tab. 1',
  },
  {
    id: 'jahreswaerme',
    kennzahl: 'Jahreswärmemenge',
    formel: 'E_a = Q_geo_gesamt × h/a / 1.000',
    einheit: 'MWh/a',
    erlaeuterung: 'Jährlich erzeugte Wärmemenge bei Nennleistung. h/a = Volllaststunden. Typisch Fernwärme: 4.000–6.000 h/a. Volllaststunden ≠ Betriebsstunden (Teillastbetrieb nicht berücksichtigt).',
    quelle: 'VDI 4640 Bl. 1',
  },
]

// ── Feedback-API ─────────────────────────────────────────────────────────────
type SubmitState = 'idle' | 'sending' | 'ok' | 'err'

async function submitFormelFeedback(formelId: string, kennzahl: string, message: string): Promise<boolean> {
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inApp: 'deltat',
        category: 'sonstiges',
        stars: null,
        message: `[Formel: ${kennzahl} (${formelId})] ${message}`,
        consent: true,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── FormelRow ─────────────────────────────────────────────────────────────────
function FormelRow({ f }: { f: Formel }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [state, setState] = useState<SubmitState>('idle')

  async function send() {
    if (!text.trim() || state === 'sending') return
    setState('sending')
    const ok = await submitFormelFeedback(f.id, f.kennzahl, text.trim())
    setState(ok ? 'ok' : 'err')
    if (ok) setText('')
  }

  return (
    <>
      <tr className="border-b border-border hover:bg-muted/30 transition-colors">
        <td className="py-3 pr-4 align-top">
          <span className="text-sm font-medium text-foreground">{f.kennzahl}</span>
        </td>
        <td className="py-3 pr-4 align-top">
          <code className="text-xs font-mono text-primary bg-primary/8 px-1.5 py-0.5 rounded break-all">
            {f.formel}
          </code>
          <span className="ml-1.5 text-[11px] text-muted-foreground">[{f.einheit}]</span>
        </td>
        <td className="py-3 pr-4 align-top text-xs text-muted-foreground leading-relaxed max-w-xs">
          {f.erlaeuterung}
        </td>
        <td className="py-3 pr-4 align-top text-[11px] text-muted-foreground whitespace-nowrap">
          {f.quelle}
        </td>
        <td className="py-3 align-top">
          <button
            onClick={() => { setOpen(o => !o); setState('idle') }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Feedback
            <ChevronDownIcon className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-border bg-muted/20">
          <td colSpan={5} className="px-0 py-3">
            <div className="flex flex-col gap-2 max-w-xl">
              {state === 'ok' ? (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ Feedback gespeichert — danke für die wissenschaftliche Anmerkung!
                </p>
              ) : (
                <>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={`Anmerkung zur Formel "${f.kennzahl}" — z. B. abweichende Quelle, Grenzfall, Verbesserungsvorschlag…`}
                    rows={3}
                    disabled={state === 'sending'}
                    className="w-full text-xs bg-background border border-input rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/50 disabled:opacity-50"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] text-muted-foreground/60">
                      Feedback landet in der Projektdatenbank und wird vom Team geprüft.
                    </p>
                    <button
                      onClick={send}
                      disabled={!text.trim() || state === 'sending'}
                      className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                    >
                      <SendIcon className="w-3 h-3" />
                      {state === 'sending' ? 'Sende…' : 'Absenden'}
                    </button>
                  </div>
                  {state === 'err' && (
                    <p className="text-xs text-red-500">Fehler beim Senden — bitte erneut versuchen.</p>
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── FormelTab ─────────────────────────────────────────────────────────────────
export function FormelTab() {
  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto h-full">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Formelwerk — DeltaT Dubletten-Auslegung</h2>
        <p className="text-xs text-muted-foreground">
          Alle verwendeten Berechnungsformeln mit Quellennachweisen. Wissenschaftliche Anmerkungen, alternative Quellen oder Korrekturen bitte direkt per Feedback melden.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pb-2 pr-4 whitespace-nowrap">Kennzahl</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pb-2 pr-4">Formel</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pb-2 pr-4">Erläuterung</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pb-2 pr-4 whitespace-nowrap">Quelle</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {FORMELN.map(f => <FormelRow key={f.id} f={f} />)}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground/50 italic">
        Vorauslegung · Machbarkeitsebene — kein Ersatz für hydrogeologisches Gutachten.
        Alle Formeln nach aktuellem Stand der Technik (VDI 4640, DVGW W 115) implementiert.
      </p>
    </div>
  )
}
