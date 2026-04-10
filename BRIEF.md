# BRIEF – Geotherm by Vencly

**Stand:** April 2026
**Repository:** [github.com/cryptoclemens/geotherm](https://github.com/cryptoclemens/geotherm) *(privat)*
**Zieldomain:** [geotherm.vencly.com](https://geotherm.vencly.com)
**Tech-Stack:** Next.js 15 (App Router) · shadcn/ui · Tailwind 4 · MDX · Supabase · PWA

---

## 1. Vision

**Geotherm** ist die erste modulare **Geothermie-Suite im Web** — eine einheitliche Plattform, die alle Werkzeuge entlang des Geothermie-Projektlebenszyklus bündelt:

> **Vom Standort zum Bohrplan in einem Workflow.**

Statt isolierter Tools, bei denen Planer zwischen Excel, QGIS, händischen Berechnungen und PDF-Gutachten hin- und herspringen, bietet Geotherm einen **durchgängigen digitalen Workflow** mit geteilten Daten, einem gemeinsamen Nutzerkonto und einer integrierten Feedback-Schleife, die das Produkt mit jeder Session besser macht.

---

## 2. Das Produkt

### 2.1 Modulare Architektur

Geotherm ist keine monolithische App, sondern ein **App-Container**. Jede Teil-App (im Folgenden *In-App*) ist ein eigenständiges Feature-Modul mit klaren Grenzen:

- **Eigener Route-Slot** (`/atlas`, `/deltat`, …) via Next.js App Router
- **Eigener State-Slice** (Zustand-Store pro App)
- **Eigene DB-Schema-Namespaces** (`gpa_*`, `deltat_*`, …)
- **Eigenes Go-to-Market**: Jede In-App kann als **Standalone-Produkt** herausgeschnitten und an einen einzelnen Kunden lizenziert werden

### 2.2 In-Apps zum Launch

| Code | Name | Beschreibung |
|---|---|---|
| **GPA** | Geothermie-Potenzial-Atlas | Interaktive Karte des norddeutschen Tieflandes mit Overlay für Lockergestein, Fernwärme-Städte, Industriewärmequellen und Rechenzentren |
| **DeltaT** | Dubletten-Auslegungsrechner | Echtzeit-Rechner für geothermische Dubletten-Systeme (Förder- und Reinjektionsbohrung) mit WP-Dimensionierung |

### 2.3 Daten-Austausch zwischen Apps

Kern der Plattform: Die In-Apps können **Daten austauschen**, bleiben dabei aber lose gekoppelt:

**Beispiel-Workflow „Atlas → Rechner":**
1. Nutzer sucht in **GPA** nach vielversprechenden Standorten
2. Klickt auf einen Marker → Popup mit geologischen Kennwerten
3. Button **„In DeltaT öffnen"** → Parameter werden in DeltaT vorbefüllt
4. Ergebnis wird als *Projekt* gespeichert (verknüpft mit dem ursprünglichen Standort)

**Beispiel-Workflow „Rechner → Atlas":**
1. Nutzer rechnet in **DeltaT** eine fiktive Dublette durch
2. Klickt **„Wo gibt's solche Bedingungen?"** → GPA filtert die Karte entsprechend

### 2.4 Roadmap für weitere In-Apps (ab Q3)

- **Bohrkosten-Kalkulator** – CAPEX/OPEX pro Projekt
- **Wirtschaftlichkeit (LCOH)** – Levelized Cost of Heat über 25 Jahre
- **Genehmigungs-Guide** – Bundesland-spezifische Checklisten für WHG-Anträge
- **Netzanschluss-Planer** – Distanz zu nächstem Fernwärmenetz + Anschlusskosten
- **CO₂-Einsparungs-Report** – Vergleich gegen Gas/Öl-Heizlösungen

---

## 3. Feedback-Driven Development (Kern-Prinzip)

### 3.1 Warum

Alpha-/Beta-Produkte sterben häufig an der **fehlenden Feedback-Schleife**: Nutzer geben Feedback per E-Mail, das landet im Posteingang, wird vergessen, und Verbesserungen werden priorisiert nach dem Bauchgefühl des Entwicklers. Geotherm bricht dieses Muster.

### 3.2 Das Konzept

Jeder eingeloggte Nutzer kann **direkt aus jeder In-App** Feedback geben:

- **Struktur:** Zwei Dropdowns — `in_app` (GPA / DeltaT / Allgemein / Docs) und `category` (Bug / Idee / UI / Performance / Datenqualität / Sonstiges)
- **Attribution:** E-Mail-Adresse des Nutzers wird automatisch angehängt *(nur möglich weil Repo privat + Auth-Pflicht)*
- **Kontext:** App-Version, User-Agent, optional Sterne-Rating
- **Zwei-Kanal-Speicherung:**
  1. **Supabase-Tabelle** `feedback` (primär, privat, mit E-Mail, RLS)
  2. **GitHub `feedback.md`** (sekundär, im Repo, für Claude Code lesbar)

### 3.3 Die Magie: Claude Code liest `feedback.md` bei jedem Session-Start

Beim Start jeder Claude-Code-Sitzung im Geotherm-Repo wird ein **SessionStart-Hook** ausgeführt, der:

1. `feedback.md` öffnet und parst
2. Offene und noch-nicht-triagierte Items zählt
3. Claude den Auftrag gibt: *„Lies die Datei, priorisiere nach Impact und App-Zugehörigkeit, gruppiere zu sinnvollen Arbeitspaketen mit S/M/L-Schätzung, und schlage dem Nutzer vor, womit gestartet werden soll."*

**Effekt:** Jede Session beginnt mit einer kompakten Triage-Präsentation statt mit einer leeren Session. Feedback verschwindet nicht in einem Posteingang, sondern wird systematisch in Arbeitspakete überführt.

### 3.4 DSGVO-Compliance

Da das Repo `cryptoclemens/geotherm` **privat** ist, darf die E-Mail direkt in `feedback.md` stehen — Art. 5 DSGVO (Datenminimierung) ist gewahrt, weil der Zugriff auf autorisierte Entwickler beschränkt ist. Nutzer erteilen beim Senden explizit ihr Einverständnis *(Consent per Checkbox im Modal)*. Löschanfragen werden durch manuelles Entfernen aus `feedback.md` + Supabase-Tabelle umgesetzt (SLA: 30 Tage).

---

## 4. Zielgruppen

### 4.1 Primäre Zielgruppe (Jahr 1)

**Geothermie-Projektentwickler** (5–50 MA):
- Brauchen schnelle Vorabschätzungen für Akquise
- Jonglieren zwischen Excel, QGIS und PowerPoint
- Zahlungsbereit: 500–2.000 €/Jahr pro Lizenz

**Energieversorger & Stadtwerke** (Fernwärme-Betreiber):
- Evaluieren Dekarbonisierungs-Strategien für ihre Wärmenetze
- Brauchen belastbare Zahlen für Vorstandspräsentationen
- Zahlungsbereit: 5.000–20.000 €/Jahr (Enterprise-Lizenz)

### 4.2 Sekundäre Zielgruppen

**Ingenieurbüros & Gutachter:** Sanity-Checks für eigene FEFLOW-Simulationen. Vertrieb über Partnerschaften / Whitelabel.

**Kommunen & Landkreise:** Bedarfsanalyse für kommunale Wärmepläne (§ 4 WPG). Einstiegs-Targeting über Verbände & Cluster.

**Forschung & Lehre:** Kostenlose Ausbildungslizenzen für Unis.

### 4.3 Nicht-Zielgruppen

- ❌ Endkunden / Privathaushalte
- ❌ Internationale Nutzer ohne DACH-Bezug *(Jahr 1)*
- ❌ Tiefengeothermie > 2.500 m *(aktuell nicht im Scope)*

---

## 5. Positionierung

### 5.1 Wettbewerbs-Landkarte

| Tool | Stärke | Schwäche vs. Geotherm |
|---|---|---|
| **FEFLOW, TOUGH2, COMSOL** | Industriestandard für 3D-Simulation | Teuer, Ingenieur-only, keine Karten-Integration |
| **Excel-Vorlagen (diverse)** | Vertraut, offline nutzbar | Keine Echtzeit, kein Teamwork, fehleranfällig |
| **QGIS + BGR-WMS** | Kostenlos, mächtig | Steile Lernkurve, keine Berechnung |
| **BGR Geothermis-Portal** | Offizielle Datenquelle | Nur Viewer, keine Projektplanung |
| **Geothermie.ch (CH)** | Ähnlicher Ansatz für CH | Nur CH, kein Rechner |

**Unser USP:** *Der einzige Webservice, der Kartendaten, Auslegungsrechner und Wirtschaftlichkeit in einem nahtlosen Workflow verbindet — mit integriertem, AI-gestütztem Feedback-Loop, ohne Installation, mit deutschem Fokus und wissenschaftlich validierten Formeln.*

### 5.2 Preismodell (Hypothese)

| Tier | Preis | Features |
|---|---|---|
| **Free** | 0 € | Atlas-Viewer, DeltaT eingeschränkt (keine Speicherung), PDF mit Wasserzeichen |
| **Pro** | 49 €/Mo | Alle In-Apps, unbegrenzte Projekte, PDF-Export, Multi-Device, PWA-Offline |
| **Team** | 149 €/Mo | Pro + Teamfreigabe, Team-Workspaces, Billing |
| **Enterprise** | ab 5.000 €/Jahr | SLA, On-Prem-Deployment auf Hetzner, Whitelabel, Custom In-Apps |
| **Standalone-Lizenz** | Verhandlung | Eine einzelne In-App als eigenständige White-Label-Instanz |

---

## 6. Technische Prinzipien

### 6.1 Leitplanken

1. **Cloud-agnostisch**: Kein Vendor-Lock-in. Jede In-App muss auch auf einer einzelnen Hetzner-VM laufen können (Migration Vercel/Supabase → Hetzner darf max. 1 Woche Arbeit sein).
2. **Standalone-fähig**: Jede In-App kann als eigenständiges Repository extrahiert und an einen einzelnen Kunden ausgeliefert werden.
3. **Wissenschaftlich validiert**: Alle Berechnungsformeln haben Quellenangaben (VDI, DIN, EN, peer-reviewed Paper).
4. **Datenschutz by Design**: DSGVO-konform. Keine Tracking-Cookies ohne Consent. Daten bleiben in der EU.
5. **Echtzeit-UX**: Kein „Submit"-Button. Jede Eingabe aktualisiert alle abhängigen Werte sofort.
6. **Mobile-first + Desktop-first**: Funktioniert auf beiden gleich gut — Haupt-Use-Case ist Desktop (Planungsarbeit).
7. **Accessibility**: WCAG 2.1 AA als Minimum.
8. **PWA-fähig**: Installierbar auf Desktop und Mobile, Offline-First für die Rechner-Logik.
9. **Feedback-zentrisch**: Jede In-App hat einen sichtbaren Feedback-Button. Feedback landet in `feedback.md` und wird zu Arbeitspaketen.

### 6.2 Tech-Stack

| Layer | Wahl | Begründung |
|---|---|---|
| **Framework** | **Next.js 15** (App Router) | SSR/SSG für SEO, Route Groups für modulare In-Apps, Server Actions für Auth & Feedback |
| **Styling** | Tailwind CSS 4 | Standard, schnell, Design-Tokens |
| **UI-Kit** | **shadcn/ui** | Copy-Paste Komponenten auf Radix-UI — kein npm-Dependency, volle Kontrolle, ideal für Whitelabel |
| **Icons** | lucide-react | Standard-Icons, Tree-Shakeable |
| **State (Client)** | Zustand | Leicht, wenig Boilerplate |
| **State (Server)** | TanStack Query | Caching, Background Refetch |
| **Forms** | react-hook-form + zod | Type-safe Validation |
| **Content** | **MDX** für Landing/Legal-Seiten | Nicht-technische Editoren können Texte anpassen |
| **Auth** | Supabase Auth (via `@supabase/ssr`) + eigener `useAuth()`-Hook als Abstraktionsschicht | Migrations-sicher |
| **DB** | Postgres (Supabase → später Hetzner) | Portabel |
| **Maps** | `react-leaflet` (Dynamic Import, `ssr: false`) | Bewährt aus Geopotatlas |
| **PWA** | `@serwist/next` | Moderner Service-Worker, einfache Integration |
| **Analytics** | Plausible (self-hosted auf Hetzner) | DSGVO-konform |
| **Error-Tracking** | Sentry (optional, Consent-gated) | Production-Monitoring |
| **Deployment Start** | Vercel | Next.js-nativ, Preview-Deployments |
| **Deployment Ziel** | Hetzner VM mit Docker (`output: 'standalone'`) | Migration in ~1 Woche möglich |
| **Testing** | Vitest + Playwright | Unit + E2E |

### 6.3 Migrationspfad Vercel/Supabase → Hetzner

Ab Tag 1 so gebaut, dass Migration ohne Code-Änderung funktioniert:

1. **Env-basierte Config**: Keine hardcoded URLs. Alle Backend-Endpunkte aus `NEXT_PUBLIC_*` Env-Vars.
2. **Eigener Auth-Adapter**: `useAuth()`-Hook als einziger Zugriffspunkt, nutzt intern Supabase — später austauschbar gegen Keycloak.
3. **REST-only**: Keine Supabase-spezifischen Features (Realtime, Storage-Buckets).
4. **DB-Schema portabel**: Reines Postgres, keine Extensions.
5. **Next.js Standalone-Build**: `output: 'standalone'` in `next.config.js` → Minimum-Node-Bundle für Docker.
6. **Dockerfile + docker-compose.yml** von Anfang an vorhanden.
7. **nginx.conf** für Reverse-Proxy auf Hetzner mit Let's Encrypt.

---

## 7. Rechtliche Rahmenbedingungen

### 7.1 Betreiber

**vencly GmbH**
Leopoldstraße 31, 80802 München
HRB 290524 (AG München)
USt-ID: DE367131457
Vertretungsberechtigt: Clemens Eugen Theodor Pompeÿ
Kontakt: hello@vencly.com

### 7.2 Compliance-Anforderungen

- **DSGVO**: Vollständige Datenschutzerklärung mit Auskunftsrecht, Löschrecht, Portabilität
- **TMG § 5**: Impressum mit allen Pflichtangaben
- **AGB**: Nutzungsbedingungen für Free + Pro; separate Verträge für Enterprise
- **Haftungsausschluss**: Explizit, dass Geotherm eine *Vorauslegung* liefert
- **Cookie-Banner**: Essential-only ohne Banner; Analytics erst nach Zustimmung
- **Legal-Seiten** als eigene Routen: `/impressum`, `/datenschutz`, `/agb`, `/security`
- **Feedback-Consent**: Checkbox im Modal („Ich bin einverstanden, dass mein Feedback inkl. E-Mail für Produktverbesserung gespeichert wird")

### 7.3 Wissenschaftlicher Disclaimer

Alle Berechnungen sind für die **Machbarkeitsebene (Feasibility Level)** geeignet. Für Investitionsentscheidungen oder Genehmigungsverfahren zusätzlich erforderlich:

- Hydrogeologisches Gutachten mit Wasseranalyse (Cl⁻, H₂S, pH, T)
- 3D-Simulation der Wärmeausbreitung (FEFLOW, TOUGH2 oder COMSOL)
- Standortspezifische Untersuchungen zu Aquifer-Heterogenität
- Detaillierte Wirtschaftlichkeitsberechnung

Dieser Disclaimer muss auf jeder Rechner-Seite prominent sichtbar sein.

---

## 8. Erfolgskriterien (6 Monate nach Launch)

### Must-have (Q2 2026)

- [ ] 1.000 registrierte Nutzer (Free)
- [ ] 50 zahlende Pro-Kunden
- [ ] 5 Enterprise-Leads im Sales-Funnel
- [ ] 99.5 % Uptime
- [ ] < 2 s Time-to-Interactive auf 3G-Mobile
- [ ] Lighthouse-Score ≥ 95 für Landing + Legal
- [ ] 100 Feedback-Items in `feedback.md`, davon 60+ als „erledigt" getriaged
- [ ] 0 DSGVO-Beschwerden / Abmahnungen

### Nice-to-have (Q3–Q4 2026)

- [ ] 3 zahlende Enterprise-Kunden
- [ ] 1 verkaufte Standalone-Lizenz (Whitelabel)
- [ ] 3. In-App (Bohrkosten oder LCOH) live
- [ ] Integration mit QGIS (Plugin oder Export)
- [ ] Erste Press-Coverage in Branchenmagazin

---

## 9. Offene strategische Fragen

1. **Open-Source-Kernel oder Closed?** Kern-Shell-Code könnte MIT-lizenziert werden — erleichtert Akquise, verkompliziert das Modell.
2. **Whitelabel-Pricing**: Einmalzahlung oder Revenue-Share?
3. **Datenpartnerschaften**: BGR, Landesämter, Energieagenturen → eigene API-Zugänge aushandeln?
4. **Internationalisierung**: Wann Schweiz und Österreich dazunehmen?
5. **Multi-Tenant-Architektur**: Jeder Enterprise-Kunde auf eigener Hetzner-Instanz oder shared Postgres mit RLS?
6. **Feedback-Moderation**: Automatische Spam-Erkennung oder manuell?

---

## 10. Historie

| Datum | Meilenstein |
|---|---|
| März 2026 | DeltaT Alpha live auf GitHub Pages (Single-File React) |
| März 2026 | Geopotatlas internes Tool live (Vite + React + Passwort-Gate) |
| April 2026 | **Dieser Brief** — Entscheidung zur Verschmelzung in Geotherm-Suite mit Next.js + Feedback-Loop |
| *geplant Q2 2026* | Geotherm Beta mit GPA + DeltaT + Auth + Feedback |
| *geplant Q3 2026* | Geotherm Public Launch mit Pro-Tier |
| *geplant Q4 2026* | 3. In-App live, erste Enterprise-Kunden |
