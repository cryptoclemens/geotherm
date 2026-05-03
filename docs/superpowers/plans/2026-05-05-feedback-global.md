# Feedback-Feature Global – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Feedback-Modal sitewide für alle eingeloggten Nutzer verfügbar machen, mit automatischer In-App-Vorauswahl basierend auf dem aktuellen Pfad.

**Architecture:** Ein neuer Client-Wrapper `FeedbackTrigger` liest `usePathname()` und leitet `defaultInApp` ab. Er wird einmalig in `(app)/layout.tsx` eingebunden. Die bisherigen `<FeedbackModal>`-Einbindungen in den drei App-Entries werden entfernt. Parallel werden ein DB-Constraint-Bug und ein API-Schema-Bug behoben.

**Tech Stack:** Next.js 15 App Router · TypeScript · Supabase Postgres · Vitest

---

## File Map

| Aktion | Datei | Was |
|---|---|---|
| Create | `src/core/ui/FeedbackTrigger.tsx` | Client-Wrapper, mappt Pathname → defaultInApp |
| Create | `src/core/ui/FeedbackTrigger.test.ts` | Unit-Test für deriveInApp() |
| Create | `supabase/migrations/20260503_007_feedback_bohrkost.sql` | bohrkost zur in_app-Constraint |
| Modify | `src/app/api/feedback/route.ts:6` | bohrkost ins Zod-Schema |
| Modify | `src/app/(app)/layout.tsx` | FeedbackTrigger einbinden |
| Modify | `src/apps/gpa/index.tsx:16,149` | FeedbackModal-Import + -Nutzung entfernen |
| Modify | `src/apps/deltat/index.tsx:13,172` | FeedbackModal-Import + -Nutzung entfernen |
| Modify | `src/apps/bohrkost/index.tsx:6,276` | FeedbackModal-Import + -Nutzung entfernen |
| Modify | `.env.example` | GITHUB_FEEDBACK_TOKEN + GITHUB_FEEDBACK_REPO dokumentieren |

---

### Task 1: DB-Migration — bohrkost zur in_app-Constraint hinzufügen

**Files:**
- Create: `supabase/migrations/20260503_007_feedback_bohrkost.sql`

Die bestehende Migration `20260411_002_feedback.sql` hat `in_app IN ('allgemein','gpa','deltat','docs')` — `bohrkost` fehlt. Das führt zu einem DB-Fehler beim Einreichen von Bohrkost-Feedback.

- [ ] **Step 1: Migration-Datei anlegen**

Erstelle `supabase/migrations/20260503_007_feedback_bohrkost.sql` mit:

```sql
-- Migration: bohrkost zu feedback.in_app-Constraint ergänzen
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_in_app_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_in_app_check
  CHECK (in_app IN ('allgemein', 'gpa', 'deltat', 'bohrkost', 'docs'));
```

- [ ] **Step 2: Migration anwenden**

```bash
cd /root/geotherm
npx supabase db push
```

Expected: `Applying migration 20260503_007_feedback_bohrkost.sql... done`

Falls der Befehl fehlschlägt, weil Supabase lokal nicht läuft: Migration wird beim nächsten `supabase db push` auf der Remote-Instanz angewendet. Weiter mit Step 3.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260503_007_feedback_bohrkost.sql
git commit -m "fix: bohrkost zu feedback.in_app-Constraint ergänzen"
```

---

### Task 2: API-Route — bohrkost ins Zod-Schema

**Files:**
- Modify: `src/app/api/feedback/route.ts:6-12`

Das Zod-Schema in der Route hat `inApp: z.enum(['allgemein', 'gpa', 'deltat', 'docs'])` — `bohrkost` fehlt, was zu HTTP 400 bei Bohrkost-Feedback führt.

- [ ] **Step 1: Schema in route.ts anpassen**

Datei: `src/app/api/feedback/route.ts`, Zeilen 6–12. Ändere das Schema so:

```ts
const schema = z.object({
  inApp: z.enum(['allgemein', 'gpa', 'deltat', 'bohrkost', 'docs']),
  category: z.enum(['bug', 'ui-design', 'feature-wunsch', 'performance', 'datenqualitaet', 'sonstiges']),
  stars: z.number().int().min(1).max(5).nullable(),
  message: z.string().min(5).max(2000),
  consent: z.boolean().refine(v => v, 'Consent erforderlich'),
})
```

- [ ] **Step 2: TypeCheck**

```bash
cd /root/geotherm && npm run typecheck
```

Expected: keine Fehler

- [ ] **Step 3: Commit**

```bash
git add src/app/api/feedback/route.ts
git commit -m "fix: bohrkost ins Feedback-API-Schema aufnehmen"
```

---

### Task 3: FeedbackTrigger — Client-Wrapper mit Pathname-Mapping

**Files:**
- Create: `src/core/ui/FeedbackTrigger.tsx`
- Create: `src/core/ui/FeedbackTrigger.test.ts`

`deriveInApp` wird als exportierte Funktion implementiert, damit sie testbar ist ohne `usePathname()` mocken zu müssen.

- [ ] **Step 1: Test zuerst schreiben**

Erstelle `src/core/ui/FeedbackTrigger.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { deriveInApp } from './FeedbackTrigger'

describe('deriveInApp', () => {
  it('gibt gpa zurück für /atlas', () => {
    expect(deriveInApp('/atlas')).toBe('gpa')
  })

  it('gibt gpa zurück für /atlas/details', () => {
    expect(deriveInApp('/atlas/details')).toBe('gpa')
  })

  it('gibt deltat zurück für /deltat', () => {
    expect(deriveInApp('/deltat')).toBe('deltat')
  })

  it('gibt bohrkost zurück für /bohrkost', () => {
    expect(deriveInApp('/bohrkost')).toBe('bohrkost')
  })

  it('gibt allgemein zurück für /dashboard', () => {
    expect(deriveInApp('/dashboard')).toBe('allgemein')
  })

  it('gibt allgemein zurück für /projects', () => {
    expect(deriveInApp('/projects')).toBe('allgemein')
  })

  it('gibt allgemein zurück für /', () => {
    expect(deriveInApp('/')).toBe('allgemein')
  })
})
```

- [ ] **Step 2: Test ausführen — muss fehlschlagen**

```bash
cd /root/geotherm && npm test -- FeedbackTrigger
```

Expected: FAIL mit "Cannot find module './FeedbackTrigger'"

- [ ] **Step 3: FeedbackTrigger implementieren**

Erstelle `src/core/ui/FeedbackTrigger.tsx`:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { FeedbackModal } from './FeedbackModal'

type InApp = 'allgemein' | 'gpa' | 'deltat' | 'bohrkost' | 'docs'

export function deriveInApp(pathname: string): InApp {
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

- [ ] **Step 4: Test ausführen — muss grün sein**

```bash
cd /root/geotherm && npm test -- FeedbackTrigger
```

Expected: 7 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/core/ui/FeedbackTrigger.tsx src/core/ui/FeedbackTrigger.test.ts
git commit -m "feat: FeedbackTrigger mit pathname-basierter In-App-Vorauswahl"
```

---

### Task 4: Layout — FeedbackTrigger global einbinden

**Files:**
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: FeedbackTrigger in layout.tsx einbinden**

Aktuelle Datei `src/app/(app)/layout.tsx`:

```tsx
import { AppShell } from '@/core/layout/AppShell'
import { RequireAuth } from '@/core/auth/RequireAuth'
import { SwCleanup } from '@/app/sw-cleanup'
import { QueryProvider } from '@/core/providers/QueryProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <RequireAuth>
        <SwCleanup />
        <AppShell>{children}</AppShell>
      </RequireAuth>
    </QueryProvider>
  )
}
```

Ersetze den gesamten Inhalt durch:

```tsx
import { AppShell } from '@/core/layout/AppShell'
import { RequireAuth } from '@/core/auth/RequireAuth'
import { SwCleanup } from '@/app/sw-cleanup'
import { QueryProvider } from '@/core/providers/QueryProvider'
import { FeedbackTrigger } from '@/core/ui/FeedbackTrigger'

export default function AppLayout({ children }: { children: React.ReactNode }) {
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

- [ ] **Step 2: TypeCheck**

```bash
cd /root/geotherm && npm run typecheck
```

Expected: keine Fehler

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/layout.tsx
git commit -m "feat: FeedbackTrigger global in App-Layout eingebunden"
```

---

### Task 5: Cleanup — FeedbackModal aus App-Entries entfernen

**Files:**
- Modify: `src/apps/gpa/index.tsx`
- Modify: `src/apps/deltat/index.tsx`
- Modify: `src/apps/bohrkost/index.tsx`

Da `FeedbackTrigger` jetzt global im Layout sitzt, würde ein zweites `FeedbackModal` in den App-Entries zu doppelten Buttons führen.

- [ ] **Step 1: GPA bereinigen**

In `src/apps/gpa/index.tsx`:
- Zeile 16 entfernen: `import { FeedbackModal } from '@/core/ui/FeedbackModal'`
- Zeile 149 entfernen: `<FeedbackModal defaultInApp="gpa" />`

- [ ] **Step 2: DeltaT bereinigen**

In `src/apps/deltat/index.tsx`:
- Zeile 13 entfernen: `import { FeedbackModal } from '@/core/ui/FeedbackModal'`
- Zeile 172 entfernen: `<FeedbackModal defaultInApp="deltat" />`

- [ ] **Step 3: Bohrkost bereinigen**

In `src/apps/bohrkost/index.tsx`:
- Zeile 6 entfernen: `import { FeedbackModal } from '@/core/ui/FeedbackModal'`
- Zeile 276 entfernen: `<FeedbackModal defaultInApp="bohrkost" />`

- [ ] **Step 4: Lint + TypeCheck + Tests**

```bash
cd /root/geotherm && npm run lint && npm run typecheck && npm test
```

Expected: alles grün, keine ungenutzten Import-Warnungen

- [ ] **Step 5: Commit**

```bash
git add src/apps/gpa/index.tsx src/apps/deltat/index.tsx src/apps/bohrkost/index.tsx
git commit -m "refactor: FeedbackModal aus App-Entries entfernt (jetzt global im Layout)"
```

---

### Task 6: Env-Vars — GitHub-Sync konfigurieren

**Files:**
- Modify: `.env.example`
- Modify: `/root/deploy/geotherm/.env` (außerhalb des Git-Repos, kein Commit)

- [ ] **Step 1: .env.example dokumentieren**

Füge am Ende von `.env.example` hinzu:

```bash
# Feedback → GitHub-Sync (server-only, NIEMALS NEXT_PUBLIC_ Prefix!)
# GitHub PAT (classic) mit Scope: repo → Settings → Developer settings → Personal access tokens
GITHUB_FEEDBACK_TOKEN=
GITHUB_FEEDBACK_REPO=cryptoclemens/geotherm
```

- [ ] **Step 2: GitHub Personal Access Token anlegen**

Öffne: https://github.com/settings/tokens/new
- Note: `geotherm-feedback`
- Expiration: 1 year
- Scope: `repo` (alle Checkboxen unter "repo" ankreuzen)
- → "Generate token" → Token kopieren

- [ ] **Step 3: Token in Self-hosted .env setzen**

```bash
# /root/deploy/geotherm/.env — NICHT committen!
echo 'GITHUB_FEEDBACK_TOKEN=<dein-token>' >> /root/deploy/geotherm/.env
echo 'GITHUB_FEEDBACK_REPO=cryptoclemens/geotherm' >> /root/deploy/geotherm/.env
```

Verifizieren:
```bash
grep GITHUB_FEEDBACK /root/deploy/geotherm/.env
```
Expected: beide Zeilen sichtbar

- [ ] **Step 4: Token in Vercel setzen**

```bash
cd /root/geotherm
vercel env add GITHUB_FEEDBACK_TOKEN production
# → Token eingeben wenn gefragt
vercel env add GITHUB_FEEDBACK_REPO production
# → cryptoclemens/geotherm eingeben
```

- [ ] **Step 5: Docker-Container neu bauen (Self-hosted)**

```bash
cd /root/deploy/geotherm
docker compose build && docker compose up -d
```

Expected: Container startet, keine Fehler in `docker compose logs geotherm-app`

- [ ] **Step 6: .env.example committen**

```bash
cd /root/geotherm
git add .env.example
git commit -m "docs: GITHUB_FEEDBACK_TOKEN + GITHUB_FEEDBACK_REPO in .env.example"
```

---

### Task 7: Finaler Check + Push

- [ ] **Step 1: Alle Tests grün**

```bash
cd /root/geotherm && npm run lint && npm run typecheck && npm test
```

Expected: 0 Fehler, alle Tests grün

- [ ] **Step 2: Push**

```bash
git push origin main
```

Expected: Vercel-Deploy startet automatisch

- [ ] **Step 3: Smoke-Test auf geotherm.vencly.com**

- Einloggen auf https://geotherm.vencly.com
- `/dashboard` öffnen → Feedback-Button rechts unten sichtbar, Dropdown zeigt "Allgemein" vorausgewählt
- `/atlas` öffnen → Dropdown zeigt "GPA – Atlas" vorausgewählt
- `/deltat` öffnen → Dropdown zeigt "DeltaT – Rechner" vorausgewählt
- `/bohrkost` öffnen → Dropdown zeigt "Bohrkosten – Rechner" vorausgewählt
- Feedback absenden → keine 400/500-Fehler in Browser-Konsole
- `feedback.md` im GitHub-Repo prüfen → neuer Eintrag vorhanden
