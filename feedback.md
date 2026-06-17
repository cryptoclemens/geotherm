# Geotherm – Feedback-Stream

> **Hinweis zum Feedback-System**
>
> - Diese Datei wird automatisch vom Feedback-Modal via Server Action gefuellt.
> - Claude Code liest sie bei jedem Session-Start (via `.claude/hooks/session-start.sh`).
> - Status-Tags (in eckigen Klammern): `offen` → `triage` → `in-arbeit` → `erledigt` / `wontfix`
> - Das Repo ist privat, daher sind E-Mail-Adressen im Klartext ok. Bei einer
>   Loeschanfrage wird das betroffene Item komplett entfernt (nicht nur anonymisiert).
> - Manuelles Editieren ist ausschliesslich fuer Status-Updates und
>   Bearbeitungs-Kommentare vorgesehen – neue Eintraege kommen immer via Modal.

---

## 2026-04-13T10:55:25.737Z · deltat · ui-design · [erledigt]
**Nutzer:** clemens.pompey@vencly.com
**Version:** 1.0.0
**Sterne:** ★★★★☆
**Gerät:** Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36

> bisher nur darkmode, wäre cool, wenn es das auch in light mode gäbe.
> Farbe blau bei "Parameter" ist etwas zu intensiv

**Bearbeitung (2026-04-13):** Light-Mode-Toggle (Sonne/Mond-Icon) im Header ergänzt. Präferenz wird in localStorage gespeichert, Flash-Prevention-Script verhindert FOUC. Alle DeltaT-Komponenten (KpiTile, SecondaryColumn) mit `dark:`-Varianten versehen. Feldset-Legend-Farbe von `text-blue-700` auf `text-primary/80` (adaptives Teal) geändert.

---

## 2026-04-13T10:56:39.085Z · deltat · feature-wunsch · [erledigt]
**Nutzer:** clemens.pompey@vencly.com
**Version:** 1.0.0
**Sterne:** ★★★★☆
**Gerät:** Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36

> Informations-"i" bei jeder Eingabe bzw. Berechnungs-Ergebnis fehlt, bei der die Berechnung bzw. dahinterliegende Berechnungsformel in einem Popup angezeigt wird.

**Bearbeitung (2026-04-13):** ⓘ-Icon (InfoIcon aus lucide-react) bei allen 13 ParamSlidern und allen 9 KPI-Kacheln ergänzt. Tooltip zeigt Formel mit Quellenangabe (VDI 4640, DVGW W 115, Drost 1978, Gringarten & Sauty 1975, Arpagaus 2018). shadcn/ui Tooltip-Komponente (@base-ui/react) installiert und in Root-Layout mit TooltipProvider gewrappt.

---

## 2026-04-13T10:57:43.512Z · deltat · feature-wunsch · [erledigt]
**Nutzer:** clemens.pompey@vencly.com
**Version:** 1.0.0
**Sterne:** ★★★★☆
**Gerät:** Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36

> Speicher-Möglichkeit mit Hinterlegung eines Projektnamens fehlen

**Bearbeitung (2026-04-13):** „Speichern"-Button im DeltaT-Header ergänzt. Öffnet Dialog mit vorausgefülltem Projektnamen (Tiefe · Temp · Leistung), speichert alle Parameter + Ergebnisse via `createProject()` in Supabase. Projekt danach im Dashboard unter „Zuletzt gespeichert" sichtbar. Fix in diesem Commit.

---

## 2026-05-04T21:31:36.789Z · allgemein · bug · [in-arbeit]
**Nutzer:** clemens.pompey@vencly.com
**Version:** 1.0.0
**Gerät:** Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1

> In der mobil Version nicht wirklich gut ablesbar. Teile des Bildschirms fehlen

---

---

## Format-Beispiel

Die folgenden Beispiele zeigen das erwartete Format eines echten Eintrags.
Sie sind bewusst als Blockquote bzw. in einem HTML-Kommentar eingebettet, damit
der SessionStart-Hook sie beim Zaehlen offener Items NICHT als echte Eintraege
erfasst (`grep -c` auf Status-Tags muss hier 0 liefern).

<!--
Rohformat eines echten Eintrags (kein Blockquote, ohne Escapes):

## 2026-04-10T14:23:05Z · in_app · category · [status]
**Nutzer:** email@example.com
**Version:** v2026.W15.1423
**Sterne:** ***
**Geraet:** Browser / OS

> Feedback-Nachricht als Blockquote.
> Kann mehrere Zeilen haben.

---
-->

**Beispiel 1 – GPA UI-Feedback (3 Sterne):**

> `## 2026-04-08T09:14:22Z · gpa · ui-design · (offen)`
> **Nutzer:** anna.mueller@example.com
> **Version:** v2026.W15.0912
> **Sterne:** ★★★☆☆
> **Geraet:** Firefox 124 / Windows 11
>
> > Die Farbgebung der KPI-Kacheln ist mir zu blass, besonders im
> > Dark-Mode kaum lesbar. Koennten die Werte etwas kontrastreicher
> > dargestellt werden?
>
> ---

**Beispiel 2 – DeltaT Feature-Wunsch (5 Sterne):**

> `## 2026-04-09T16:45:10Z · deltat · feature-wunsch · (triage)`
> **Nutzer:** dr.schmidt@geothermie-nord.de
> **Version:** v2026.W15.1630
> **Sterne:** ★★★★★
> **Geraet:** Safari 17 / macOS 14.4
>
> > Klasse Tool! Waere es moeglich, mehrere Standorte parallel zu vergleichen?
> > Ein Split-View mit 2-3 Parametersaetzen nebeneinander waere Gold wert
> > fuer unsere Vorstudien.
>
> ---

**Beispiel 3 – Allgemeiner Bug (2 Sterne, bereits erledigt):**

> `## 2026-04-05T11:02:47Z · allgemein · bug · (erledigt)`
> **Nutzer:** t.krause@ingbuero-krause.de
> **Version:** v2026.W14.2340
> **Sterne:** ★★☆☆☆
> **Geraet:** Chrome 123 / Ubuntu 22.04
>
> > Beim Klick auf „Quellen" oeffnet sich das Modal hinter der StatusBar
> > und ist nicht mehr wegklickbar. Nur Reload hilft.
>
> **Bearbeitung (2026-04-06):** z-index der Portal-Modals auf 9999 gesetzt,
> Fix in v2026.W15.0830 deployed. Dank an Herrn Krause fuer den Report.
>
> ---
