# Tasks – Geotherm by Vencly

**Legende:** ⭐ Blocker · 🔥 Muss · 📦 Soll · 💡 Kann · ⏸ Später

---

## Milestone 0 – Bootstrap (diese Session)

- [x] ⭐ Neues Repo `github.com/cryptoclemens/geotherm` (privat)
- [x] ⭐ BRIEF.md, Tasks.md, README.md, CLAUDE.md, feedback.md, .gitignore
- [x] ⭐ Initial-Commit nach `main` pushen

**DoD:** Sechs Dateien auf `main`. Neue Claude-Session kann darauf aufbauen.

---

## Milestone 1 – Projekt-Setup & Shell *(Woche 1)* ✅ ERLEDIGT

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

## Milestone 2 – Auth & Nutzer-Konto *(Woche 2)* ✅ ERLEDIGT (Code-seitig — Supabase-Instanz manuell anlegen)

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

## Milestone 2.5 – Feedback-System *(Woche 2/3)* 💎 NEU ✅ ERLEDIGT

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

## Milestone 3 – GPA-Migration *(Woche 3)* ✅ ERLEDIGT

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

## Milestone 4 – DeltaT-Migration *(Woche 4)* ✅ ERLEDIGT

### 4.1 `calculateSystem()` extrahieren 🔥
Aus `delta-t.html` → `src/apps/deltat/calc/system.ts` mit TypeScript-Types.

### 4.2 Unit-Tests ⭐
`src/apps/deltat/calc/system.test.ts` mit **77 Testfällen gesamt** (Stand April 2026):
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

**DoD M4:** DeltaT läuft als `/deltat`, alle 41 Unit-Tests grün, UI im Vencly-Design.

---

## Milestone 5 – Daten-Austausch zwischen Apps *(Woche 5)* ✅ ERLEDIGT (WorkspaceStore + OpenInDeltaT + Location Inspector + KI-Standortsuche)

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

### 5.3b Map-Click Location Inspector 🔥 ✅ ERLEDIGT
- Klick auf beliebige Kartenposition in GPA → API `POST /api/ai/location` (lat, lng, placeName)
- Claude Haiku analysiert geologische/hydrologische Kennwerte des Standorts
- `MapClickLayer.tsx` + `LocationInspectorPanel.tsx` als Overlay-Komponenten
- Buttons: „Ort speichern" (→ `WorkspaceStore.savedLocations[]`) + „in DeltaT" (→ DeltaT mit Preset)
- `saveLocation` / `deleteLocation`-Actions im WorkspaceStore

### 5.3c KI-Standortsuche (Dashboard → GPA) 🔥 ✅ ERLEDIGT
- Dashboard-KI-Dialog zeigt `GeoSpots`-Karte als Tool-Result mit „Auf Karte anzeigen"-Button
- GPA zeigt `SearchResultsPanel` mit Tab „Aktuell | Gespeichert"
- ⭐ Speichern-Button für AI-Suchergebnisse; gespeicherte Suchen laden/löschen
- `GeoSpotsLayer`: nummerierte Marker auf GPA-Karte für KI-Suchergebnisse

### 5.3d GPA „Meine Orte"-Tab 🔥 ✅ ERLEDIGT
- Sub-Tabs im GPA-Header: „Atlas" | „Meine Orte"
- `SavedLocationsTab.tsx`: Liste aller gespeicherten Standorte aus WorkspaceStore
- DeltaT-Export-Button pro Eintrag; Löschen-Funktion

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

## Milestone 6 – Deployment & Domain *(Woche 6)* ✅ ERLEDIGT (Dockerfile + docker-compose + nginx + Vercel-Config + CI — Domain manuell)

### 6.1 Vercel ⭐ ✅ ERLEDIGT (vercel.json)
- `vercel.json` im Repo für Build-Config + Preview-Deployments
- CI-Pipeline `.github/workflows/ci.yml` (lint + typecheck + test auf jedem Push)
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

## Milestone 7 – Polish & Launch *(Woche 7)* 🔄 LAUFEND

- [x] 📦 PWA-Manifest + Icons (manifest.ts, /public/icons/icon.svg)
- [x] 📦 Onboarding-Tour DeltaT (DeltaTTour, 4 Schritte, localStorage)
- [x] 📦 @serwist/next Service Worker (sw.ts konfiguriert, im Prod-Build aktiv)
- [x] 📦 CSV-Export für Projekte (exportProjectsToCsv, UTF-8-BOM für Excel)
- [x] 📦 Print/PDF-Export DeltaT (window.print() + @media print CSS mit data-Attributen)
- [x] 📦 macOS 26 Glassmorphism Design (Teal/Navy, glass-card-Klassen, Plus Jakarta Sans)
- [x] 📦 Login-Bug behoben (router.refresh() nach signIn)
- [x] 📦 Version-Badge im Header (NEXT_PUBLIC_GIT_SHA, Vercel auto-inject)
- [x] 📦 Plausi-Fixes A+B: foerderhoehe-Input, jahreswaerme=qDelivered (Scientist-Agent)
- [x] 📦 Accessibility-Basis: Skip-to-content Link, aria-label auf Navigation (WCAG 2.1)
- [x] 📦 77 Unit-Tests grün (System-Kern vollständig abgedeckt — Stand April 2026 nach Plausi-Check II)
- [x] 📦 Accessibility-Vollaudit (WCAG 2.1 AA — FeedbackModal, NavLinks, UserNav, MapView, InfoPanel, DeltaTTour, AiDialog, LayerGroup, PrintDialog, prefers-reduced-motion)
- [x] 📦 Performance-Audit (next.config: poweredByHeader, compress, AVIF/WebP; OG-Metadata, robots.ts, sitemap.ts, PWA-Icons)
- [ ] [build] 📦 Mobile-Testing (iOS Safari, Android Chrome — v.a. GPA/Atlas)
- [ ] [build] 📦 Cross-Browser (Firefox, Safari, Edge)
- [ ] [build] 📦 Supabase Site URL im Dashboard auf `https://geotherm.vencly.com` setzen (E-Mail-Bestätigung)
- [x] 📦 Plausi-Fixes C+D: Durchbruch /4→/3 + HC-Ratio 0.7; COP T_GW→T_R (Gringarten & Sauty 1975, Arpagaus 2018)
- [x] 📦 Wissenschaftlicher Disclaimer auf /deltat prominent sichtbar (BRIEF.md § 7.3)
- [x] 📦 Service-Worker-Crash behoben: @serwist disabled + Cache-clearing SW (public/sw.js)
- [x] 📦 Middleware-Härtung: Env-Guard + try/catch + Auth-Redirect → /deltat
- [x] 📦 Post-Login-Dashboard mit App-Übersicht, Direktzugriff-Kacheln und Projektliste
- [x] 📦 KI-Assistent auf Dashboard (claude-haiku, navigate_to_deltat/atlas, create_feedback, Vercel AI SDK v6)
- [x] 📦 FormelTab in DeltaT: Tab-Switcher „Berechnung | Formelwerk" mit Quellenübersicht
- [x] 📦 KI-Standortsuche: GeoSpots-Karte im Dashboard-Chat + SearchResultsPanel in GPA (Tab Aktuell|Gespeichert, ⭐ Speichern/Laden/Löschen)
- [x] 📦 GeoSpotsLayer: nummerierte Marker auf GPA-Karte für AI-Suchergebnisse
- [x] 📦 Map-Click Location Inspector: Klick auf Karte → KI-Analyse (Geologie/Hydrogeologie) + „Ort speichern" + „in DeltaT"-Buttons
- [x] 📦 Meine Orte Tab: Sub-Tab im GPA-Header mit gespeicherten Standorten + DeltaT-Export
- [x] 📦 FW-Städte Marker-Fix: weißer Stroke auf Kreis-Markern für GÜK250-Sichtbarkeit
- [x] 📦 Dashboard Scroll Fix: Chat-Öffnung scrollt nicht mehr die Seite
- [x] 📦 Favicon-Set: icon.svg, favicon.ico, apple-icon.png, icon-192/512.png
- [x] 📦 heat-abw OSM-Query erweitert: mehr Industriestandorte (industrial=works, landuse=industrial+operator, …)
- [x] 📦 Vercel-Config + CI: vercel.json + .github/workflows/ci.yml
- [ ] [plan] 📦 Public Beta Announcement
- [ ] [plan] 💡 Erste Feedback-Items aus `feedback.md` einarbeiten

**DoD M7:** Public Beta live, erste echte Nutzer, Feedback-Loop läuft.

---

## Milestone 7.5 – Bohrkostenrechner & Meine Projekte *(April 2026)* ✅ ERLEDIGT

### 7.5.1 Bohrkostenrechner (`/bohrkost`) ✅
- [x] 🔥 `src/apps/bohrkost/calc/kosten.ts` — Lukawski-Formel (Lukawski et al. 2014, J. Pet. Sci. Eng. 118, 1–14)
- [x] 🔥 Linearer Fallback für Tiefen < 500 m (GtV Bohrpreise 2024; DVGW W 115)
- [x] 🔥 3 Bohrungstypen: Dublette, Einzelbohrung, Explorationsbohrung (+15 %)
- [x] 🔥 3 Produktionsdurchmesser: 7", 9 5/8", 13 3/8" (Korrekturfaktoren 0.85/1.00/1.25)
- [x] 🔥 Gesteinstypen: Lockergestein (0.70), Festgestein_sed (1.00), Festgestein_kristallin (1.30)
- [x] 🔥 Regionen: NDB (0.95), Molasse (1.00), Oberrheingraben (1.05), Sonstiges (1.00)
- [x] 🔥 Bandbreite Min (×0.65) / Mid / Max (×1.50) pro Bohrung und Gesamtprojekt
- [x] 🔥 Komplettierungskosten: Pumpe+Steigleitung, Pumptest, Genehmigung, Gutachten, Fündigkeitsrisiko-Versicherung
- [x] 🔥 MAP/KfW-Förderung: 375 EUR/m, max. 2.500.000 EUR (BEG / KfW 2024) — toggle-bar
- [x] 🔥 Ampeln: Kosten/kW_th, Gesteinsrisiko, Tiefe
- [x] 📦 Formelwerk-Tab (`BohrkostFormelTab.tsx`) mit Quellenübersicht + Feedback-Link
- [x] 📦 Unit-Tests `kosten.test.ts`
- [x] ⭐ Route `app/(app)/bohrkost/page.tsx` registriert, NavLinks ergänzt

### 7.5.2 Meine Projekte (erweitert) ✅
- [x] 🔥 Neue Typen: `ProjectType` (Dublette/Einzelbohrung/Exploration), `ProjectStatus` (Idee/InPlanung/InAusfuehrung/Abgeschlossen/Archiviert), `ProjectGeologicalData`, `AiSuggestion`
- [x] 🔥 `useProjectStore.ts` (Zustand, persist) — CRUD, Selektion, AI-Suggestions
- [x] 🔥 `ProjectFormDialog.tsx` — Create/Edit mit Typ, Status, Ort, Notizen, DeltaT-Übernahme
- [x] 🔥 `LoadProjectDialog.tsx` in DeltaT — Projekt in DeltaT laden mit Typ/Status-Badges
- [x] 📦 `ProjectsLayer.tsx` (GPA) — Leaflet-Marker pro Projekt (Farbe nach Status)
- [x] 📦 `ProjectDetailPanel.tsx` — Floating Panel (Geo-Daten, DeltaT-Params, „In DeltaT laden")
- [x] 📦 `ProjectsTab.tsx` — dritter GPA-Tab „Projekte"
- [x] 📦 KI-Tool `suggest_project_optimization` (Dashboard-Chat → `/api/ai/project-optimize`, Haiku)
- [x] ⭐ `/projects`-Seite: „Neues Projekt"-Button, Edit-Dialog pro Karte, Typ/Status-Badges

**DoD M7.5:** Bohrkostenrechner unter `/bohrkost` live; Meine Projekte mit vollständigem CRUD, GPA-Layer und KI-Optimierungsvorschlag; NavLinks: Atlas · DeltaT · Bohrkosten · Projekte.

---

## Milestone 7.6 – Scientist-Plausi-Check II & Qualitätssicherung *(April 2026)* ✅ ERLEDIGT

### 7.6.1 Zweiter Scientist-Plausi-Check (Cross-App-Dependency-Review) ✅
- [x] 📦 Zweiter Scientist-Plausi-Check: Cross-App-Dependency-Check (DeltaT/Bohrkost/GPA), 8 Befunde umgesetzt

### 7.6.2 DeltaT-Verbesserungen ✅
- [x] 📦 Rename: anzahlDoubletten → anzahlDubletten (konsistente Schreibweise)
- [x] 📦 Neuer DeltaT-Input: Effektive Porosität n (0.01–0.40) — war hardcoded 0.25
- [x] 📦 Neuer DeltaT-Input: Gütegrad WP η_Carnot (0.30–0.65) — war hardcoded 0.50
- [x] 📦 COP-Berechnung DRY — cop einmal berechnet, _copEst-Duplikat entfernt

### 7.6.3 Bohrkost-Verbesserungen ✅
- [x] 📦 Bohrkost 500m-Sprung eliminiert: Blend-Zone 400–600m (linear→Lukawski)

### 7.6.4 Cross-App-Synchronisation ✅
- [x] 📦 anzahlDubletten-Sync: DeltaT → Bohrkost via Projekte-Seite + ProjectDetailDialog

### 7.6.5 Stabilitäts-Fixes ✅
- [x] 📦 Persist-Migration v0→v1 (DeltaT + Bohrkost Stores) — Produktions-Crash-Fix

**DoD M7.6:** Alle 8 Scientist-Befunde aus dem Cross-App-Review umgesetzt; anzahlDubletten konsistent; DeltaT mit Porosität- und Gütegrad-Input; Bohrkost-Blend-Zone; Persist-Migration verhindert Produktions-Crash.

---

## Milestone 7.7 – BYOK (Bring Your Own Key) LLM-Integration *(April 2026)* 🔄 LAUFEND

### 7.7.1 Infrastruktur ✅
- [x] [done] ⭐ `@ai-sdk/openai` installiert
- [x] [done] ⭐ DB-Migration `user_api_keys` (AES-256-GCM, RLS)
- [x] [done] ⭐ `src/lib/crypto/apiKeyEncryption.ts` — Encrypt/Decrypt/Mask
- [x] [done] ⭐ `src/lib/ai/getUserAiModel.ts` — Server-Utility mit Fallback auf Server-Key
- [x] [done] 🔥 `src/app/api/user/api-keys/route.ts` — GET/POST/DELETE (CRUD)

### 7.7.2 Settings-UI *(in Arbeit)*
- [ ] [build] ⭐ `src/app/(app)/settings/page.tsx` — 4 Provider-Karten (Anthropic, OpenAI, Azure, Perplexity)
- [ ] [build] 🔥 Zahnrad-Icon in `UserNav.tsx` → Link zu `/settings`
- [ ] [build] 📦 Optionaler BYOK-Schritt im Signup-Flow (nach E-Mail-Bestätigung)

### 7.7.3 KI-Routen auf BYOK umstellen
- [ ] [build] 🔥 `/api/ai/chat/route.ts` — `getUserAiModel()` statt hartem `anthropic()`
- [ ] [build] 🔥 `/api/ai/project-optimize/route.ts` — gleiche Umstellung

### 7.7.4 Legal & Env
- [ ] [build] 📦 `content/legal/agb.mdx` — § BYOK ergänzen
- [ ] [build] 📦 `content/legal/datenschutz.mdx` — Abschnitt Nutzer-API-Keys
- [ ] [build] ⭐ `.env.example` + `.env.local` — `API_KEY_ENCRYPTION_SECRET` + Provider-Keys

**DoD M7.7:** Nutzer kann eigenen Anthropic/OpenAI/Azure/Perplexity-Key unter `/settings` hinterlegen; KI-Features nutzen diesen Key statt Server-Key; Klartext verlässt den Server nie.

---

## Milestone 7.8 – Security Hardening KI-Endpoints *(Mai 2026)* ✅ ERLEDIGT

### 7.8.1 Authentifizierung KI-Routen ✅
- [x] [done] 🔥 `/api/ai/chat/route.ts` — `supabase.auth.getUser()` + HTTP 401 für Unauthentifizierte
- [x] [done] 🔥 `/api/ai/project-optimize/route.ts` — Auth-Check + `project_name` max 200, `optimization_goal` max 500 Zeichen
- [x] [done] 🔥 `/api/ai/location/route.ts` — Auth-Check + `placeName` max 200 Zeichen

**Befund:** Alle drei `/api/ai/*`-Endpoints waren ohne Authentifizierung öffentlich erreichbar — jeder externe Caller konnte den Server-seitigen `ANTHROPIC_API_KEY` verbrauchen. Die Next.js-Middleware schützte nur UI-Routen, nicht die API-Pfade.

**DoD M7.8:** Alle KI-API-Endpoints geben HTTP 401 zurück wenn kein authentifizierter Supabase-User vorhanden ist; User-Inputs werden auf sichere Längen beschränkt.

---

## Milestone 7.9 – Security Hardening — Vibe-Coding-Audit *(Mai 2026)* ✅ ERLEDIGT

*Grundlage: Golem-Artikel + Tenzai-Studie; Befund: fehlende Security-Header + offene Proxy-Routes*

### 7.9.1 Security Headers ✅
- [x] [done] `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` (alle Pfade)

### 7.9.2 Auth auf Proxy-Routes ✅
- [x] [done] `/api/geocode` — Auth-Check (`createClient` + `getUser`) + HTTP 401
- [x] [done] `/api/overpass` — Auth-Check + HTTP 401 (verhindert DoS-Missbrauch gegen externe Overpass-Endpunkte)
- [x] [done] `/api/wms-proxy` — Auth-Check + HTTP 401 (Whitelist bleibt zusätzlich erhalten)

**Befund:** Die drei Proxy-Routes waren ohne Auth öffentlich erreichbar. Angreifer könnten sie für DoS auf Nominatim/Overpass oder Bandbreiten-Missbrauch nutzen.

**DoD M7.9:** Vollständige Security-Header-Suite deployed; alle Proxy-Routes erfordern eingeloggten Supabase-User.

---

## Backlog – Weitere In-Apps (ab M8+)

- [ ] ⏸ **Genehmigungs-Guide** (WHG-Anträge je Bundesland)
- [ ] ⏸ **Netzanschluss-Planer** (Distanz zu Fernwärme)
- [ ] ⏸ **CO₂-Einsparungs-Report**

Jede neue In-App: eigener Ordner `src/apps/{name}/`, Registrierung in `src/core/apps.ts`, Route in `app/(app)/{name}/page.tsx`.

---

## M8 – LCOH-Modul (`/lcoh`)

**Stand Juli 2026:** Außerhalb dieses Repos existiert bereits ein **funktionsfähiger, verifizierter
LCOH-Rechner** als Single-File-Prototyp (Projekt der Kunde / Referenzprojekt, gebaut von
Vencly nach dem Vorbild des alten DeltaT-Single-File-Rechners). Der Rechenkern ist eine 1:1-Portierung
eines Excel-Modells der der Fachplaner und **zellgenau gegen dessen komplette Sensitivitätsmatrix
verifiziert** (7 Dimensionen × 6 Technologien). Damit ist M8 kein Greenfield, sondern eine Portierung —
dieselbe Reise wie DeltaT (Single-File auf GitHub Pages → In-App, April 2026).

Technologien im Modell: Geothermie, Geothermie + Spitzenlastkessel, Erdgas-Kessel,
Luft-WP + Spitzenlast, Luft-WP + Spitzenlast + PV, Rechenzentrums-Abwärme.

### M8.0 – Strategische Vorentscheidung ✅ geklärt (14.07.2026)

- [x] ⭐ **Positionierung:** `/lcoh` ist die erste In-App, in der Geothermie nur eine von sechs Optionen
      ist und auch verlieren kann — verschiebt das Geotherm zur „Wärmeprojekt-Suite"? **Nein.**
      Der Fachplaner (der Fachplaner) hat den Scope im Termin 14.07.2026 klar gezogen:
      > „Wenn wir nur das Ziel haben, Geothermie zu verkaufen, dann würde ich das dabei belassen. Weil
      > wir haben nur hier die volle Einsicht, was da wirklich die Kosten sind […]. Und bei PV […] müsste
      > man eine andere Fachabteilung des Kunden einbinden. […] Das ist dann aber ein Niveau [Kostentabelle] pro
      > Technologie."

      **Konsequenz — Leitplanke für `/lcoh`:** Nur die **Geothermie** wird ausmodelliert (Kostentabelle
      + COP aus DeltaT). Gas, Luft-WP, PV und Abwärme bleiben **Referenzannahmen** für den Vergleich —
      bewusst flach, keine eigenen Kostenmodelle. Damit bleibt Geotherm eine **Geothermie-Suite**;
      `/lcoh` beantwortet „Was ist der Vorteil der Geothermie gegenüber den Alternativen?", nicht
      „Welche Wärmelösung ist die beste?". Keine BRIEF-Änderung nötig.

      Wer die anderen Technologien vertiefen will, braucht je Technologie eine eigene Kostentabelle und
      andere Fachabteilungen → eigenes Vorhaben, nicht M8.

### M8.0b – Zweck-Anker: Wofür wird das Ergebnis gebraucht? ⭐ (Blocker für die Ausgabe)

Aus dem Scope-Termin 14.07.2026 — laut Fachplaner die eigentliche Leitfrage, und bislang unbeantwortet:

> „Eine Bank möchte eine Risikokalkulation sehen und der [Auftraggeber] möchte einfach den internen
> Gate-Prozess sehen. […] Deswegen müsste man eigentlich gucken, wie gehen die durch die
> Gate-Prozesse, solche Projekte, und das dann daraufhin optimieren."

- [ ] ⭐ **Klären: Welche Parameter betrachtet der interne Gate-Prozess des Auftraggebers?**
      Davon hängt ab, was `/lcoh` überhaupt ausgeben muss — die Ausgestaltung von `ResultColumn`
      und den KPI-Kacheln ist bis dahin geraten. Rückfrage läuft.
- [ ] 📦 Konsequenz mitdenken: Dem **Endkunden** ist das Preisrisiko egal — das liegt beim
      Projektentwickler. Die Sensitivitätsanalyse ist damit primär ein **internes** Instrument für
      Preisfindung und Gate, kein Kundenargument. Für den Endkunden zählt: „Was ist der Vorteil
      gegenüber den anderen Technologien?" → zwei verschiedene Sichten auf dieselbe Rechnung.

### M8.1 – Blocker: Bohrkosten-Widerspruch auflösen ⭐

Siehe **PLAUSI_CHECK.md → „Bohrkost ↔ LCOH-Modell — Cross-Check gegen reales Bohrangebot (Juli 2026)"**.

- [ ] [build] ⭐ 🔴 **Befund A:** Bohrkost unterschätzt zwei reale Bohrangebote (280 m, Lockergestein,
      Dublette) um Faktor 3,4–5,0. Liegt außerhalb der AACE-Bandbreite.
      **Teil 1 erledigt (14.07.2026): Gültigkeitsgrenze deklariert** — `kleinkaliberWarnung` (≤ 400 m)
      am Bohrtiefe-Slider + Formelwerk-Zeile `linear-gueltigkeit`. Bewusst **nicht** kalibriert:
      ohne Kostenaufschlüsselung ist der Scope der Vergleichszahl unbekannt, ein €/m-Fit dagegen wäre
      eine Annahme mit Nachkommastellen — in einem Mehrkunden-Produkt schädlicher als eine
      offengelegte Grenze.
      **Teil 2 offen:** Kostenaufschlüsselung beim Bohrunternehmen anfordern → dann
      `LINEAR_PREIS_PRO_M` / `LINEAR_MOBILISIERUNG` für Lockergestein kalibrieren.
      **Blocker bleibt:** `/lcoh` und `/bohrkost` dürfen nicht mit widersprüchlichen Bohrkosten
      nebeneinander live gehen. Der Befund-B-Fix löst das nicht — er verschiebt die Vergleichsebene
      nur auf 302 T€ (Faktor 3,6); selbst 13 3/8" ergibt erst 378 T€ (Faktor 2,8).
- [x] [verify] 🔥 🟡 **Befund B erledigt (14.07.2026):** `f_region × f_durchmesser` wirken nun auch im
      linearen Zweig (`kosten.ts`, `f_linear`) — Marktaufschlag, Währung und Gestein bewusst nicht
      (doppelt bzw. bereits enthalten). Bei 280 m: 7"/9 5/8"/13 3/8" = 128,4/151,1/188,8 T€ statt
      durchgängig 159,0 T€. Faktor greift an der `linear`-Variablen → Blend 400–600 m bleibt stetig
      (Regressionstests an den Rändern + Monotonie). 136 Tests grün.
- [ ] 📦 Blend-Zone 400–600 m überdenken: linearer Zweig (255 T€) und Lukawski (1.079 T€) liegen bei
      600 m um Faktor 4,2 auseinander — der Blend mittelt zwei Modelle, von denen dort höchstens eines stimmt.

### M8.2 – Portierung

- [ ] 🔥 Rechenkern → `src/apps/lcoh/calc/lcoh.ts` (pure, DOM-frei — liegt im Prototyp bereits so vor)
- [ ] 🔥 `src/apps/lcoh/calc/lcoh.test.ts` in bestehende Vitest-Suite; **synthetischer** Referenzfall
      (siehe M8.4 — der das Referenzprojekt-Golden-Master gehört nicht in dieses Repo)
- [ ] 🔥 Store `src/apps/lcoh/store/useLcohStore.ts` (Parameter-Registry aus dem Prototyp)
- [ ] ⭐ **Parameter-Registry als Daten, nicht als Code.** Zielbild ist, dass Fachplaner direkt in der
      Suite arbeiten und Excel perspektivisch entfällt. Excel ist für sie aber nicht nur Datenhaltung,
      sondern **Autorenumgebung**: Zeile einfügen, Annahme ändern, Quelle danebenschreiben,
      Base/Best/Worst pflegen. Steht die Registry im Quellcode, ist der Fachplaner in der Suite
      *unselbständiger als in Excel* — jeder neue Parameter bräuchte einen Entwickler. Dann scheitert
      die Ablösung.
      → Registry DB-gestützt: Schlüssel, Bezeichnung, Einheit, Base/Best/Worst, Min/Max, **Quelle**,
      Kommentar, Änderungshistorie. Grenze bewusst: Parameterwerte/Prämissen/Quellen = Daten
      (Fachplaner autonom); neue Technologie/Formel/Sensitivitäts-Dimension = Code (selten, alle paar
      Monate — DC-Abwärme kam zuletzt neu dazu). Vollständiges Formel-Autorieren wäre ein
      Tabellenkalkulations-Nachbau → ausdrücklich kein Ziel.
      **Betrifft nicht nur `/lcoh`** — DeltaT und Bohrkost haben dasselbe Muster (Konstanten im Code).
- [ ] 🔥 UI nach bestehendem Muster: `InputColumn` / `ResultColumn` / `KpiTile` / `FormelTab`
      (der Prototyp hat für jedes davon eine direkte Entsprechung)
- [ ] 🔥 Tornado-Diagramm (Sensitivitätsanalyse je Technologie, ceteris paribus) — Kernfeature,
      ersetzt 0,5–1 h Excel-Handarbeit pro Durchlauf
- [ ] 🔥 **Break-even-Gaspreis als KPI** — „ab welchem Gaspreis schlägt Geothermie den Gaskessel?".
      Im Prototyp analytisch über zwei Stützstellen gelöst (beide LCOH sind linear im Gaspreis) und
      damit die Zielwertsuche des Fachmodells ersetzend. Achtung: Der Kipppunkt hängt an der
      Geothermie-Variante (mit/ohne Spitzenlastkessel) — der Kessel verbrennt selbst Gas.
- [ ] 🔥 **Lesehilfe für das Tornado-Diagramm** — ausdrückliche Anforderung aus dem Erst-Call:
      „dass auch jemand, der da nicht drin ist, ein Tornado-Diagramm erst mal lesen kann."
      Nicht mit dem `FormelTab` verwechseln: Der zeigt die *Formeln*, die Lesehilfe erklärt die
      *Darstellung* (Balkenbreite = Volatilität × Hebel; lange Balken = kritische Stellhebel;
      Sortierung nach Wirkung; ceteris paribus). Im Prototyp als „Erklärbär"-Block vorhanden.
- [ ] 🔥 Registrierung in `src/core/apps.ts` + Route `app/(app)/lcoh/page.tsx`
- [ ] 📦 Disclaimer sichtbar: CRF-Methode = Richtwert für Technologievergleich; für Investitions-
      entscheidungen ist eine DCF-Rechnung je Technologie nötig (BRIEF §7.3)
- [ ] 📦 **Plausi-Check der LCOH-Engine** durch den Scientist-Agent nach der Portierung —
      Hauskonvention: Jedes `calc/`-Modul hat einen (siehe PLAUSI_CHECK.md für DeltaT und Bohrkost).
      Bisher ist die Engine nur *gegen das Fachmodell* verifiziert — geprüft ist damit die
      **Portierung**, nicht die **Physik/Ökonomik** dahinter. Das ist ein Unterschied.

### M8.2b – Kostenziel-Modus („Break-even-Logik umkehren") 🔥

Im Kunden-Foliensatz als Next Step zugesagt und im Erst-Call ausführlich beschrieben:

> „Wir sagen von vornherein, Geothermie muss immer günstiger sein als der Gaspreis. Wie muss ich dann
> die Wärmegestehungskosten verändern? Und die habe ich dann als Benchmark, um zur Organisation
> zurückzugehen und zu sagen: Könnt ihr das? Wenn wir das erreichen wollen, müsst ihr [die Kosten]
> auf das und das runterbringen."

- [ ] 🔥 **Rückwärtsrechnung:** Welchen LCOH muss die Geothermie erreichen, um verlässlich unter dem
      Gas-Szenario zu liegen? Daraus internes Kostenziel für Bohrung, Anlagentechnik und
      Stromsourcing ableiten. Technisch die Umkehrung der vorhandenen Break-even-Logik auf eine
      beliebige Zielgröße — der Rechenkern ist bereits linear in den relevanten Preisen.
- [ ] 📦 **Nur je Produktlayer sinnvoll** (siehe M8.1b): Ohne Layer-Angabe ist „welchen LCOH muss die
      Geothermie erreichen?" nicht beantwortbar — die Spanne reicht je nach Scope von 30 bis 135 €/MWh.
- [ ] 💡 Ausbaustufe: verallgemeinern auf „Auf welchen Wert muss Parameter X, damit Technologie Y
      günstiger ist als Z?"

### M8.1b – Produktlayer als Dimension ⭐ (neu 16.07.2026)

Die Kostentabelle des Betreibers rechnet den LCOH **je Produktlayer** — der Anbieter verkauft nicht
„Geothermie", sondern sechs gestaffelte Produkte mit unterschiedlichem Scope:

| Layer | Scope | LCOH (Referenzprojekt) |
|---|---|---|
| L1a | Brunnen-Infrastruktur (Planung, Genehmigung, Bohrung, Pumpe) | 30,4 €/MWh |
| L1b | L1a + Betrieb | 37,1 €/MWh |
| L2a | + Wärmetauscher (schlüsselfertig bis Übergabepunkt) | 114,7 €/MWh |
| L2b | L2a + Betrieb | 121,8 €/MWh |
| L3a | + Wärmepumpe (Temperaturhub) | 133,3 €/MWh |
| L3b | L3a + Betrieb (Komplett-Belieferung) | 135,0 €/MWh |

- [ ] ⭐ **Produktlayer als erste Klasse in `/lcoh`.** Der LCOH der Geothermie ist keine Zahl, sondern
      eine Funktion des verkauften Scopes (30–135 €/MWh — Faktor 4,5). Ohne Layer-Dimension ist die
      Kostenziel-Logik („welchen LCOH muss Geothermie erreichen?") nicht beantwortbar.
      Technisch: Scope-Matrix (Kostenblock × Layer) als Daten — passt zur DB-gestützten Registry aus M8.2.
- [ ] 📦 Benennung schärfen: Bei Layern ohne Wärmelieferung (L1a/L2a) wird trotzdem durch die
      Jahreswärmemenge geteilt. Als Kostenumlage lesbar, aber kein LCOH im üblichen Sinn.

### M8.1c – Methodik-Konvention ⭐ (Blocker, neu 16.07.2026)

- [ ] ⭐ Die beiden Fachmodelle annualisieren **unterschiedlich**: 6 % WACC / 30 a (CRF 0,0726) vs.
      10 % Hurdle Rate / 20 a (CRF 0,1175) — **Faktor 1,62**. Am Referenzprojekt sind das 24,7 €/MWh
      Unterschied, allein aus der Konvention. Solange die nicht vereinbart ist, sind die Modelle nie
      vergleichbar und `/lcoh` kann keine belastbare Zahl zeigen.
      → Konvention festlegen, in der Registry als Szenario-Prämisse hinterlegen, im FormelTab offenlegen.

### M8.3 – Verkettung mit bestehenden In-Apps

Damit wird die Modelllandschaft geschlossen: `/deltat` → `/bohrkost` → `/lcoh` → `/projects`.

- [ ] 🔥 **Bohrkost → LCOH:** `projektkosten_netto_mid` als Geothermie-CAPEX übernehmen.
      Löst das größte offene Problem des Prototyps: dort sind die Bohr-CAPEX fixe T€-Werte, die
      **nicht** mit der Anlagengröße skalieren → außerhalb ~2 MW sind die LCOH systematisch falsch.
      Bohrkost liefert genau diese Skalierung (Lukawski). **Voraussetzung: M8.1.**
- [ ] 🔥 **DeltaT → LCOH:** `cop` und `anzahlDubletten` übernehmen (Cross-Check Juli 2026: DeltaT-COP
      und LCOH-Modell sind konsistent — Gütegrad 0,43 → COP 3,0 wie im das Referenzprojekt-Datenblatt)
- [ ] 📦 **LCOH → Projects:** Ergebnis als Projekt speichern/laden (Preset-Layer = Mehrprojektfähigkeit)
- [ ] ⭐ **Quellen-Hierarchie statt „eine Zahl gewinnt".** Für dieselbe Kostenposition liefern die
      Quellen unterschiedliche Werte (im Referenzfall je Bohrung: Formel 140–159 T€, Fachmodell
      537 T€, Angebot 700 T€). Das sind **keine drei Schätzungen derselben Größe**, sondern zwei
      Arten von Zahl: ein Angebot ist eine *Messung* an genau diesem Projekt, die Formel eine
      *Vorhersage*. Eine Messung konkurriert nicht mit einem Modell — sie kalibriert es.
      → Jeder Kostenblock trägt `wert + quelle + güte`. Rangfolge automatisch:
      **1. Angebot für dieses Projekt · 2. Annahme aus einem Fachmodell · 3. generische Formel.**
      Das Tool nimmt die höchste verfügbare Stufe und **zeigt sichtbar an, welche**. Override möglich,
      wird protokolliert. Bewusst **je Kostenblock, nicht je Zelle** — die Zahlen ergeben nur als
      Scope-Bündel Sinn (enthält das Angebot Verrohrung/Filter/Kies, die Formel aber nicht, erzeugt
      Mischen auf Zellebene stille Doppelzählung).
      Konsequenz: Liegt ein Angebot vor, wird `/bohrkost` für dieses Projekt **gar nicht erst
      herangezogen** — damit verschwindet der Widerspruch aus M8.1 im UI von selbst.
- [ ] 🔥 **Spanne statt Scheingenauigkeit anzeigen.** Fachmodelle überschreiben einander nie; sie
      stehen nebeneinander, und `/lcoh` zeigt die Bandbreite mit Quellenangabe
      (Referenzfall: „94,7 nach Fachmodell A · 110,3 nach Fachmodell B methodenbereinigt · 135,0 wie
      dort gerechnet"). Für einen Gate-Prozess ist die Spanne samt Herkunft nützlicher als eine
      scheingenaue Einzelzahl — siehe M8.0b.

### M8.4 – Datenschutz-Grenze ⭐

- [ ] ⭐ **Keine Kundendaten in dieses Repo.** Das zugrundeliegende Excel-Modell, der das Referenzprojekt-Lastgang und
      die CAPEX-Datenblätter sind kunden- und fachplanervertraulich. Die In-App wird **datenfrei** gebaut;
      Projektparameter kommen ausschließlich aus Presets/JSON, die der Nutzer lädt.
- [ ] ⭐ Auch der Golden-Master-Test darf keine Kundenzahlen enthalten → synthetischer Referenzfall
      im Repo, das Referenzprojekt-Referenzwerte bleiben im privaten Projektordner.
### M8.4b – Excel-Import (Parameter-Ingest aus dem Fachmodell)

**Zweck:** Der Erstimport eines Projekts kommt aus dem Excel-Modell des Fachplaners, nicht aus
Handeingabe. **Migrationspfad und Brücke, nicht Dauerzustand** — Zielbild ist, dass die Fachplaner
direkt in der Suite arbeiten (siehe „Parameter-Registry als Daten" in M8.2); Excel wird dann
nice-to-have. Solange das Modell aber in Excel gepflegt wird, ist es die fachliche Referenz.
(Der JSON-Export/-Import bleibt davon unberührt — der ist für den Austausch zwischen Nutzern.)

- [ ] 🔥 **Client-seitig parsen (SheetJS/`xlsx`).** Die Datei darf den Rechner des Nutzers **nicht**
      verlassen: kein Upload, kein Server-Roundtrip, keine Zwischenspeicherung. Erst ein expliziter
      Klick auf „Als Projekt speichern" schreibt Daten nach Supabase — beide Schritte im UI sichtbar
      getrennt. Grund: Die Modelle enthalten kundenvertrauliche CAPEX-Annahmen (siehe M8.4).
- [ ] 🔥 **Feste Schnittstelle statt Blatt-Durchsuchen.** Zuordnung über ein vereinbartes Blatt
      `99_Export` (Schlüssel/Bezeichnung/Einheit/Base/Best/Worst), das sich per Formel aus dem Modell
      speist. Zell-Adressen als Mapping sind zu brüchig — eine eingefügte Zeile verschiebt still alles.
      Fallback: Label-Suche über die Bezeichnungsspalte.
      → Vorschlag für den Fachplaner ist ausformuliert und liegt beim Projekt
      (`Excel-Schnittstelle_99_Export_Vorschlag.md`, privater Projektordner); 58 Zellreferenzen sind gegen
      das Modell verifiziert.
- [ ] 🔥 **Selbst-Check beim Import.** Eine `.xlsx` enthält zu jeder Formelzelle den von Excel zuletzt
      berechneten Wert. Das Export-Blatt liefert deshalb nicht nur die Eingaben, sondern auch die
      **Ergebnisse des Fachmodells**. Nach dem Import rechnet die Engine aus den importierten Eingaben
      nach und vergleicht:
      Übereinstimmung → Import **und** Rechenkern sind für diese Datei bewiesen.
      Abweichung → laute Warnung statt stiller Fehlrechnung.
      Fängt genau den gefährlichen Fall ab, dass im Fachmodell eine *Formel* geändert wurde und die
      Engine noch nach alter Logik rechnet. Macht jeden Import zum Regressionstest.
- [ ] 🔥 **Modellversion prüfen** (`99_Export!B2`): bei unbekannter Version warnen statt raten.
- [ ] 🔥 **Vorschau/Diff vor Übernahme** — nie still importieren. Anzeigen: erkannte Parameter, fehlende
      (Default greift), Abweichungen zum aktuellen Preset, Ergebnis des Selbst-Checks. Ein Import, der
      8 Parameter nicht findet und trotzdem eine schöne Zahl zeigt, ist schlimmer als kein Import.
- [ ] 📦 Nach Import automatisch die Plausibilitäts-/Korridor-Warnungen ausführen
- [ ] 💡 Unbekannte Schlüssel melden statt schlucken (Fachmodell hat einen neuen Parameter → Engine-Lücke)
- [ ] 💡 Sicherheit: `xlsx`-Version pinnen und aktuell halten (Prototype-Pollution-CVEs in der
      Vergangenheit); Parsen im Web Worker; keine Formelauswertung — nur gecachte Werte lesen

**Aufwand grob:** 2–3 PT (Parser, Mapping, Vorschau, Selbst-Check) + 0,5 PT Abstimmung des
Export-Blatts mit dem Fachplaner.

### M8.6 – Nachgelagert / bewusst nicht im ersten Wurf

Aus dem Scope-Termin 14.07.2026 — hier dokumentiert, damit es nicht als Lücke missverstanden wird:

- [ ] 💡 **Los-Schnitt / Vergaberecht** — Hinweise, wie die Gewerke für eine EU-weite Ausschreibung zu
      schneiden sind (Wärmepumpe, EMSR Niederspannung, EMSR Mittelspannung …). Lose lassen sich später
      nicht mehr umschneiden und bestimmen mit, welche Förderprogramme nutzbar sind. Vom Fachplaner
      ausdrücklich **höher gewichtet als das Vertiefen der anderen Technologien**.
- [ ] ⏸ **Monte-Carlo-Risikorechnung** statt Best/Worst (Kosten sind schief verteilt, nicht normal).
      Zielgruppe: **Banken / Projektfinanzierung**. Für einen Konzern mit fester Hurdle Rate irrelevant.
      Fachplaner-Einschätzung: Der Tornado ist „vollkommen good enough für den jetzigen Zeitpunkt".
- [ ] ⏸ **DCF-Rechnung je Technologie** — im Kunden-Foliensatz als „nächste Detailstufe" benannt
      (Next Step #2). CRF beantwortet „welche Technologie?", DCF „lohnt sich das Investment?"
      (jahresscharfe Preispfade, Steuern, Förderung, Finanzierungsstruktur → NPV/IRR). Aufwand laut
      Fachplaner **5–6 PT je Technologie** plus Abstimmungsrunden. Sinnvoll erst, wenn die
      Technologie eingegrenzt ist — und nach M8.0 ohnehin nur für die Geothermie relevant.
- [ ] ⏸ **Obertageanlagen-Kalkulation** (nach Kostentabelle + DeltaT)
- [ ] 💡 **PV/Batterie-Dimensionierung koppeln** — bekannter Modellfehler des Fachmodells, vom
      Fachplaner selbst gefunden: Wird die PV-Anlage kleiner dimensioniert, die Batterie aber gleich
      groß gelassen, schlägt das massiv in die Kosten. Beide müssen aneinander hängen.
      Niedrige Priorität, weil PV nach M8.0 nur Referenzannahme ist — aber ein Schieberegler, der
      Unsinn produziert, gehört zumindest mit einer Warnung versehen (Guardrail-Muster).
- [ ] ⏸ **Komponenten-Datenbank** (VDI o. ä., zertifizierte Wärmepumpen/Wärmetauscher) →
      Handlungsvorschlag „für COP X nimm Wärmepumpe Y". Kostenpflichtig, Verfügbarkeit offen.
- [ ] ⏸ **Live-Preisanbindung (EEX)** — im Kunden-Foliensatz zugesagt, vom Fachplaner aber als wenig
      sinnvoll eingeschätzt („macht glaube ich keinen Sinn"). Vor dem Bau klären. Wahrscheinlich
      bessere Alternative: **Annahmen-Review** — das Tool prüft periodisch, ob die hinterlegten
      Referenzannahmen noch aktuell sind („gibt es neue Forschungslagen?"). Passt besser zum Charakter
      der anderen Technologien als Referenzannahmen und ist deutlich wartungsärmer.

### M8.5 – Auslieferung an Einzelkunden

- [ ] 📦 Whitelabel-/Standalone-Extraktion für der Kunde gemäß BRIEF §6.1 („Jede In-App kann als
      eigenständiges Repository extrahiert und an einen einzelnen Kunden ausgeliefert werden") und
      Preismodell „Standalone-Lizenz". Kein eigenes Repo für die Entwicklung — nur für die Auslieferung.
- [ ] 💡 Kein Tauri: Die PWA-Leitplanke (BRIEF §6.1.8, „Installierbar auf Desktop und Mobile,
      Offline-First für die Rechner-Logik") deckt den Desktop-Bedarf ohne Code-Signing und
      Update-Infrastruktur ab.

---

**DoD M8:** `/lcoh` ist als In-App registriert und login-geschützt erreichbar. Der Rechenkern
reproduziert die Referenzmatrix des Fachmodells zellgenau (Vitest, synthetischer Fall). Das
Tornado-Diagramm ersetzt die manuelle Sensitivitätsanalyse vollständig. Break-even und
Kostenziel-Modus laufen. Produktlayer sind wählbar. Widersprüchliche Kostenquellen werden als
Spanne mit Quellenangabe gezeigt, nicht stillschweigend aufgelöst. Die Verkettung
`/deltat` → `/bohrkost` → `/lcoh` → `/projects` funktioniert. Keine Kundendaten im Repo.

**Bekannte Abhängigkeiten von außen** (blockieren Teile von M8, nicht das Ganze):
M8.0b (Gate-Parameter), M8.1 (Kostenaufschlüsselung der Bohrangebote — bewusst zurückgestellt),
M8.1c (Methodik-Konvention), M8.4b (Export-Blatt im Fachmodell).

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
