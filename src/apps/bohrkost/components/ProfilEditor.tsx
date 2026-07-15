'use client'

import { PlusIcon, Trash2Icon } from 'lucide-react'
import { pruefeProfil } from '../calc/kosten'
import type { BohrplatzProfil, Gesteinstyp, Profilquelle, ProfilProblem, Schicht } from '../calc/kosten'

interface ProfilEditorProps {
  profil: BohrplatzProfil | null
  tiefe: number
  /** true wenn der Rechenkern das Profil als gültig annimmt (BohrkostOutputs.profilAktiv) */
  aktiv: boolean
  onChange: (profil: BohrplatzProfil | null) => void
}

const GESTEIN_LABEL: Record<Gesteinstyp, string> = {
  'Lockergestein':          'Lockergestein',
  'Festgestein_sed':        'Festgestein (sed.)',
  'Festgestein_kristallin': 'Festgestein (krist.)',
}

const QUELLE_LABEL: Record<Profilquelle, string> = {
  'Schichtenverzeichnis': 'Schichtenverzeichnis (Landesamt)',
  'Nachbarbohrung':       'Nachbarbohrung',
  'Bohrunternehmen':      'Bohrunternehmen',
  'Schätzung':            'Schätzung',
}

/**
 * Formuliert das Prüfergebnis des Rechenkerns. Die REGEL liegt in calc/kosten.ts
 * (`pruefeProfil`) — hier wird sie nur in Text gegossen, nicht nachgebaut. Zwei
 * Implementierungen derselben Regel würden driften, und dann meldete das UI „gültig",
 * während der Kern still auf den Pauschaltyp zurückfällt (Fehlerklasse Befund B).
 */
function problemText(p: ProfilProblem): string {
  switch (p.art) {
    case 'leer':                   return 'Noch keine Schicht erfasst.'
    case 'startet_nicht_bei_null': return `Die erste Schicht muss bei 0 m beginnen (aktuell ${p.von} m).`
    case 'leere_schicht':          return `Schicht ${p.index + 1}: „bis" muss größer als „von" sein.`
    case 'luecke':                 return `Lücke zwischen ${p.von} m und ${p.bis} m.`
    case 'ueberlappung':           return `Überlappung zwischen ${p.von} m und ${p.bis} m.`
    case 'zu_kurz':                return `Profil endet bei ${p.ende} m, die Bohrung geht bis ${p.tiefe} m.`
  }
}

export function ProfilEditor({ profil, tiefe, aktiv, onChange }: ProfilEditorProps) {
  const schichten = profil?.schichten ?? []
  const problem = profil ? pruefeProfil(profil, tiefe) : null

  function setSchicht(i: number, patch: Partial<Schicht>) {
    if (!profil) return
    const next = schichten.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    onChange({ ...profil, schichten: next })
  }

  function addSchicht() {
    const letzte = schichten[schichten.length - 1]
    const von = letzte ? letzte.bis_m : 0
    const neu: Schicht = { von_m: von, bis_m: Math.max(von + 10, tiefe), gesteinstyp: 'Festgestein_sed' }
    onChange({ quelle: profil?.quelle ?? 'Schätzung', schichten: [...schichten, neu] })
  }

  function removeSchicht(i: number) {
    if (!profil) return
    onChange({ ...profil, schichten: schichten.filter((_, idx) => idx !== i) })
  }

  if (!profil) {
    return (
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => onChange({ quelle: 'Schätzung', schichten: [{ von_m: 0, bis_m: tiefe, gesteinstyp: 'Festgestein_sed' }] })}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2 self-start"
        >
          <PlusIcon className="w-3 h-3" />
          Bohrplatz-Profil erfassen
        </button>
        <p className="text-[11px] text-muted-foreground/70 leading-snug">
          Optional. Ersetzt den Pauschal-Gesteinstyp durch die tatsächlich durchbohrte
          Schichtenfolge. Quelle: Schichtenverzeichnis des Landesamts, Nachbarbohrung oder
          Bohrunternehmen — aus der Karte lässt sie sich nicht ableiten.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-primary/80">Bohrplatz-Profil</span>
        <button
          onClick={() => onChange(null)}
          className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Entfernen
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {schichten.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              type="number" min={0} max={3000} step={10} value={s.von_m}
              aria-label={`Schicht ${i + 1} von [m]`}
              onChange={e => setSchicht(i, { von_m: Number(e.target.value) })}
              className="w-14 text-xs bg-background border border-input rounded px-1.5 py-1 outline-none focus:border-primary/50"
            />
            <span className="text-[11px] text-muted-foreground">–</span>
            <input
              type="number" min={0} max={3000} step={10} value={s.bis_m}
              aria-label={`Schicht ${i + 1} bis [m]`}
              onChange={e => setSchicht(i, { bis_m: Number(e.target.value) })}
              className="w-14 text-xs bg-background border border-input rounded px-1.5 py-1 outline-none focus:border-primary/50"
            />
            <span className="text-[11px] text-muted-foreground">m</span>
            <select
              value={s.gesteinstyp}
              aria-label={`Schicht ${i + 1} Gesteinstyp`}
              onChange={e => setSchicht(i, { gesteinstyp: e.target.value as Gesteinstyp })}
              className="flex-1 min-w-0 text-xs bg-background border border-input rounded px-1.5 py-1 outline-none focus:border-primary/50 cursor-pointer"
            >
              {(Object.keys(GESTEIN_LABEL) as Gesteinstyp[]).map(g => (
                <option key={g} value={g}>{GESTEIN_LABEL[g]}</option>
              ))}
            </select>
            <button
              onClick={() => removeSchicht(i)}
              aria-label={`Schicht ${i + 1} löschen`}
              className="shrink-0 text-muted-foreground hover:text-red-600 transition-colors p-1"
            >
              <Trash2Icon className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addSchicht}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors self-start"
      >
        <PlusIcon className="w-3 h-3" />
        Schicht
      </button>

      {/* Die Herkunft ist Teil der Aussage, nicht Beiwerk — ein Schichtenverzeichnis
          trägt anders als eine Schätzung. */}
      <div className="flex flex-col gap-0.5">
        <label htmlFor="profil-quelle" className="text-[11px] text-muted-foreground">Quelle</label>
        <select
          id="profil-quelle"
          value={profil.quelle}
          onChange={e => onChange({ ...profil, quelle: e.target.value as Profilquelle })}
          className="text-xs bg-background border border-input rounded px-1.5 py-1 outline-none focus:border-primary/50 cursor-pointer"
        >
          {(Object.keys(QUELLE_LABEL) as Profilquelle[]).map(q => (
            <option key={q} value={q}>{QUELLE_LABEL[q]}</option>
          ))}
        </select>
      </div>

      {problem ? (
        <p className="text-xs text-amber-600 dark:text-amber-400 leading-snug rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-2 py-1.5">
          ⚠ {problemText(problem)} Solange das Profil unvollständig ist, rechnet der Pauschal-Gesteinstyp.
        </p>
      ) : aktiv ? (
        <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-snug">
          Profil aktiv — der Pauschal-Gesteinstyp wird nicht verwendet.
        </p>
      ) : null}
    </div>
  )
}
