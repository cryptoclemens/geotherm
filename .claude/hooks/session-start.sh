#!/bin/bash
# SessionStart-Hook – Geotherm
# Wird bei jedem claude-Session-Start automatisch ausgefuehrt.
# Zaehlt offene Feedback-Items und gibt Claude den Triage-Auftrag.

FEEDBACK_FILE="$(git rev-parse --show-toplevel 2>/dev/null)/feedback.md"

[ ! -f "$FEEDBACK_FILE" ] && exit 0

OFFEN=$(grep -c '^## .*\[offen\]' "$FEEDBACK_FILE" 2>/dev/null || echo 0)
TRIAGE=$(grep -c '^## .*\[triage\]' "$FEEDBACK_FILE" 2>/dev/null || echo 0)

[ "$OFFEN" -eq 0 ] && [ "$TRIAGE" -eq 0 ] && exit 0

cat <<EOF
📬 $OFFEN offene + $TRIAGE zu triagierende Feedback-Items in feedback.md.

Bitte lies die Datei vollständig und schlage dem User vor:
1. Priorisierung nach Impact und App-Zugehörigkeit
2. Gruppierung zu sinnvollen Arbeitspaketen
3. S/M/L-Schätzung pro Paket
4. Welches Paket soll als erstes bearbeitet werden?
EOF
