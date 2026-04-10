# Tasks – Geotherm by Vencly

**Legende:** ⭐ Blocker · 🔥 Muss · 📦 Soll · 💡 Kann · ⏸ Später

---

## Milestone 0 – Bootstrap (diese Session)

- [x] ⭐ Neues Repo `github.com/cryptoclemens/geotherm` (privat)
- [x] ⭐ BRIEF.md, Tasks.md, README.md, CLAUDE.md, feedback.md, .gitignore
- [ ] ⭐ Initial-Commit nach `main` pushen

**DoD:** Sechs Dateien auf `main`. Neue Claude-Session kann darauf aufbauen.

---

## Milestone 1 – Projekt-Setup & Shell *(Woche 1)*

### 1.1 Next.js 15 initialisieren 🔥
```bash
npx create-next-app@latest geotherm --typescript --tailwind --app --src-dir --import-alias "@/*"
cd geotherm
npx shadcn@latest init
npm install zustand @tanstack/react-query react-hook-form @hookform/resolvers zod lucide-react
npm install @supabase/ssr @supabase/supabase-js
npm install -D vitest @vitejs/plugin-react @testing-library/react jsdom
```

### 1.2 Projektstruktur 🔥
Siehe README.md → Projektstruktur. Wichtig: `app/` für Routes, `src/apps/` für modulare In-Apps, `src/core/` für Shared Code, `content/` für MDX.

### 1.3 Route Groups anlegen 🔥
- `app/(marketing)/` – Landing, Legal (SSG)
- `app/(auth)/` – Login, Signup
- `app/(app)/` – eingeloggte In-Apps

### 1.4 Core-Layout 🔥
- Header mit Vencly-Logo, In-App-Switcher, User-Menü
- Footer mit Legal-Links + Version
- shadcn/ui-Komponenten installieren: button, dialog, form, input, select, textarea, dropdown-menu, sheet

### 1.5 Landing-Page 📦
- Hero "Vom Standort zum Bohrplan"
- In-App-Cards
- CTA "Kostenlos registrieren"

### 1.6 Legal-Seiten-Stubs 🔥
- MDX-Files in `content/legal/` (impressum, datenschutz, agb, security)
- Routen in `app/(marketing)/*/page.tsx`

### 1.7 Config-Files 🔥
- `next.config.js` mit `output: 'standalone'`
- `.env.example` mit allen Env-Vars
- `ESLint + Prettier` (2 Spaces, Single Quotes, keine Semicolons)

**DoD M1:** `npm run dev` läuft, Landing sichtbar, Navigation zu leeren In-App-Stubs funktioniert, Lighthouse ≥ 90 für Landing.

---

## Milestone 2 – Auth & Nutzer-Konto *(Woche 2)*

### 2.1 Supabase-Projekt ⭐
- `geotherm-production` in EU-Frankfurt
- Eigene Instanz (nicht mit Alt-Projekten teilen)
- Email/Password + Magic-Link aktivieren
- Deutsche E-Mail-Templates

### 2.2 Auth-Adapter 🔥
`src/core/auth/useAuth.ts` als **einziger** Zugriffspunkt auf Auth. Niemand darf `supabase.auth.*` direkt importieren.

```tsx
// src/core/auth/useAuth.ts
export function useAuth() {
  return { user, signIn, signUp, signOut, resetPassword, loading }
}
```

### 2.3 Auth-UI 🔥
- `/login` mit E-Mail + Passwort
- `/signup` mit AGB + Datenschutz-Checkboxen
- `/forgot-password`
- `/verify-email`
- `RequireAuth`-Wrapper für protected routes

### 2.4 `profiles`-Tabelle ⭐
```sql
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id),
  email      TEXT UNIQUE NOT NULL,
  full_name  TEXT,
  company    TEXT,
  role       TEXT DEFAULT 'user',   -- user | admin
  tier       TEXT DEFAULT 'free',   -- free | pro | team | enterprise
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "update own" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### 2.5 Middleware 🔥
`middleware.ts` schützt `app/(app)/*` — ungeauthed → `/login`.

### 2.6 Legal-Seiten final ⭐
MDX-Content ausschreiben, aus DeltaT-Impressum übernehmen und für Multi-App-Kontext erweitern.

**DoD M2:** Registrierung + Login + Logout funktionieren. `/impressum`, `/datenschutz`, `/agb`, `/security` sind live.

---

## Milestone 2.5 – Feedback-System *(Woche 2/3)* 💎 NEU

### 2.5.1 Supabase-Tabelle `feedback` ⭐
```sql
CREATE TABLE feedback (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  email         TEXT NOT NULL,
  in_app        TEXT NOT NULL,  -- 'allgemein' | 'gpa' | 'deltat' | 'docs'
  category      TEXT NOT NULL,  -- 'bug' | 'ui-design' | 'feature-wunsch' | 'performance' | 'datenqualitaet' | 'sonstiges'
  stars         INT CHECK (stars BETWEEN 1 AND 5),
  message       TEXT NOT NULL,
  status        TEXT DEFAULT 'offen',  -- 'offen' | 'triage' | 'in-arbeit' | 'erledigt' | 'wontfix'
  app_version   TEXT,
  user_agent    TEXT,
  github_synced BOOLEAN DEFAULT false
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user insert own" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user read own" ON feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admin read all" ON feedback FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### 2.5.2 FeedbackModal-Komponente 🔥
`src/core/ui/FeedbackModal.tsx` mit:
- 2 Dropdowns: `in_app` (GPA / DeltaT / Allgemein / Docs), `category` (Bug / Idee / UI / Performance / Datenqualität / Sonstiges)
- Textarea, Sterne-Rating
- Auto-Capture: E-Mail, Version, User-Agent
- Consent-Checkbox ("Ich stimme zu…")
- Nur sichtbar wenn `useAuth().user` existiert

### 2.5.3 Server Action 🔥
`app/api/feedback/route.ts`:
1. Auth prüfen (JWT in Cookie)
2. Insert in Supabase `feedback`
3. Sync zu `feedback.md` via GitHub Contents API
4. `github_synced = true` nach Erfolg

### 2.5.4 GitHub-Sync-Helper 🔥
`src/lib/feedback/github-sync.ts`:
- GET `/contents/feedback.md` → SHA + Content
- Neuen Eintrag im Markdown-Format anhängen
- PUT `/contents/feedback.md` mit neuem Content + SHA
- Token aus `GITHUB_FEEDBACK_TOKEN` (server-only!)

### 2.5.5 `feedback.md` initialisieren ⭐
Bereits in M0 angelegt. Format siehe README.md.

### 2.5.6 SessionStart-Hook 🔥
`.claude/hooks/session-start.sh`:
```bash
#!/bin/bash
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
```

### 2.5.7 Admin-Dashboard `/admin/feedback` 📦
Nur für `role = 'admin'`:
- Liste aller Feedback-Items
- Status-Änderung
- Delete (für DSGVO-Löschanfragen)
- Filter nach In-App, Kategorie, Status

**DoD M2.5:** Nutzer kann Feedback senden → landet in Supabase + `feedback.md`. SessionStart-Hook zeigt offene Items beim Öffnen der Claude-Session.

---

## Milestone 3 – GPA-Migration *(Woche 3)*

### 3.1 Code übernehmen 🔥
- `github.com/cryptoclemens/geopotatlas/src/*` → `src/apps/gpa/*`
- Vite-spezifisch entfernen: `import.meta.env` → `process.env.NEXT_PUBLIC_*`
- Leaflet/react-leaflet mit Dynamic Import: `const MapView = dynamic(() => import('./MapView'), { ssr: false })`
- **Passwort-Gate entfernen** — durch `RequireAuth` ersetzt
- PrintDialog, FeedbackModal, BootLog → Core-Versionen nutzen

### 3.2 Route registrieren 🔥
`app/(app)/atlas/page.tsx` als Entry-Point.

### 3.3 Features verifizieren 📦
- WMS-Layer laden
- FW-Städte-Marker
- OSM-Heat-Sources
- Legend + InfoPanel
- Guided Tour

**DoD M3:** GPA läuft als `/atlas`, login-geschützt, alle Features funktionieren.

---

## Milestone 4 – DeltaT-Migration *(Woche 4)*

### 4.1 `calculateSystem()` extrahieren 🔥
Aus `delta-t.html` → `src/apps/deltat/calc/system.ts` mit TypeScript-Types.

### 4.2 Unit-Tests ⭐
`src/apps/deltat/calc/system.test.ts` mit **mindestens 20 Testfällen**:
- Thermische Leistung: Default-Werte, Edge Cases (ΔT=0, negative ΔT)
- Tauchpumpe: Q=15 l/s, H=500m → ~122.6 kW
- Drost: d=500m, Q=15 l/s, b=40m → ~4 Jahre
- COP: T_VL=90, T_GW=25 → ~2.79
- WP-Elektrik: `W_el = Q_geo / (COP-1)`
- **Dubletten-Anzahl mit WP-Beitrag** (Review-2-Bugfix!)
- **Thermik-Ampel** (Review-2-Bugfix)
- LMTD Gegenstrom, inkl. Sonderfall ΔT1≈ΔT2
- Edge Cases: T_GW<T_VL, deltaT≤0, COP→∞, direkter Wärmetausch unmöglich

### 4.3 Komponenten auseinanderziehen 🔥
- `ParamSlider` → `src/core/ui/` (shared!) mit `freeInput`-Prop
- `KpiTile`, `BarChart` → `src/apps/deltat/components/`
- `InputColumn`, `PrimaryColumn`, `SecondaryColumn` → `src/apps/deltat/components/`
- Alte Modals (Impressum, Quellen) löschen — Shell übernimmt
- State in `useDeltaTStore.ts` (Zustand)
- Tailwind statt inline CSS-Variablen

### 4.4 Alle Review-Bugfixes erhalten ⭐
- [x] `Q_th = Q × ΔT × 4.18` ohne ×1000
- [x] `P_pump = Q × ρ × g × H / η`
- [x] `W_el = Q_geo / (COP - 1)`
- [x] `Q_geo_needed = zielLeistung × (COP-1)/COP` wenn WP aktiv
- [x] Thermik-Ampel vergleicht `qDelivered` vs. Ziel
- [x] Defaults: T_GW=25, abstand=500, laufstunden=2000
- [x] `freeInput` für T_VL und T_RL

### 4.5 Route registrieren 🔥
`app/(app)/deltat/page.tsx` als Entry.

### 4.6 Print-CSS portieren 📦
`@media print` für Drucken-Button → `window.print()`.

**DoD M4:** DeltaT läuft als `/deltat`, alle 20+ Unit-Tests grün, UI im Vencly-Design.

---

## Milestone 5 – Daten-Austausch zwischen Apps *(Woche 5)*

### 5.1 Workspace-Store 🔥
`src/store/useWorkspaceStore.ts` mit `LocationPreset`-Typ:
```ts
type LocationPreset = {
  id: string
  name: string
  source: 'gpa' | 'manual'
  lat: number
  lng: number
  geology: { tiefe: number; maechtig: number; kf: number; tGW: number; tds: number }
  createdAt: string
}
```

### 5.2 GPA → DeltaT 🔥
- Marker-Popup-Button "In DeltaT öffnen"
- Navigiert zu `/deltat?preset=<id>`
- DeltaT liest Query-Param, füllt Inputs vor
- Info-Banner: "Werte aus Standort XYZ vorbefüllt"

### 5.3 DeltaT → GPA 📦
- Button "Passende Standorte finden"
- Navigiert zu `/atlas?filter=tGW_min,tGW_max,maechtig_min,…`
- GPA filtert Marker entsprechend

### 5.4 `projects`-Tabelle 📦
```sql
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id),
  name          TEXT NOT NULL,
  description   TEXT,
  location      JSONB,
  deltat_input  JSONB,
  deltat_result JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user crud own" ON projects FOR ALL USING (auth.uid() = user_id);
```

### 5.5 `/projects` Übersichtsseite 📦
Liste gespeicherter Projekte, Speichern/Laden-Button in DeltaT.

**DoD M5:** Nutzer kann in GPA auf Marker klicken → DeltaT öffnet mit Werten → Projekt speichern → in Projektliste wiederfinden.

---

## Milestone 6 – Deployment & Domain *(Woche 6)*

### 6.1 Vercel ⭐
- Projekt verknüpft mit Repo
- Env-Vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_FEEDBACK_TOKEN`, `GITHUB_FEEDBACK_REPO`
- Preview-Deployments pro Branch

### 6.2 Domain `geotherm.vencly.com` ⭐
- CNAME auf Vercel zeigen
- SSL automatisch

### 6.3 Hetzner-Migration vorbereiten 📦
- `Dockerfile` (Multi-Stage, `next build` → standalone → Alpine-Node)
- `docker-compose.yml` mit App + Postgres + Backup-Volume
- `nginx.conf` (SPA-Fallback + Security-Headers + Brotli)
- `docs/HETZNER_MIGRATION.md` mit Schritt-für-Schritt-Anleitung
- pg_dump-Skript für Backup

### 6.4 Monitoring 💡
- Sentry (optional, Consent-gated)
- Plausible Analytics (später self-hosted)
- UptimeRobot

**DoD M6:** `geotherm.vencly.com` ist live, SSL gültig, Hetzner-Migration dokumentiert.

---

## Milestone 7 – Polish & Launch *(Woche 7)*

- [ ] 📦 PWA mit `@serwist/next` (Offline-First für DeltaT, Manifest, Icons)
- [ ] 📦 Onboarding-Tour bei erstem Login
- [ ] 📦 CSV- und PDF-Export für Projekte
- [ ] 📦 Accessibility-Audit (WCAG 2.1 AA)
- [ ] 📦 Performance-Audit (Lighthouse ≥ 95)
- [ ] 📦 Mobile-Testing (iOS Safari, Android Chrome)
- [ ] 📦 Cross-Browser (Firefox, Safari, Edge)
- [ ] 📦 Public Beta Announcement
- [ ] 💡 Erste Feedback-Items aus `feedback.md` einarbeiten

**DoD M7:** Public Beta live, erste echte Nutzer, Feedback-Loop läuft.

---

## Backlog – Weitere In-Apps (ab M8+)

- [ ] ⏸ **Bohrkosten-Kalkulator** (CAPEX/OPEX)
- [ ] ⏸ **LCOH-Modul** (Levelized Cost of Heat)
- [ ] ⏸ **Genehmigungs-Guide** (WHG-Anträge je Bundesland)
- [ ] ⏸ **Netzanschluss-Planer** (Distanz zu Fernwärme)
- [ ] ⏸ **CO₂-Einsparungs-Report**

Jede neue In-App: eigener Ordner `src/apps/{name}/`, Registrierung in `src/core/apps.ts`, Route in `app/(app)/{name}/page.tsx`.

---

## Aufräumarbeiten (nach erfolgreichem Launch)

- [ ] ⏸ Alte `vencly-delta-t` als Archiv markieren
- [ ] ⏸ Alte `geopotatlas` als Archiv markieren
- [ ] ⏸ Redirects von alten URLs
- [ ] ⏸ Migration der Supabase-Feedback-Daten aus Alt-Projekten

---

## Offene strategische Entscheidungen

1. **Auth-Anbieter final:** Supabase vs. Keycloak für Hetzner-Phase?
2. **Open-Source-Kernel:** MIT-Lizenz für Shell-Code?
3. **Pricing-Tool:** Stripe oder Lemon Squeezy?
4. **i18n:** Ab wann Englisch dazunehmen?
5. **Analytics:** Plausible reicht oder PostHog für Product-Analytics?
6. **Feedback-Moderation:** Automatische Spam-Filter nötig?

---

## Definition of Done (pro Milestone)

1. Alle ⭐/🔥-Tasks erledigt
2. Unit-Tests für neue Logik grün
3. Merge in `main`
4. README.md aktualisiert
5. Vercel-Preview-Deployment grün
6. Kurzer Walk-through-Screenshot / -Video geteilt
