# Git-Hooks – Leak-Schutz

## Warum

`BRIEF.md` §6.1: *„Jede In-App kann als eigenständiges Repository extrahiert und an einen
einzelnen Kunden ausgeliefert werden."* Beim Extrahieren **reist die Git-Historie mit**.

Ein einmal committeter Klarname bleibt für immer abrufbar — auch wenn die Datei im nächsten
Commit gelöscht wird:

```bash
git rm geheim.txt && git commit -m "wieder entfernt"
git log --all -p -- geheim.txt      # → Inhalt vollständig da
```

Deshalb: **Kundennamen, Angebotspreise und Projektbezeichnungen gehören nicht in dieses Repo** —
nicht einmal kurz (siehe `Tasks.md` → M8.4). Der Hook macht das erzwingbar statt nur vorsätzlich.

## Einrichtung (einmal pro Arbeitskopie)

Git klont keine Hooks mit. In jedem Klon — Laptop, Server, CI — einmal:

```bash
./scripts/install-git-hooks.sh
```

Setzt `core.hooksPath` auf `.githooks/`.

## Die Denylist liegt außerhalb des Repos

Sie enthält genau die Begriffe, die nicht hinein sollen — stünde sie im Repo, wäre sie selbst
der Leak. Erwartet unter `~/.geotherm/denylist.txt` oder wo `$GEOTHERM_DENYLIST` hinzeigt:

```
# Ein Begriff pro Zeile. # = Kommentar. Groß-/Kleinschreibung egal.
<Kundenname>
<Projektname>
<Ortsname>
<Fachplaner>
<Bohrunternehmen>
<Nachnamen von Ansprechpartnern>
```

**Begriffe werden als ganze Wörter gesucht**, nicht als Teilstrings. Sonst legt ein kurzes
Firmenkürzel das Repo lahm: Ein Kürzel wie `ORT` träfe als Teilstring jedes „W**ort**",
„S**ort**ierung" und „**Ort**sangabe"; ein Nachname wie `Berg` jedes „**Berg**recht" und
„ver**berg**en". Ein Hook, der bei jedem zweiten Commit falsch anschlägt, wird nach einem Tag
deaktiviert — und dann ist der Schutz ganz weg. Der Hook setzt deshalb automatisch Wortgrenzen
(`\bBegriff\b`); Regex-Metazeichen werden escapt.

Trotzdem gilt: **Nachnamen aufnehmen, Vornamen weglassen.** Vornamen sind zu generisch und
kollidieren auch mit Wortgrenzen noch mit gleichlautenden Verben oder Substantiven.
Firmenkürzel, Projekt- und Ortsnamen sind dagegen unkritisch — die kommen im Code nicht vor.

**Transfer der Liste: niemals über dieses Repo.** Auf dem Server gehört sie neben die übrigen
Projekt-Secrets (`/root/.secrets/`), auf dem Laptop nach `~/.geotherm/`. Übertragung per `scp`,
Passwortmanager oder aus dem bestehenden Server-Tresor.

## Verhalten

| Situation | Reaktion |
|---|---|
| Begriff im gestageten Diff | Commit wird **abgebrochen**, Begriff + Trefferzahl werden genannt |
| Begriff im Dateinamen | Commit wird **abgebrochen** |
| Keine Denylist vorhanden | **Warnung, kein Abbruch** — wer die Begriffe nicht kennt, kann sie nicht committen |
| Falscher Alarm | `git commit --no-verify` |

## Bestehende Historie prüfen

Der Hook schützt nur neue Commits. Für den Bestand:

```bash
git log --all -p | grep -inFf ~/.geotherm/denylist.txt
```

Treffer im **bereits gepushten** Bestand lassen sich nur durch History-Rewrite
(`git filter-repo`) + Force-Push entfernen — mit allen Folgen für andere Klone. Deshalb der Hook.

## Und wenn ein Name inhaltlich nötig ist?

Ist er fast nie. Formuliere um:

| statt | besser |
|---|---|
| Kundenname | „der Kunde" / „der Betreiber" |
| Fachplaner-Firma | „der Fachplaner" |
| Bohrunternehmen | „das Bohrunternehmen" |
| Projekt + Ort | „ein Referenzprojekt" + die technischen Eckdaten |

Die fachlichen Befunde bleiben ohne Namen genauso belastbar — siehe den Bohrkost-Cross-Check in
`PLAUSI_CHECK.md`: „Zwei unabhängige Projektquellen nennen 537 bzw. 700 T€" trägt die ganze
Aussage, ohne irgendjemanden zu nennen.

**Wichtig — Pseudonyme sind keine Anonymisierung.** Auch ohne Namen bleibt eine Kombination aus
Bohrtiefe, Ausbaudurchmesser, Wärmebedarf und Region für Fachleute re-identifizierbar. Der Hook
verhindert das *versehentliche* Ausplaudern; er macht die Inhalte nicht veröffentlichungsreif.
Die eigentliche Grenze bleibt M8.4: **Kundenzahlen gehören gar nicht erst in dieses Repo.**
