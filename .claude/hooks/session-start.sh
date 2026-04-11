#!/bin/bash
# SessionStart-Hook: Prüft feedback.md auf offene Items bei jedem Session-Start
# Installiert via CLAUDE.md-Anleitung

[ ! -f feedback.md ] && exit 0

OFFEN=$(grep -c '^## .*\[offen\]' feedback.md 2>/dev/null || echo 0)
TRIAGE=$(grep -c '^## .*\[triage\]' feedback.md 2>/dev/null || echo 0)

[ "$OFFEN" -eq 0 ] && [ "$TRIAGE" -eq 0 ] && exit 0

cat <<EOF
📬 $OFFEN offene + $TRIAGE zu triagierende Feedback-Items in feedback.md.

Bitte lies die Datei vollständig und schlage dem User vor:
1. Priorisierung nach Impact und App-Zugehörigkeit
2. Gruppierung zu sinnvollen Arbeitspaketen
3. S/M/L-Schätzung pro Paket
4. Welches Paket soll als erstes bearbeitet werden?
EOF
