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

**Noch keine Feedback-Items. Sobald Nutzer Feedback geben, erscheinen sie hier automatisch.**

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
