'use client'

import { useState } from 'react'
import { SendIcon, ChevronDownIcon } from 'lucide-react'

// ── Typen ─────────────────────────────────────────────────────────────────────

interface Formel {
  id: string
  kennzahl: string
  formel: string
  einheit: string
  erlaeuterung: string
  quelle: string
}

// ── Formel-Datensätze ─────────────────────────────────────────────────────────

const FORMELN: Formel[] = [
  {
    id: 'lukawski',
    kennzahl: 'Bohrkosten (Lukawski)',
    formel: 'C(d) = (1,72×10⁻⁷·d² + 2,3×10⁻³·d − 0,62)·10⁶',
    einheit: 'USD₂₀₀₉',
    erlaeuterung: 'Empirische Kostenkurve für Geothermiebohrungen. d = Bohrtiefe in Metern. Gültig für d ≥ 500 m. Für geringere Tiefen: linearer Fallback (Festpreis/m + Mobilisierung).',
    quelle: 'Lukawski et al. (2014), J. Pet. Sci. Eng. 118, 1–14',
  },
  {
    id: 'linear-fallback',
    kennzahl: 'Linearer Fallback (d ≤ 400 m)',
    formel: 'C = (Preis/m × d + C_Mobil) × f_region × f_durchmesser',
    einheit: 'EUR',
    erlaeuterung: 'Für flache Bohrungen (≤ 400 m): Lockergestein 300 EUR/m + 75.000 EUR, Festgestein sed. 700 EUR/m + 100.000 EUR, Kristallin 1.200 EUR/m + 150.000 EUR Mobilisierung. Region und Durchmesser wirken mit; der deutsche Marktaufschlag bewusst nicht — die GtV-/DVGW-Preise sind bereits deutsche Marktpreise. Zwischen 400 und 600 m linearer Blend zur Lukawski-Kurve.',
    quelle: 'Eigene Schätzung auf Basis GtV Bohrpreise (2024); DVGW W 115',
  },
  {
    id: 'linear-gueltigkeit',
    kennzahl: 'Gültigkeitsgrenze linearer Zweig',
    formel: 'gilt für klein-kalibrige Brunnen (Ausbau ≤ 13 3/8" / 340 mm)',
    einheit: '—',
    erlaeuterung: 'Die zugrunde liegenden GtV-/DVGW-Preise beschreiben klein-kalibrige Brunnenbohrungen. Für Geothermie-Produktionsbrunnen unter 400 m ist der lineare Zweig nicht belastbar: Reale Angebote liegen um ein Mehrfaches über dem Rechnerwert und damit außerhalb der AACE-Class-5-Bandbreite. Der Durchmesserfaktor endet bei 13 3/8" (340 mm) — größere Ausbauten mit Filterrohr und Kiesschüttung bildet der Rechner nicht ab, ihre Mehrkosten fehlen vollständig. Für solche Bohrungen ist ein Angebot einzuholen; der Rechnerwert taugt dort nicht einmal als Untergrenze.',
    quelle: 'PLAUSI_CHECK.md, Befund A (Juli 2026); AACE Class 5',
  },
  {
    id: 'waehrung',
    kennzahl: 'Währungskorrektur USD→EUR',
    formel: 'EUR₂₀₂₆ = USD₂₀₀₉ × 1,34',
    einheit: '—',
    erlaeuterung: 'Die Lukawski-Formel liefert Kosten in US-Dollar des Jahres 2009. Die Umrechnung erfolgt in zwei Schritten: Zuerst wird innerhalb des Dollars inflationiert (US-Verbraucherpreisindex 2009–2026: ×1,54), danach einmal zum Wechselkurs des Zieljahres umgerechnet (EUR/USD 1,15 für 2026). Resultat: 1,54 / 1,15 ≈ 1,34. Der Wechselkurs von 2009 geht bewusst nicht ein — ein Preisindex gilt nur in seiner eigenen Währung. Der Faktor wird jährlich geprüft (nächste Prüfung: April 2027); der deutsche Marktaufschlag ist separat abgedeckt.',
    quelle: 'US CPI 2009–2026 (BLS) + EUR/USD-Kurs 2026 (ECB); PLAUSI_CHECK.md, Befund C (Juli 2026)',
  },
  {
    id: 'gestein-faktor',
    kennzahl: 'Gesteinstyp-Korrekturfaktor',
    formel: 'f_G: Lockergestein 0,70 / Festgestein 1,00 / Kristallin 1,30',
    einheit: '—',
    erlaeuterung: 'Abgeleitet aus Rate-of-Penetration (ROP)-Verhältnissen. Lockergestein bohrt schnell → geringe Kosten. Kristallines Grundgebirge (Granit, Gneis) erfordert aufwändigere Bohrtechnik.',
    quelle: 'Abgeleitet aus ROP-Verhältnissen; Baujard et al. (2017), Stanford SGW',
  },
  {
    id: 'markt-de',
    kennzahl: 'Deutscher Marktaufschlag',
    formel: 'f_Markt = 1,40',
    einheit: '—',
    erlaeuterung: 'Berücksichtigt höhere Lohnkosten, Sicherheitsstandards und begrenzte Bohrunternehmer-Kapazitäten im deutschen Markt im Vergleich zum internationalen Benchmark der Lukawski-Daten.',
    quelle: 'GtV Bundesverband Geothermie (Bohrpreise); LIAG Broschüre Tiefe Geothermie',
  },
  {
    id: 'komplettierung',
    kennzahl: 'Komplettierungskosten',
    formel: 'C_Kompl = tiefe × 60 EUR/m + Pumptest + Genehmigung + Gutachten',
    einheit: 'EUR',
    erlaeuterung: 'Pauschalzuschläge: Pumpe + Steigleitung 60 EUR/m (Dublette: ×2), Pumptest 60.000–80.000 EUR, Genehmigung WHG/BBergG 25.000 EUR, geolog. Gutachten 30.000 EUR, Fündigkeitsrisiko-Versicherung (variabel).',
    quelle: 'DVGW W 115; Stober & Bucher (2012) Kap. 7; Branchenschätzung',
  },
  {
    id: 'foerderung-map',
    kennzahl: 'MAP-Förderung (KfW)',
    formel: 'F = min(375 EUR/m × tiefe; 2.500.000 EUR)',
    einheit: 'EUR',
    erlaeuterung: 'Bundesförderung für effiziente Wärmenutzung. Fördersatz 375 EUR/m Bohrtiefe, maximal bis 2.500 m Bohrtiefe berücksichtigt. Bei Dublette: nur für die Förderbohrung (eine der zwei Bohrungen).',
    quelle: 'Bundesförderung für effiziente Gebäude (BEG); MAP-Programm KfW 2024',
  },
  {
    id: 'leistung',
    kennzahl: 'Thermische Leistung',
    formel: 'Q_th = Q × (T_GW − T_R) × c_p',
    einheit: 'kW',
    erlaeuterung: 'Q = Förderrate [l/s = kg/s], T_GW = Grundwassertemperatur [°C], T_R = Reinjektionstemperatur [°C], c_p = 4,18 kJ/(kg·K). Gilt nur für Dublette/Einzelbohrung, nicht Explorationsbohrung.',
    quelle: 'Drost (1978); VDI 4640 Bl. 2',
  },
  {
    id: 'kosten-kw',
    kennzahl: 'Spezifische Investitionskosten',
    formel: 'c_spez = Projektkosten / Q_th',
    einheit: 'EUR/kW_th',
    erlaeuterung: 'Gesamtprojektkosten (inkl. Komplettierung) bezogen auf thermische Nennleistung. Benchmarks: < 500 EUR/kW = wirtschaftlich, 500–1.500 EUR/kW = erhöht, > 1.500 EUR/kW = hoch.',
    quelle: 'Branchenstandard; DENA Wärmepumpen-Marktanalyse 2023',
  },
]

// ── Feedback-API ──────────────────────────────────────────────────────────────

type SubmitState = 'idle' | 'sending' | 'ok' | 'err'

async function submitFormelFeedback(formelId: string, kennzahl: string, message: string): Promise<boolean> {
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inApp: 'bohrkost',
        category: 'sonstiges',
        stars: null,
        message: `[Bohrkost-Formelwerk: ${kennzahl} (${formelId})] ${message}`,
        consent: true,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── FeedbackZeile ─────────────────────────────────────────────────────────────

interface FeedbackZeileProps {
  label: string
  prefix: string
}

function FeedbackZeile({ label, prefix }: FeedbackZeileProps) {
  const [text, setText] = useState('')
  const [state, setState] = useState<SubmitState>('idle')

  async function send() {
    if (!text.trim() || state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inApp: 'bohrkost',
          category: 'sonstiges',
          stars: null,
          message: `${prefix} ${text.trim()}`,
          consent: true,
        }),
      })
      setState(res.ok ? 'ok' : 'err')
      if (res.ok) setText('')
    } catch {
      setState('err')
    }
  }

  return (
    <div className="flex flex-col gap-2 max-w-xl py-3">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      {state === 'ok' ? (
        <p className="text-xs text-green-600 dark:text-green-400">
          Feedback gespeichert — danke!
        </p>
      ) : (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Formelfehler, fehlende Quelle, Verbesserungsvorschlag, fehlender Parameter…"
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
  )
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
                  Feedback gespeichert — danke für die wissenschaftliche Anmerkung!
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

// ── BohrkostFormelTab ─────────────────────────────────────────────────────────

export function BohrkostFormelTab() {
  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto h-full">
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Formelwerk — Bohrkostenrechner</h2>
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
            <tr>
              <td colSpan={5}>
                <FeedbackZeile
                  label="Was fehlt? Was sollte verbessert werden?"
                  prefix="[Bohrkost-Formelwerk: Freitext]"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground/50 italic">
        Kostenschätzung Klasse 5 (±35–50 %) · Machbarkeitsebene — kein Ersatz für Bohrplanung und Ausschreibung.
        Alle Formeln nach aktuellem Stand der Technik (VDI 4640, DVGW W 115, GtV) implementiert.
      </p>
    </div>
  )
}
