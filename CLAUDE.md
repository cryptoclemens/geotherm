# CLAUDE.md – Arbeitsanleitung für Claude Code (Geotherm)

Dieses Dokument wird bei jeder Claude-Code-Session automatisch geladen. Es enthält die Architektur-Regeln, Konventionen und kritischen Do's & Don'ts für das Geotherm-Projekt.

---

## 📖 Erste Schritte einer Session

1. **Hook prüft `feedback.md`** – `.claude/hooks/session-start.sh` läuft automatisch und zählt offene + triage Items.
2. **Bei offenen Items:** Lies `feedback.md` vollständig, priorisiere nach Impact + App-Zugehörigkeit, gruppiere zu Arbeitspaketen mit S/M/L-Schätzung, präsentiere dem User.
3. **Bei keinem offenen Feedback:** Fahre mit aktuellem Tasks.md-Milestone fort.
4. **Vor jedem Code-Change:** BRIEF.md + Tasks.md überfliegen, um Kontext und Priorität zu checken.

---

## 🏗 Projektübersicht (Kurzfassung)

**Geotherm** = modulare Geothermie-Suite unter `geotherm.vencly.com`. Zwei In-Apps zum Start:
- **GPA** – Geothermie-Potenzial-Atlas (Karte) – Migration aus `geopotatlas`
- **DeltaT** – Dubletten-Auslegungsrechner – Migration aus `vencly-delta-t`

**Stack:** Next.js 15 App Router · TypeScript · shadcn/ui · Tailwind 4 · Zustand · TanStack Query · Supabase Auth+Postgres · MDX · PWA (@serwist/next) · Vitest + Playwright

**Details:** Siehe `BRIEF.md` für Produktvision, `README.md` für Tech-Setup.

---

## 📂 Architektur-Regeln

### Verzeichnisstruktur – unverhandelbar

- **In-Apps** leben IMMER unter `src/apps/{name}/`, NIEMALS direkt unter `app/` oder `src/`
- **Jede In-App** hat: `components/`, `store/`, `index.tsx` (Entry), optional `calc/` für Pure Logic, `data/` für statische Daten
- **Shared Code** in `src/core/`:
  - `auth/` — `useAuth()`, AuthProvider, RequireAuth
  - `api/` — REST-Client, GitHub-Sync-Helper
  - `ui/` — shadcn/ui Components + eigene Shared Components (z.B. `ParamSlider`)
  - `layout/` — Header, Footer, AppShell
- **Editierbarer Content** (Legal, Marketing) als MDX unter `content/` — ohne Code-Deploy änderbar
- **Next.js Routes** unter `app/` in Route Groups: `(marketing)`, `(auth)`, `(app)`

### Keine direkten Supabase-Imports
```tsx
// ❌ FALSCH
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)
const { user } = await supabase.auth.getUser()

// ✅ RICHTIG
import { useAuth } from '@/core/auth/useAuth'
function MyComponent() {
  const { user, signIn, signOut } = useAuth()
}
```
Begründung: Migration zu Keycloak auf Hetzner muss in < 1 Tag möglich sein.

### Keine hardcoded URLs
Alle Backend-Endpunkte via `process.env.NEXT_PUBLIC_*` (Frontend) oder `process.env.*` (Server-only).

### Kein `any` in TypeScript
ESLint-Regel ist strict. Nutze `unknown` + Type Guards wenn Type nicht bekannt ist.

---

## 🎨 Code-Konventionen

- **TypeScript** strict mode, keine `any`
- **2 Spaces**, Single Quotes, Trailing Commas, **keine Semikolons** (ESLint)
- **Komponenten** als `function Comp()`, nicht `const Comp = () =>`
- **Deutsch für fachliche Namen** (`tiefe`, `maechtig`, `berechneLeistung`), **Englisch für Technisches** (`handleClick`, `useAuth`)
- **JSX-Reihenfolge**: Hooks → Handlers → Effects → Return
- **Props-Interfaces** für alle Komponenten:
  ```tsx
  interface KpiTileProps {
    label: string
    value: number | string
    unit?: string
    color?: 'green' | 'yellow' | 'red' | 'navy'
  }
  function KpiTile({ label, value, unit, color = 'navy' }: KpiTileProps) { ... }
  ```
- **Dateiendungen:** `.tsx` für Komponenten, `.ts` für Logik, `.mdx` für Content
- **shadcn/ui** via `npx shadcn@latest add <component>` installieren — landet in `src/core/ui/`
- **Server Components** bevorzugen, Client Components nur bei Interaktivität (`'use client'`)

---

## 🧪 Testing-Regeln

- **Vitest** für Unit-Tests
- **Jede neue Berechnungslogik** in `src/apps/*/calc/` braucht mindestens 3 Test-Cases + Edge Cases
- **Coverage-Ziel** 80 % für `src/apps/*/calc/` und `src/core/`
- **E2E-Tests** (Playwright) erst ab M7, vorher nicht
- **`npm test`** muss vor jedem Commit grün sein
- **Keine Snapshot-Tests** für Komponenten (zu fragil)

---

## 💬 Feedback-System – Kritische Regeln

### `feedback.md` ist Single Source of Truth
- **Wird automatisch befüllt** vom Feedback-Modal via Server Action
- **Manuell nur** für Status-Updates und Bearbeitungs-Kommentare editieren
- **Status-Tags:** `[offen]` → `[triage]` → `[in-arbeit]` → `[erledigt]` / `[wontfix]`

### Bei Bearbeitung eines Items
1. Status `[offen]` → `[in-arbeit]`, commit
2. Fix implementieren + Tests
3. Commit mit Referenz zum Feedback-Item (z.B. `fix: Legende mobile — adressiert Feedback 2026-05-10T14:32`)
4. Status `[in-arbeit]` → `[erledigt]`, Bearbeitungs-Kommentar am Item:
   ```
   **Bearbeitung:** Fix in Commit abc1234 (Session 2026-05-15)
   ```

### Niemals
- Feedback-Items **löschen** (nur Status ändern, außer DSGVO-Löschanfrage)
- `GITHUB_FEEDBACK_TOKEN` im Frontend-Bundle — **server-only**!
- Feedback-Button ohne Auth-Check rendern

### Bei Session-Start
IMMER zuerst `feedback.md` checken:
```bash
grep -c '^## .*\[offen\]' feedback.md
grep -c '^## .*\[triage\]' feedback.md
```
Wenn > 0 → Triage-Vorschlag präsentieren.

---

## 🚚 Migrations-Leitplanken (Vercel → Hetzner)

### Nie nutzen
- Supabase-spezifische Features (Realtime-Subscriptions, Storage-Buckets, Edge Functions)
- Vercel-spezifische APIs (`@vercel/kv`, `@vercel/blob`, `@vercel/postgres`)
- Proprietäre Extensions in Postgres

### Immer
- `next.config.js` mit `output: 'standalone'`
- Dockerfile + docker-compose.yml bei strukturellen Änderungen mit-committen
- Neue Env-Vars in `.env.example` dokumentieren
- DB-Schema als pure SQL-Migrations (keine Supabase-Dashboard-Änderungen)

---

## 📝 Git-Workflow

### Branches
- `main` — produktiv, Auto-Deploy via Vercel
- `feature/{kurzbeschreibung}` — neue Features
- `fix/{kurzbeschreibung}` — Bugfixes
- `docs/{kurzbeschreibung}` — nur Doku

### Commit-Messages (Deutsch, Conventional Commits)
```
feat: Feedback-Modal mit Dropdown-Logik implementiert
fix: Dubletten-Anzahl berücksichtigt WP-Beitrag
docs: README Migration-Sektion ergänzt
refactor: ParamSlider nach core/ui verschoben
test: Unit-Tests für calculateSystem (20 Fälle)
chore: Tailwind auf 4.2 aktualisiert
```

### Vor jedem Push
```bash
npm run lint       # ESLint muss grün sein
npm test           # Unit-Tests müssen grün sein
npm run typecheck  # TypeScript-Check muss grün sein
```

### PRs
- Immer gegen `main`, Review-Pflicht ab M2
- Beschreibung mit Was + Warum
- Screenshots bei UI-Änderungen
- **Keine** PRs ohne grüne CI

---

## 🚫 Do's & Don'ts

### ✅ DO
- Neue Features zuerst in Tasks.md priorisieren, dann umsetzen
- Bei Unsicherheit über Scope: User fragen, NICHT raten
- Jede Formel im Rechner-Kern MUSS eine Quellenangabe im Kommentar haben (z.B. `// Drost 1978`)
- Bei jedem Commit: `feedback.md` checken ob ein Item adressiert wird → Status updaten
- MDX-Content für alles was ein Non-Developer ändern könnte
- shadcn/ui-Components nutzen statt eigene Button/Modal/Input zu bauen
- Server Components bevorzugen, Client Components nur bei Bedarf
- Dynamic Import (`next/dynamic`) für schwergewichtige Komponenten wie Leaflet

### ❌ DON'T
- **Keine Formeln ohne Quellenangabe anpassen** — erst im PLAUSI_CHECK.md prüfen
- **Keine eigenen UI-Komponenten** bauen wenn es shadcn/ui dafür gibt
- **Kein CSS-in-JS** (styled-components, emotion) — Tailwind + shadcn reicht
- **Keine Server-Secrets** mit `NEXT_PUBLIC_`-Präfix (würde im Frontend landen!)
- **Kein `useEffect`** für Data-Fetching — TanStack Query nutzen
- **Keine `console.log`** in Production-Code (außer explizit Debug)
- **Keine TODO-Kommentare** ohne zugehöriges Tasks.md-Item
- **Kein direkter `supabase.auth.*`-Aufruf** — immer `useAuth()`

---

## 🔧 Häufige Commands

```bash
# Development
npm run dev                  # Dev-Server auf :3000
npm run build                # Production Build
npm start                    # Production Server

# Code-Qualität
npm run lint                 # ESLint
npm run lint:fix             # Auto-fix
npm run typecheck            # tsc --noEmit
npm test                     # Vitest
npm test -- --watch          # Watch-Mode
npm test -- --coverage       # Coverage

# shadcn/ui
npx shadcn@latest add button dialog form input select textarea dropdown-menu sheet

# Supabase (lokal)
npx supabase start           # Lokale Supabase-Instanz
npx supabase db reset        # Schema neu laden
npx supabase gen types typescript --local > src/types/supabase.ts

# Feedback-Check
grep -c '^## .*\[offen\]' feedback.md
```

---

## 📋 Typische Workflow-Muster

### Muster: Neues Feature implementieren
1. Tasks.md öffnen, Feature priorisieren
2. Feature-Branch: `git checkout -b feature/xyz`
3. Wenn neues Modul: Ordner unter `src/apps/{name}/` oder `src/core/`
4. Komponenten mit TypeScript-Interfaces schreiben
5. Unit-Tests für Logik
6. `npm run lint && npm test && npm run typecheck` grün
7. Commit mit `feat:` Prefix
8. Push, PR, Review, Merge

### Muster: Feedback-Item bearbeiten
1. `feedback.md` öffnen, Item lesen
2. Status `[offen]` → `[in-arbeit]` setzen, commit
3. Fix implementieren + Tests
4. Commit mit Referenz zum Feedback
5. Status `[in-arbeit]` → `[erledigt]`, Kommentar mit Commit-SHA
6. Push

### Muster: Neue In-App hinzufügen
1. Tasks.md: In-App planen + Route definieren
2. `src/apps/{name}/` mit Standard-Struktur anlegen
3. `app/(app)/{name}/page.tsx` mit `dynamic(() => import('@/apps/{name}'))`
4. In-App in `src/core/apps.ts` Registry eintragen
5. Navigation im Header erweitern
6. Legal-Hinweise prüfen (neue Datenverarbeitung?)
7. Tests + Docs

---

## ⚠ Bekannte Gotchas

- **Leaflet + Next.js**: Dynamic Import mit `ssr: false` Pflicht, sonst `window is not defined`
- **Supabase SSR**: `@supabase/ssr` nutzen, nicht `@supabase/supabase-js` direkt in Server Components
- **MDX + App Router**: `@next/mdx` in `next.config.js` konfigurieren
- **Tailwind 4**: Neue Syntax mit `@theme` statt `tailwind.config.js` (tailwindcss.com/docs/v4-beta)
- **shadcn/ui + Tailwind 4**: Noch experimentell — bei Problemen auf Tailwind 3.4 zurückfallen
- **Service Worker (PWA)**: Im Dev-Modus deaktiviert, nur im Build testen
- **`GITHUB_FEEDBACK_TOKEN`**: Niemals im Frontend-Bundle! Nur in Server Actions / Route Handlers.

---

## 🆘 Wenn etwas unklar ist

1. **BRIEF.md** für Produktvision
2. **Tasks.md** für Priorisierung
3. **README.md** für Setup
4. **PLAUSI_CHECK.md** für Formel-Hintergrund
5. **feedback.md** für Nutzer-Prioritäten
6. **Im Zweifel: User fragen statt raten**

---

## 🎯 Prinzipien in einem Satz

> *Baue modular, teste wissenschaftlich, höre auf Nutzer-Feedback, bleibe cloud-agnostisch.*
