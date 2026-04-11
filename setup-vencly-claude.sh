#!/bin/bash
# setup-vencly-claude.sh
# Vencly Claude Code Setup für Geotherm + Vorgänger-Repos
# Idempotent — kann mehrmals ausgeführt werden

set -euo pipefail

WORKSPACE="${HOME}/Code/vencly"
CLAUDE_DIR="${HOME}/.claude"
BACKUP_DIR="${CLAUDE_DIR}/backups/$(date +%Y%m%d-%H%M%S)"

# ── Farben ────────────────────────────────────
G='\033[0;32m'; B='\033[0;34m'; Y='\033[1;33m'; R='\033[0;31m'; N='\033[0m'
log()  { echo -e "${B}▸${N} $*"; }
ok()   { echo -e "${G}✓${N} $*"; }
warn() { echo -e "${Y}⚠${N} $*"; }
err()  { echo -e "${R}✗${N} $*"; exit 1; }

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║   Vencly · Claude Code Setup für Geotherm  ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# ── 1. Voraussetzungen prüfen ─────────────────
log "Prüfe Voraussetzungen..."
command -v node >/dev/null || err "Node.js fehlt — bitte installieren: brew install node"
command -v npm  >/dev/null || err "npm fehlt"
command -v git  >/dev/null || err "git fehlt"
ok "Node $(node -v), npm $(npm -v), git $(git --version | awk '{print $3}')"

# ── 2. Claude Code CLI ────────────────────────
if command -v claude >/dev/null 2>&1; then
  ok "Claude Code CLI bereits installiert ($(claude --version 2>/dev/null || echo 'unbekannt'))"
else
  log "Installiere Claude Code CLI..."
  npm install -g @anthropic-ai/claude-code
  ok "Claude Code CLI installiert"
fi

# ── 3. GitHub CLI ─────────────────────────────
if command -v gh >/dev/null 2>&1; then
  ok "GitHub CLI bereits installiert"
else
  if command -v brew >/dev/null 2>&1; then
    log "Installiere GitHub CLI via brew..."
    brew install gh
  else
    warn "Homebrew fehlt — installiere gh manuell: https://cli.github.com/"
  fi
fi

if gh auth status >/dev/null 2>&1; then
  ok "gh auth bereits eingerichtet"
else
  warn "gh ist nicht authentifiziert. Führe gleich aus: gh auth login"
fi

# ── 4. direnv ─────────────────────────────────
if command -v direnv >/dev/null 2>&1; then
  ok "direnv bereits installiert"
else
  if command -v brew >/dev/null 2>&1; then
    log "Installiere direnv..."
    brew install direnv
    warn "Füge zu ~/.zshrc hinzu: eval \"\$(direnv hook zsh)\""
  fi
fi

# ── 5. Workspace anlegen ──────────────────────
log "Lege Workspace an: $WORKSPACE"
mkdir -p "$WORKSPACE"
ok "Workspace bereit"

# ── 6. Repos klonen ───────────────────────────
clone_or_skip() {
  local repo=$1
  local dir="$WORKSPACE/$(basename $repo)"
  if [ -d "$dir/.git" ]; then
    ok "$(basename $repo) bereits geklont"
  else
    log "Klone $repo..."
    git clone "https://github.com/$repo.git" "$dir" || warn "Klonen von $repo fehlgeschlagen (privat? nicht eingeloggt?)"
  fi
}

clone_or_skip cryptoclemens/geotherm
clone_or_skip cryptoclemens/vencly-delta-t
clone_or_skip cryptoclemens/geopotatlas

# ── 7. .claude Backup ─────────────────────────
if [ -d "$CLAUDE_DIR" ] && [ -f "$CLAUDE_DIR/CLAUDE.md" -o -f "$CLAUDE_DIR/settings.json" ]; then
  log "Sichere bestehende .claude-Config nach $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"
  cp -r "$CLAUDE_DIR"/CLAUDE.md "$CLAUDE_DIR"/settings.json "$CLAUDE_DIR"/agents "$CLAUDE_DIR"/commands "$CLAUDE_DIR"/hooks "$BACKUP_DIR/" 2>/dev/null || true
  ok "Backup gespeichert"
fi

mkdir -p "$CLAUDE_DIR"/{agents,commands,hooks,backups}

# ── 8. CLAUDE.md (user-wide) ──────────────────
log "Schreibe ~/.claude/CLAUDE.md"
cat > "$CLAUDE_DIR/CLAUDE.md" <<'EOF'
# Claude Code — User-wide Konventionen für Vencly

## Projektkontext
Alle Vencly-Projekte liegen unter `~/Code/vencly/`:
- geotherm/        → Hauptprojekt, Geothermie-Suite (Next.js 15 + shadcn/ui + Supabase)
- vencly-delta-t/  → Vorgänger-Rechner (Single-File HTML, archiviert, read-only)
- geopotatlas/     → Vorgänger-Atlas (Vite + React, archiviert, read-only)

Bei Fragen über Vorgänger-Code: in den Archiv-Ordnern nachschauen, NICHT raten.

## Kommunikation
- Sprache: Deutsch
- Commit-Messages: Deutsch, Conventional Commits (feat:, fix:, docs:, refactor:, test:, chore:)

## Code-Qualität
- TypeScript strict, kein `any`
- 2 Spaces, Single Quotes, Trailing Commas, keine Semikolons
- Vor Push: `npm run lint && npm test` muss grün sein

## Git
- Niemals direkt auf main committen (außer docs-only)
- Feature-Branches: feature/{kurzbeschreibung}
- Push: `git push -u origin <branch>`

## Autonomie
- Du darfst ohne Rückfrage: Dateien ändern, npm install/test/lint, git add/commit/push,
  Branches anlegen, PRs erstellen, WebSearch/WebFetch nutzen
- Frag zurück bei: git push --force, git reset --hard, DB-Migrations,
  Secret-Änderungen, rm -rf außerhalb von node_modules/dist/.next

## Modell-Strategie
- Default: Sonnet 4.6 (schnell, effizient für Coding)
- Für wissenschaftliche Plausi-Checks, Architektur-Reviews und Security-Audits:
  Subagent `scientist` aufrufen (läuft auf Opus 4.6)
- Slash-Command `/plausi <thema>` als Shortcut

## Geotherm-spezifisch
- feedback.md bei Session-Start IMMER zuerst lesen (Hook macht das automatisch)
- Bei Formel-Änderungen: PLAUSI_CHECK.md konsultieren + scientist-Agent fragen
- Privacy: Keine PII in öffentliche Repos
- Migration-safe coden: keine Vercel/Supabase-spezifischen Features
EOF
ok "CLAUDE.md geschrieben"

# ── 9. settings.json ──────────────────────────
log "Schreibe ~/.claude/settings.json"
cat > "$CLAUDE_DIR/settings.json" <<'EOF'
{
  "model": "claude-sonnet-4-6",
  "permissions": {
    "allow": [
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(pnpm *)",
      "Bash(yarn *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push -u origin *)",
      "Bash(git pull *)",
      "Bash(git fetch *)",
      "Bash(git checkout *)",
      "Bash(git branch *)",
      "Bash(git merge *)",
      "Bash(git stash *)",
      "Bash(gh *)",
      "Bash(docker *)",
      "Bash(docker-compose *)",
      "Bash(supabase *)",
      "Bash(ls *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Bash(find *)",
      "Bash(grep *)",
      "Bash(rg *)",
      "WebFetch(domain:*)",
      "WebSearch"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(rm -rf ~)",
      "Bash(rm -rf $HOME)",
      "Bash(git push --force*)",
      "Bash(git push -f *)",
      "Bash(git reset --hard*)",
      "Bash(curl * | bash)",
      "Bash(curl * | sh)",
      "Bash(wget * | bash)"
    ]
  },
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/session-start.sh" }
        ]
      }
    ]
  }
}
EOF
ok "settings.json geschrieben"

# ── 10. Scientist Subagent (Opus) ─────────────
log "Schreibe ~/.claude/agents/scientist.md"
cat > "$CLAUDE_DIR/agents/scientist.md" <<'EOF'
---
name: scientist
description: Wissenschaftliche Plausi-Checks, Formel-Validierung gegen VDI/DIN/EN/peer-reviewed Quellen, Architektur-Trade-offs, Security-Reviews bei Auth/Secrets. Nutze diesen Agent proaktiv wenn (a) physikalische/thermodynamische Formeln geprüft werden müssen, (b) Architektur-Entscheidungen mit langfristigen Konsequenzen anstehen, (c) Security-kritischer Code (Auth, Tokens, RLS) reviewt wird, (d) der Benutzer "Plausi-Check" oder "wissenschaftliche Validierung" erwähnt.
model: opus
tools: Read, Grep, Glob, WebFetch, WebSearch
---

Du bist der Scientific Reviewer für Vencly-Projekte (primär Geotherm). Deine Aufgabe: tiefes, skeptisches, belegfundiertes Reasoning — nicht schnelles Coding.

## Dein Wertversprechen
Der Haupt-Agent (Sonnet 4.6) ist ein schneller Builder. Du bist das **Gegengewicht**: langsam, gründlich, evidenzbasiert. Du sagst "Stopp, das stimmt so nicht" wenn nötig.

## Spezialgebiete

### 1. Thermodynamik / Geothermie
- Formeln in DeltaT (`src/apps/deltat/calc/`) gegen VDI 4640, DIN EN 14511, Drost 1978, Arpagaus et al. 2018, Zühlsdorf et al. 2019, DVGW W 115, VDI Wärmeatlas prüfen
- Einheiten-Konsistenz (SI, kW vs. W, l/s vs. m³/s)
- Randfälle: T_GW < T_VL, ΔT ≤ 0, COP → ∞, deltaT_hub < 0
- PLAUSI_CHECK.md als Single Source of Truth für bisherige Findings
- Bei Zweifeln: WebFetch auf offizielle Quellen (nicht Blogs)

### 2. Architektur-Trade-offs
- Migrationssicherheit (Vercel/Supabase → Hetzner ohne Code-Änderung)
- Standalone-Extraktion einzelner In-Apps
- Kopplung vs. Kohäsion zwischen Modulen
- State-Management-Entscheidungen
- Server- vs. Client Components (Next.js App Router)

### 3. Security-Reviews
- Auth-Flows (keine direkten supabase.auth.* Calls in Components)
- Token-Handling (keine Secrets im Frontend-Bundle)
- RLS-Policies auf Supabase-Tabellen
- DSGVO: PII-Handling, E-Mail in Logs/Repos, Cookie-Consent
- CSP, CORS, XSS-Vektoren

## Arbeitsweise

1. **Lies zuerst, urteile später.** Immer erst den relevanten Code + Quellen lesen.
2. **Sei skeptisch.** Prüfe Rechnungen Schritt für Schritt.
3. **Zitiere die Quelle.** "Laut VDI 4640 Bl. 1, Abschnitt 5.2.3, gilt…"
4. **Finde die Annahme hinter der Annahme.** Welche Wassertemperatur? Welche Mineralisation?
5. **Liefere Numeric-Checks.** Rechne Beispielwerte durch.
6. **Sei kurz, aber vollständig.** Max. 300 Wörter + ggf. Tabelle.

## Output-Format

```
## Befund
[1 Satz: OK / Problem / Kritisch]

## Details
[max. 5 Punkte, jeder mit Quelle]

## Empfehlung
[konkrete Handlungsanweisung]

## Offene Fragen
[nur wenn Klärung nötig]
```

## Was du NICHT tust
- Kein Code schreiben (keine Edit/Write-Tools)
- Keine Git-Operationen
- Keine Meinungen ohne Beleg

Wenn du Code-Änderungen für nötig hältst: **Beschreibe sie**. Der Haupt-Agent setzt sie um.
EOF
ok "scientist.md geschrieben"

# ── 11. /plausi Slash-Command ─────────────────
log "Schreibe ~/.claude/commands/plausi.md"
cat > "$CLAUDE_DIR/commands/plausi.md" <<'EOF'
---
description: Wissenschaftliche Plausi-Prüfung via scientist-Agent (Opus)
---

Nutze den scientist-Agent (Opus 4.6), um folgendes zu prüfen: $ARGUMENTS

Der Scientist soll:
1. Den relevanten Code im aktuellen Repo identifizieren und lesen
2. Gegen offizielle Quellen (VDI/DIN/EN/peer-reviewed) verifizieren
3. Numerische Beispielwerte durchrechnen
4. Einen strukturierten Befund liefern (Befund / Details / Empfehlung)

Warte auf das Ergebnis und fasse es kurz für mich zusammen.
EOF
ok "plausi.md geschrieben"

# ── 12. SessionStart-Hook ─────────────────────
log "Schreibe ~/.claude/hooks/session-start.sh"
cat > "$CLAUDE_DIR/hooks/session-start.sh" <<'EOF'
#!/bin/bash
# Vencly SessionStart-Hook — läuft bei jeder Claude-Session
# Zeigt Status für Geotherm-Projekt + offene Feedback-Items

# Nur aktiv im Geotherm-Repo (oder anderen mit feedback.md)
[ ! -f "feedback.md" ] && exit 0

OFFEN=$(grep -c '^## .* · \[offen\]' feedback.md 2>/dev/null | tr -d ' ' || echo 0)
TRIAGE=$(grep -c '^## .* · \[triage\]' feedback.md 2>/dev/null | tr -d ' ' || echo 0)
INARBEIT=$(grep -c '^## .* · \[in-arbeit\]' feedback.md 2>/dev/null | tr -d ' ' || echo 0)

DONE=0; TODO=0
if [ -f Tasks.md ]; then
  DONE=$(grep -c '^- \[x\]' Tasks.md 2>/dev/null | tr -d ' ' || echo 0)
  TODO=$(grep -c '^- \[ \]' Tasks.md 2>/dev/null | tr -d ' ' || echo 0)
fi

BRANCH=$(git branch --show-current 2>/dev/null || echo "?")
UNPUSHED=$(git log --oneline @{u}..HEAD 2>/dev/null | wc -l | tr -d ' ' || echo 0)

cat <<MSG
📍 Vencly Session-Start
─────────────────────────
Branch:    $BRANCH
Unpushed:  $UNPUSHED Commits
Tasks:     $DONE erledigt · $TODO offen
Feedback:  $OFFEN offen · $TRIAGE triage · $INARBEIT in-arbeit
MSG

if [ "$OFFEN" -gt 0 ] || [ "$TRIAGE" -gt 0 ]; then
  echo ""
  echo "💬 Es gibt $OFFEN offene + $TRIAGE triage Feedback-Items."
  echo "   Bitte lies feedback.md, priorisiere und schlage 2-3 Arbeitspakete"
  echo "   (S/M/L Schätzung) vor, bevor du mit anderer Arbeit anfängst."
elif [ "$TODO" -gt 0 ]; then
  echo ""
  echo "✅ Kein offenes Feedback. Schau in Tasks.md, was als nächstes ansteht."
fi
EOF
chmod +x "$CLAUDE_DIR/hooks/session-start.sh"
ok "session-start.sh geschrieben + ausführbar"

# ── 13. .envrc Template ───────────────────────
log "Schreibe ~/Code/vencly/.envrc.example"
cat > "$WORKSPACE/.envrc.example" <<'EOF'
# Vencly Environment-Variablen
# Kopiere zu .envrc und füll die Werte ein
# .envrc ist gitignored — committe es NIEMALS
#
# Aktivieren:  cd ~/Code/vencly && direnv allow

# ── GitHub MCP (für GitHub-API-Zugriff via MCP) ──
export GH_MCP_TOKEN="github_pat_..."

# ── Supabase (Geotherm-Production) ──
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_ANON_KEY="sb_publishable_..."
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # NUR LOKAL — niemals committen

# ── Feedback-System (Server-only Token) ──
export GITHUB_FEEDBACK_TOKEN="github_pat_..."
export GITHUB_FEEDBACK_REPO="cryptoclemens/geotherm"

# ── Optional ──
# export NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
# export NEXT_PUBLIC_PLAUSIBLE_DOMAIN="geotherm.vencly.com"
EOF
ok ".envrc.example geschrieben"

if [ ! -f "$WORKSPACE/.envrc" ]; then
  warn ".envrc fehlt noch — kopiere von .envrc.example und fülle die Werte ein"
fi

# ── 14. Abschluss ─────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║              ✅ Setup fertig                ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "Nächste Schritte:"
echo ""
echo "  1. gh auth login                  # falls noch nicht passiert"
echo "  2. cd ~/Code/vencly"
echo "  3. cp .envrc.example .envrc       # und Werte eintragen"
echo "  4. direnv allow                   # Environment laden"
echo "  5. cd geotherm"
echo "  6. claude --add-dir ~/Code/vencly/vencly-delta-t \\"
echo "            --add-dir ~/Code/vencly/geopotatlas"
echo ""
echo "Geprüft & installiert:"
echo "  • Claude Code CLI"
echo "  • GitHub CLI"
echo "  • direnv"
echo "  • ~/Code/vencly/ Workspace mit 3 Repos"
echo "  • ~/.claude/CLAUDE.md (user-wide Regeln)"
echo "  • ~/.claude/settings.json (Sonnet 4.6 default + Permissions + Hook)"
echo "  • ~/.claude/agents/scientist.md (Opus-Subagent für Plausi-Checks)"
echo "  • ~/.claude/commands/plausi.md (Slash-Command Shortcut)"
echo "  • ~/.claude/hooks/session-start.sh (Feedback-Status-Hook)"
echo ""
if [ -d "$BACKUP_DIR" ]; then
  echo "  Backup deiner alten Config: $BACKUP_DIR"
  echo ""
fi
echo "Willkommen bei Vencly Claude Code 🚀"
