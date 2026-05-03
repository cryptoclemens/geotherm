# Feedback-Feature Global – Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Das bestehende Feedback-Modal sitewide für alle eingeloggten Nutzer verfügbar machen — auf jeder Seite unter `geotherm.vencly.com`, mit automatischer Vorauswahl der richtigen In-App basierend auf der aktuellen URL.

**Architecture:** Ein Client-Wrapper `FeedbackTrigger` liest `usePathname()` und mappt den Pfad auf `defaultInApp`. Er wird einmalig im `(app)/layout.tsx` eingebunden. Die bestehenden `<FeedbackModal>`-Einbindungen in den drei App-Entries werden entfernt. Zwei Bugs (DB-Constraint, API-Schema) werden gleichzeitig behoben.

**Tech Stack:** Next.js 15 App Router · TypeScript · Supabase (Postgres + RLS) · GitHub Contents API

---

## Scope

### Im Scope

1. `FeedbackTrigger` Client-Wrapper — mappt Pathname → `defaultInApp`
2. `FeedbackTrigger` in `(app)/layout.tsx` einbinden
3. `<FeedbackModal>` aus GPA, DeltaT, Bohrkost entfernen
4. DB-Migration: `bohrkost` in `in_app`-Constraint ergänzen
5. API-Route und FeedbackModal Zod-Schema: `bohrkost` ergänzen
6. Umgebungsvariablen `GITHUB_FEEDBACK_TOKEN` + `GITHUB_FEEDBACK_REPO` konfigurieren (`.env` + Vercel)

### Außerhalb des Scopes

- Admin-Dashboard (`/admin/feedback`) — bleibt Stub
- Feedback für nicht-eingeloggte Nutzer (Landing Page, Legal etc.)
- Feedback-Benachrichtigungen / E-Mail-Alerts

---

## Komponenten

### `src/core/ui/FeedbackTrigger.tsx` (neu)

Client Component. Liest `usePathname()`, leitet `defaultInApp` ab, rendert `<FeedbackModal>`.

**Pathname-Mapping:**

| Pathname beginnt mit | `defaultInApp` |
|---|---|
| `/atlas` | `gpa` |
| `/deltat` | `deltat` |
| `/bohrkost` | `bohrkost` |
| alle anderen | `allgemein` |

```tsx
'use client'
import { usePathname } from 'next/navigation'
import { FeedbackModal } from './FeedbackModal'

type InApp = 'allgemein' | 'gpa' | 'deltat' | 'bohrkost' | 'docs'

function deriveInApp(pathname: string): InApp {
  if (pathname.startsWith('/atlas')) return 'gpa'
  if (pathname.startsWith('/deltat')) return 'deltat'
  if (pathname.startsWith('/bohrkost')) return 'bohrkost'
  return 'allgemein'
}

export function FeedbackTrigger() {
  const pathname = usePathname()
  return <FeedbackModal defaultInApp={deriveInApp(pathname)} />
}
```

### `src/app/(app)/layout.tsx` (ändern)

`<FeedbackTrigger />` am Ende des `<AppShell>`-Inhalts einfügen:

```tsx
import { FeedbackTrigger } from '@/core/ui/FeedbackTrigger'

export default function AppLayout({ children }) {
  return (
    <QueryProvider>
      <RequireAuth>
        <SwCleanup />
        <AppShell>{children}</AppShell>
        <FeedbackTrigger />
      </RequireAuth>
    </QueryProvider>
  )
}
```

### `src/apps/gpa/index.tsx`, `src/apps/deltat/index.tsx`, `src/apps/bohrkost/index.tsx` (ändern)

`import { FeedbackModal }` und `<FeedbackModal ... />` jeweils entfernen.

---

## Datenbankfix

### `supabase/migrations/20260503_007_feedback_bohrkost.sql` (neu)

```sql
-- Migration: bohrkost zu feedback.in_app-Constraint hinzufügen
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_in_app_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_in_app_check
  CHECK (in_app IN ('allgemein', 'gpa', 'deltat', 'bohrkost', 'docs'));
```

Migration wird via `supabase db push` auf der laufenden Supabase-Instanz angewendet.

---

## API & Schema-Fix

### `src/app/api/feedback/route.ts` (ändern)

```ts
const schema = z.object({
  inApp: z.enum(['allgemein', 'gpa', 'deltat', 'bohrkost', 'docs']),  // bohrkost ergänzt
  ...
})
```

### `src/core/ui/FeedbackModal.tsx` (ändern)

`IN_APP_OPTIONS` und Zod-Schema bereits korrekt (`bohrkost` ist drin). Keine Änderung nötig.

---

## GitHub-Sync Konfiguration

### Erforderliche Env-Vars

| Variable | Wert | Wo setzen |
|---|---|---|
| `GITHUB_FEEDBACK_TOKEN` | GitHub PAT (classic, Scope: `repo`) | `/root/deploy/geotherm/.env` + Vercel |
| `GITHUB_FEEDBACK_REPO` | `cryptoclemens/geotherm` | `/root/deploy/geotherm/.env` + Vercel |

### Token erstellen

GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
- Note: `geotherm-feedback`
- Scope: `repo` (Full control of private repositories)
- Expiration: nach Bedarf (z.B. 1 Jahr)

Der Token wird **nicht** ins Git-Repository eingecheckt. Nur in `.env` (gitignored) und Vercel-Umgebungsvariablen.

### `github-sync.ts` — kein Codechange nötig

`appendToFeedbackMd()` liest bereits `process.env.GITHUB_FEEDBACK_TOKEN` und `process.env.GITHUB_FEEDBACK_REPO`. Gibt `false` zurück wenn nicht gesetzt (graceful degradation).

---

## Datenfluss

```
Nutzer klickt "Feedback" → FeedbackModal öffnet sich
  → onSubmit → POST /api/feedback
    → Auth-Check (Supabase)
    → Zod-Validierung
    → INSERT INTO feedback (Supabase)
    → appendToFeedbackMd() → GitHub Contents API PUT → feedback.md aktualisiert
    → { ok: true }
```

---

## Fehlerbehandlung

- GitHub-Sync schlägt lautlos fehl wenn Token fehlt oder GitHub nicht erreichbar (`appendToFeedbackMd` gibt `false` zurück, kein 500)
- DB-Fehler → HTTP 500 an Client
- Nicht eingeloggt → HTTP 401; `FeedbackModal` rendert `null` wenn kein User

---

## Deployment

1. Code-Änderungen committen + pushen → Vercel-Deploy automatisch
2. `GITHUB_FEEDBACK_TOKEN` + `GITHUB_FEEDBACK_REPO` in Vercel Env setzen
3. Migration auf Self-hosted Supabase anwenden: `supabase db push`
4. Docker-Container neu bauen (Self-hosted): `docker compose build && docker compose up -d`
