# Geotherm by Vencly

![Status](https://img.shields.io/badge/status-Beta-green) ![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%7C%20shadcn%2Fui%20%7C%20Tailwind%204-2E75B6) ![License](https://img.shields.io/badge/license-proprietary-gray)

**Geotherm** ist die modulare Geothermie-Suite der [vencly GmbH](https://www.vencly.com). Eine einheitliche Web-Plattform, die alle Werkzeuge entlang des Geothermie-Projektlebenszyklus in einem Workflow bündelt — **vom Standort zum Bohrplan**.

🌐 **Live:** [geotherm.vencly.com](https://geotherm.vencly.com)
🔒 **Repo:** privat

---

## 🧭 Orientierung für Claude Code / neue Entwickler

Lies die Dokumente in dieser Reihenfolge:

1. **[BRIEF.md](BRIEF.md)** — Produktvision, Zielgruppe, Positionierung, strategische Leitplanken
2. **[Tasks.md](Tasks.md)** — Detaillierter Backlog mit Milestones M0–M7
3. **[CLAUDE.md](CLAUDE.md)** — Konventionen, Architektur-Regeln, Do's & Don'ts
4. **Diese README** — Technisches Setup und How-to-Run
5. **[feedback.md](feedback.md)** — Nutzer-Feedback (bei jedem Session-Start prüfen!)

Die erste Entwicklungs-Session beginnt mit **Milestone 1 (Projekt-Setup)** aus Tasks.md.

---

## 📦 Was steckt drin?

Geotherm ist ein **App-Container** mit modularen **In-Apps**:

| In-App | Route | Beschreibung | Herkunft |
|---|---|---|---|
| **Dashboard** | `/dashboard` | Post-Login-Startseite: KI-Assistent, App-Direktzugriff, letzte Projekte | — |
| **GPA** – Geothermie-Potenzial-Atlas | `/atlas` | Interaktive Karte mit Fernwärme-, Geologie- und Wärmequellen-Overlays | [geopotatlas](https://github.com/cryptoclemens/geopotatlas) |
| **DeltaT** – Dubletten-Auslegungsrechner | `/deltat` | Echtzeit-Rechner für geothermische Dubletten mit WP-Dimensionierung | [vencly-delta-t](https://github.com/cryptoclemens/vencly-delta-t) |

Beide tauschen Daten über einen gemeinsamen **Workspace-Store** aus. Weitere In-Apps auf der Roadmap (siehe [BRIEF.md §2.4](BRIEF.md)).

---

## 🏗 Architektur-Prinzipien

### 1. Modulare In-Apps
Jede In-App lebt in `src/apps/{name}/` und hat:
- Eigene `components/`, `store/`, optional `calc/` für Pure Logic
- Eigene `index.tsx` als Entry-Point (Dynamic Import via `next/dynamic`)
- Eigenen DB-Schema-Namespace (`gpa_*`, `deltat_*`)

→ Jede In-App kann als Standalone-Produkt extrahiert und whitelabel-lizenziert werden.

### 2. Cloud-agnostisch ab Tag 1
- Keine hardcoded URLs — alle Backend-Endpunkte via `NEXT_PUBLIC_*` Env-Vars
- Eigener `useAuth()`-Hook statt direkter Supabase-Calls → Migrations-sicher zu Keycloak
- REST-only, keine Supabase-spezifischen Features (Realtime, Storage-Buckets)
- `next.config.ts` mit `output: 'standalone'` für Hetzner-Docker
- Dockerfile + docker-compose.yml von Anfang an im Repo

### 3. Shared Core
```
src/core/
├── auth/      # useAuth(), AuthProvider, RequireAuth
├── api/       # REST-Client, GitHub-Sync-Helper
├── ui/        # shadcn/ui + eigene Shared Components (ParamSlider, etc.)
└── layout/    # AppShell, Header, Footer
```

### 4. Feedback-Driven Development
Jede In-App hat einen Feedback-Button. Feedback landet strukturiert in `feedback.md` und wird von Claude Code bei jedem Session-Start als Arbeitspakete triagiert. Siehe **[Feedback-System](#-feedback-system)** unten.

### 5. Wissenschaftliche Validität
Jede Formel im Rechner-Kern hat eine Quellenangabe (VDI, DIN, EN, peer-reviewed Paper). Unit-Tests decken die Berechnungslogik ab. Siehe `PLAUSI_CHECK.md`.

---

## 🚀 Quick Start

```bash
# Voraussetzungen
node --version   # mind. 20.x
npm --version    # mind. 10.x

# 1. Klonen
git clone https://github.com/cryptoclemens/geotherm.git
cd geotherm

# 2. Dependencies
npm install

# 3. Env-Variablen
cp .env.example .env.local
# .env.local mit Supabase-Keys befüllen

# 4. Dev-Server
npm run dev
# → http://localhost:3000

# 5. Production
npm run build
npm start
```

---

## 🔧 Environment Variables

Alle Public-Vars haben `NEXT_PUBLIC_`-Präfix (im Browser lesbar). Server-Secrets **ohne** Präfix.

| Variable | Pflicht | Scope | Beschreibung |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Public | Supabase-Project-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public | Supabase Anon-Key (Publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Server-only** | Für Admin-Ops (Feedback-Sync, Admin-Dashboard) |
| `GITHUB_FEEDBACK_TOKEN` | ✅ | **Server-only** | Fine-grained PAT mit `Contents: Read/Write` für dieses Repo |
| `GITHUB_FEEDBACK_REPO` | ✅ | Server-only | z.B. `cryptoclemens/geotherm` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public | Basis-URL für OAuth-Redirects (z.B. `https://geotherm.vencly.com`) |
| `ANTHROPIC_API_KEY` | ✅ | **Server-only** | Anthropic API Key für KI-Assistent (Dashboard-Dialog) |
| `NEXT_PUBLIC_GIT_SHA` | auto | Public | 7-stelliger Git-SHA, von Vercel automatisch injiziert (`VERCEL_GIT_COMMIT_SHA`) |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | Public | Sentry Error-Tracking |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | ❌ | Public | Plausible Analytics Domain |

**Wichtig:** `.env.local` niemals committen. `.env.example` immer committen.

---

## 🗺 Projektstruktur

```
geotherm/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (marketing)/              # SSG für SEO
│   │   │   ├── page.tsx              # Landing
│   │   │   ├── impressum/page.tsx
│   │   │   ├── datenschutz/page.tsx
│   │   │   ├── agb/page.tsx
│   │   │   ├── security/page.tsx
│   │   │   └── layout.tsx            # Marketing-Shell
│   │   ├── (auth)/                   # Auth-Pages
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/                    # Auth-protected
│   │   │   ├── dashboard/page.tsx    # Post-Login-Dashboard mit KI-Dialog
│   │   │   ├── atlas/page.tsx        # GPA
│   │   │   ├── deltat/page.tsx       # DeltaT
│   │   │   ├── projects/page.tsx
│   │   │   ├── admin/
│   │   │   │   └── feedback/page.tsx # Admin-only
│   │   │   └── layout.tsx            # App-Shell
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   └── chat/route.ts     # KI-Assistent (streamText, claude-haiku)
│   │   │   └── feedback/route.ts     # Feedback API Route
│   │   ├── manifest.ts               # PWA-Manifest (Next.js-nativ)
│   │   ├── globals.css
│   │   └── layout.tsx                # Root Layout
│   │
│   ├── apps/                         # Modulare In-Apps
│   │   ├── gpa/
│   │   │   ├── components/
│   │   │   ├── store/
│   │   │   ├── data/
│   │   │   └── index.tsx
│   │   ├── deltat/
│   │       ├── components/
│   │       ├── calc/                 # Pure Logic + Unit-Tests
│   │       │   ├── system.ts
│   │       │   └── system.test.ts
│   │       ├── store/
│   │       └── index.tsx
│   │   └── dashboard/
│   │       └── components/           # AiDialog.tsx
│   ├── core/
│   │   ├── auth/                     # useAuth, RequireAuth
│   │   ├── api/                      # REST-Client, GitHub-Sync-Helper
│   │   ├── store/                    # useWorkspaceStore (App-übergreifend)
│   │   ├── ui/                       # shadcn/ui + Shared (ParamSlider, FeedbackModal)
│   │   └── layout/                   # AppShell, Header, Footer
│   ├── lib/
│   │   ├── feedback/                 # github-sync
│   │   └── supabase/                 # client.ts + server.ts
│   ├── middleware.ts
│   ├── sw.ts                         # Service Worker (@serwist/next)
│   └── types/
│       └── supabase.ts               # Generierte Typen
│
├── supabase/
│   └── migrations/                   # SQL-Migrations (profiles, feedback, projects)
│
├── public/
│   ├── icons/                        # PWA-Icons
│   └── sw.js                         # Generierter Service Worker (build-time)
│
├── nginx/
│   └── nginx.conf                    # SPA-Fallback + Security-Headers
│
├── .env.example
├── .gitignore
├── Dockerfile                        # Multi-Stage für Hetzner
├── docker-compose.yml                # App + Postgres + Backups
├── next.config.ts                    # output: 'standalone' + @serwist/next
├── components.json                   # shadcn/ui config
├── package.json
├── tsconfig.json
├── BRIEF.md                          # Produktvision
├── Tasks.md                          # Backlog
├── README.md                         # Du bist hier
├── CLAUDE.md                         # Konventionen
├── PLAUSI_CHECK.md                   # Wiss. Formelprüfung
└── feedback.md                       # Feedback-Stream
```

---

## 🔐 Auth-Flow

```
┌──────────────┐
│  Component   │
└──────┬───────┘
       │ useAuth()
       ▼
┌──────────────┐
│ AuthProvider │ ← einziger Ort, wo Supabase/Keycloak importiert wird
└──────┬───────┘
       │
       ▼
┌──────────────┐          ┌──────────────┐
│  Supabase    │   oder   │   Keycloak   │
│  (heute)     │          │  (Hetzner)   │
└──────────────┘          └──────────────┘
```

**Regel:** Keine Komponente ruft `supabase.auth.*` direkt auf. Immer über `useAuth()`.

Unterstützte Flows: Email/Password, Magic-Link, Passwort-Reset, Email-Verification. Später: SSO für Enterprise.

---

## 💬 Feedback-System

**Kernprinzip:** Jedes Feedback landet strukturiert in der `feedback.md` im Repo. Claude Code liest diese Datei bei jedem Session-Start und schlägt priorisierte Arbeitspakete vor.

### Flow

```
User (eingeloggt)
   │ klickt Feedback-Button
   ▼
FeedbackModal (Dropdown: in_app, category + Text + Sterne)
   │ POST /api/feedback (Auth-JWT)
   ▼
Server Action /app/api/feedback/route.ts
   │                         │
   ▼                         ▼
Supabase feedback-Tabelle    GitHub Contents API
(mit E-Mail, RLS)            PUT /contents/feedback.md
                             (Token SERVER-ONLY!)
```

### Format von `feedback.md`

```markdown
## 2026-05-10T14:32:00Z · gpa · ui-design · [offen]
**Nutzer:** clemens@vencly.com
**Version:** v2026.W19.1432
**Sterne:** ★★★☆☆
**Gerät:** Chrome 127 / macOS

> Die Legende verdeckt auf Mobile den halben Bildschirm.

---
```

**Status-Tags:** `[offen]` → `[triage]` → `[in-arbeit]` → `[erledigt]` / `[wontfix]`

### SessionStart-Hook installieren

```bash
mkdir -p .claude/hooks
cat > .claude/hooks/session-start.sh <<'EOF'
#!/bin/bash
[ ! -f feedback.md ] && exit 0
OFFEN=$(grep -c '^## .*\[offen\]' feedback.md 2>/dev/null || echo 0)
TRIAGE=$(grep -c '^## .*\[triage\]' feedback.md 2>/dev/null || echo 0)
[ "$OFFEN" -eq 0 ] && [ "$TRIAGE" -eq 0 ] && exit 0
echo "📬 $OFFEN offene + $TRIAGE triage Feedback-Items in feedback.md."
echo "Bitte lies die Datei und schlage priorisierte Arbeitspakete (S/M/L) vor."
EOF
chmod +x .claude/hooks/session-start.sh
```

### DSGVO
Repo ist **privat** → E-Mails dürfen in `feedback.md` (Art. 5 Datenminimierung gewahrt). Consent-Checkbox im Modal. Löschanfragen via Admin-Dashboard `/admin/feedback`.

**Kritisch:** `GITHUB_FEEDBACK_TOKEN` ist **server-only**, niemals im Frontend-Bundle!

---

## 🚚 Migration Vercel/Supabase → Hetzner

Der Migrationspfad ist Teil des Designs. Ab M6 ist der Stack Docker-ready.

### Schritt-für-Schritt

```bash
# 1. Hetzner VM (CX22 oder größer)
ssh root@hetzner
apt update && apt install -y docker.io docker-compose-plugin

# 2. Repo klonen
git clone https://github.com/cryptoclemens/geotherm.git
cd geotherm

# 3. Production-Env
cat > .env.production <<EOF
NEXT_PUBLIC_SUPABASE_URL=https://db.geotherm.vencly.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GITHUB_FEEDBACK_TOKEN=...
GITHUB_FEEDBACK_REPO=cryptoclemens/geotherm
DATABASE_URL=postgresql://geotherm:PASS@db:5432/geotherm
EOF

# 4. Stack starten
docker compose --env-file .env.production up -d

# 5. DNS umstellen (CNAME → Hetzner-IP)
# 6. Let's Encrypt via Traefik oder Caddy

# 7. Supabase-Daten migrieren
pg_dump $SUPABASE_CONN > /tmp/supabase.sql
psql $LOCAL_CONN < /tmp/supabase.sql
```

Detaillierte Anleitung: `docs/HETZNER_MIGRATION.md` *(geplant)*

---

## 🧪 Testing

```bash
npm test                      # Vitest Unit-Tests
npm test -- --watch           # Watch-Mode
npm test -- --coverage        # Coverage-Report
npm run test:e2e              # Playwright E2E (ab M7)
```

**Wichtige Suites:**
- `src/apps/deltat/calc/system.test.ts` — 46 Testfälle, Scientist-Agent validiert (PLAUSI_CHECK.md)
- `src/core/auth/useAuth.test.ts` — Auth-Flows
- `src/lib/feedback/parser.test.ts` — Feedback.md Parsing

---

## 📝 Contributing

### Git Workflow
- `main` — produktiv, Auto-Deploy
- `feature/*` — neue Features
- `fix/*` — Bugfixes
- `docs/*` — nur Doku

### Commit-Style (Deutsch)
```
feat: Feedback-Modal mit Dropdown-Logik
fix: Dubletten-Anzahl berücksichtigt WP-Beitrag
docs: README Migrations-Sektion ergänzt
refactor: ParamSlider nach core/ui verschoben
test: Unit-Tests für calculateSystem (20 Fälle)
chore: Tailwind auf 4.2 aktualisiert
```

### Code-Style
- 2 Spaces, Single Quotes, Trailing Commas, **keine** Semikolons
- TypeScript strict mode
- Komponenten als `function Comp()`, nicht `const`
- Deutsche Variablennamen für fachliche Dinge (`tiefe`, `berechneLeistung`), Englisch für Technisches

### PRs
- Gegen `main`, mit Beschreibung („Was" + „Warum")
- Screenshots bei UI-Änderungen
- Unit-Tests für neue Logik
- Keine PRs ohne grüne CI

---

## 📚 Wissenschaftliche Basis

| Referenz | Anwendung |
|---|---|
| **VDI 4640** Blatt 1–4 | Thermische Nutzung des Untergrundes |
| **EN 14511** | Leistungsdefinition Wärmepumpen |
| **Gringarten & Sauty (1975)** | Durchbruchszeit für Dubletten (J. Geophys. Res.) |
| **Arpagaus et al. (2018)** | Hochtemperatur-WP Klassifikation |
| **Zühlsdorf et al. (2019)** | Ultra-HT-WP / ORC |
| **DVGW W 115** | Werkstoffauswahl Thermalwasser |
| **IEA HPP Annex 35** | Reale COP vs. Carnot |
| **VDI Wärmeatlas** (2019) | LMTD & U-Wert |
| **DIN 4030** | Scaling-Bewertung |

Vollständiger Review: `PLAUSI_CHECK.md`.

---

## ⚠ Disclaimer

Geotherm liefert **Vorauslegung auf Machbarkeitsebene**. Für Investitionsentscheidungen oder Genehmigungsverfahren zusätzlich erforderlich:

- Hydrogeologisches Gutachten mit Wasseranalyse
- 3D-Simulation (FEFLOW, TOUGH2 oder COMSOL)
- Standortspezifische Untersuchungen
- Detaillierte Wirtschaftlichkeitsrechnung

Dieser Hinweis ist auf jeder Rechner-Seite im UI prominent sichtbar.

---

## 📄 Lizenz & Impressum

**vencly GmbH**
Leopoldstraße 31, 80802 München
HRB 290524 (AG München) · USt-ID: DE367131457
Vertretungsberechtigt: Clemens Eugen Theodor Pompeÿ
📧 [hello@vencly.com](mailto:hello@vencly.com) · 🌐 [www.vencly.com](https://www.vencly.com)

**Proprietäre Software.**

---

## 🔗 Verwandte Repositories

- **Vorgänger 1:** [cryptoclemens/vencly-delta-t](https://github.com/cryptoclemens/vencly-delta-t) — Single-File-HTML *(wird nach Migration archiviert)*
- **Vorgänger 2:** [cryptoclemens/geopotatlas](https://github.com/cryptoclemens/geopotatlas) — Vite + React, Passwort-Gate *(wird nach Migration archiviert)*

---

Built with ♥ by [Vencly](https://www.vencly.com) using [Claude Code](https://claude.com/claude-code)
