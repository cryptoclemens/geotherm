#!/usr/bin/env bash
# Aktiviert die versionierten Git-Hooks in .githooks/ für diesen Klon.
# Einmal pro Arbeitskopie ausführen (Hooks werden von Git nicht mitgeklont).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git config core.hooksPath .githooks
echo "✓ core.hooksPath = .githooks"
LIST="${GEOTHERM_DENYLIST:-$HOME/.geotherm/denylist.txt}"
if [[ -f "$LIST" ]]; then
  echo "✓ Denylist gefunden: $LIST ($(grep -cvE '^[[:space:]]*(#|$)' "$LIST") Begriffe)"
else
  echo "⚠ Keine Denylist unter $LIST — siehe .githooks/README.md"
fi
