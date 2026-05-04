# Feedback + Telegram-Bot Setup — Referenz

Dieses Dokument beschreibt das vollständige Feedback-System von Geotherm als Blaupause für neue Projekte. Es umfasst In-App-Feedback-Modal, Supabase-Speicherung, GitHub-Sync und Telegram-Benachrichtigungen via Watchtower-Bot.

---

## Architektur-Übersicht

```
Browser (eingeloggter Nutzer)
  └─ FeedbackModal (floating button)
       └─ POST /api/feedback
            ├─ Supabase: INSERT INTO <schema>.feedback
            └─ GitHub Contents API: feedback.md updaten

Watchtower-Bot (Python, alle 5 Min.)
  └─ GET /rest/v1/feedback (Accept-Profile: <schema>)
       └─ Telegram-Nachricht an WHITELIST-Chats
```

---

## Komponenten

### 1. FeedbackModal (`src/core/ui/FeedbackModal.tsx`)

Floating-Pill-Button unten rechts, öffnet ein Modal mit:
- Sterne-Rating (1–5, optional)
- App-Selektor (welcher Bereich der App)
- Kategorie (bug, ui-design, feature-wunsch, performance, datenqualitaet, sonstiges)
- Freitextfeld
- DSGVO-Consent-Checkbox

**Wichtig:** Enthält `if (!user) return null` — rendert nichts ohne Auth.

### 2. Pfad-Erkennung (`src/core/ui/FeedbackTrigger.ts`)

```ts
export function deriveInApp(pathname: string): InApp {
  // Mappt /atlas, /deltat, /bohrkost, /docs → App-Name
  // Alles andere → 'allgemein'
}
```

Enthält Unit-Tests (`FeedbackTrigger.test.ts`). Bei neuen Apps hier eintragen.

### 3. Globale Einbindung (`src/core/layout/GlobalFeedbackButton.tsx`)

```tsx
'use client'
export function GlobalFeedbackButton() {
  const pathname = usePathname()
  return <FeedbackModal defaultInApp={deriveInApp(pathname)} />
}
```

Eingebunden in `src/app/(app)/layout.tsx` — hinter `RequireAuth`, also nur für eingeloggte Nutzer sichtbar. **Nicht** im Root-Layout, damit öffentliche Seiten keinen Button zeigen.

### 4. API-Route (`src/app/api/feedback/route.ts`)

Server-seitiger POST-Handler:
1. Auth-Check via Supabase (`supabase.auth.getUser()`)
2. Zod-Validierung des Request-Body
3. INSERT in `<schema>.feedback` (Supabase)
4. Async GitHub-Sync (kein Fehler bei Scheitern — degradiert graceful)
5. `github_synced`-Flag in DB aktualisieren

### 5. GitHub-Sync (`src/lib/feedback/github-sync.ts`)

Appended neues Feedback als Markdown-Block in `feedback.md` via GitHub Contents API (GET sha → PUT mit neuem Inhalt). Einfüge-Punkt: vor dem `## Format-Beispiel`-Separator.

**Env-Variablen (server-only, nie `NEXT_PUBLIC_`):**
```
GITHUB_FEEDBACK_TOKEN=github_pat_...   # PAT mit Contents read+write
GITHUB_FEEDBACK_REPO=owner/repo        # z.B. cryptoclemens/geotherm
```

**GitHub-PAT erstellen:**
1. github.com → Settings → Developer Settings → Fine-grained personal access tokens
2. Repository access: nur das Ziel-Repo
3. Permissions: Contents → Read and write

---

## Supabase-Schema

```sql
CREATE TABLE <schema>.feedback (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  in_app        TEXT NOT NULL CHECK (in_app IN ('allgemein', 'gpa', 'deltat', 'bohrkost', 'docs')),
  category      TEXT NOT NULL CHECK (category IN ('bug', 'ui-design', 'feature-wunsch', 'performance', 'datenqualitaet', 'sonstiges')),
  stars         INT CHECK (stars BETWEEN 1 AND 5),
  message       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'triage', 'in-arbeit', 'erledigt', 'wontfix')),
  app_version   TEXT,
  user_agent    TEXT,
  github_synced BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE <schema>.feedback ENABLE ROW LEVEL SECURITY;
-- RLS: Nutzer sehen nur eigenes, Admins alles (siehe init-db.sql für vollständige Policies)
```

**Für Multi-Schema-Setups (self-hosted Supabase):** PostgREST benötigt das Schema in `PGRST_DB_SCHEMAS`. Nach Schema-Änderungen Cache leeren:
```bash
docker exec supabase-db psql -U postgres -c "NOTIFY pgrst, 'reload schema';"
# Falls NOTIFY nicht reagiert:
docker restart supabase-rest
```

---

## Telegram-Bot (Watchtower-Bot)

Polling-basiert, kein Webhook. Code: `/root/server/watchtower-bot/bot.py`

### Geotherm-spezifische Teile

**Schema-Header für Multi-Schema-Supabase:**
```python
def _supabase_headers(schema: str | None = None) -> dict:
    headers = {"apikey": KEY, "Authorization": f"Bearer {KEY}", ...}
    if schema:
        headers["Accept-Profile"] = schema
    return headers
```

**Fetch-Funktion:**
```python
async def _fetch_geotherm_feedback(since=None, limit=5):
    url = f"{SUPABASE_URL}/rest/v1/feedback?select=id,created_at,in_app,category,stars,message,email&..."
    resp = await client.get(url, headers=_supabase_headers(schema="geotherm"))
```

**Polling-Loop** (parallel zu AutoToDo via `asyncio.create_task`):
```python
async def _on_startup(application):
    asyncio.create_task(_feedback_polling_loop(application))      # AutoToDo (public schema)
    asyncio.create_task(_geotherm_polling_loop(application))      # Geotherm (geotherm schema)
```

**State-Datei** (`/data/feedback_state.json`): speichert `feedback_last_seen` und `geotherm_feedback_last_seen` getrennt, damit beide Loops unabhängig funktionieren.

### Bot-Commands
| Command | Funktion |
|---|---|
| `/feedback [n]` | Letzte n AutoToDo-Einträge |
| `/geofeedback [n]` | Letzte n Geotherm-Einträge |
| `/status` | Laufende Docker-Container |
| `/check` | Watchtower Update-Check |
| `/update` | Container-Updates (mit Bestätigung) |

### Bot neu bauen (nach Code-Änderungen)
```bash
# Nur restart reicht nicht — Image muss neu gebaut werden:
docker compose -f /root/server/docker-compose.infra.yml build watchtower-bot
docker compose -f /root/server/docker-compose.infra.yml up -d watchtower-bot
```

---

## Neues Projekt einbinden — Checkliste

1. **Supabase-Tabelle** anlegen (SQL oben, Schema anpassen)
2. **`in_app`-Constraint** um neue App-Namen erweitern
3. **`FeedbackTrigger.ts`**: neuen Pfad in `PATH_MAP` eintragen
4. **`GlobalFeedbackButton`** oder eigene Einbindung im Layout
5. **API-Route** kopieren, Schema-Env-Var anpassen
6. **GitHub-PAT** erstellen, `GITHUB_FEEDBACK_TOKEN` + `GITHUB_FEEDBACK_REPO` setzen
7. **Watchtower-Bot**: `_fetch_<projekt>_feedback` + `_<projekt>_polling_loop` hinzufügen, `schema="<name>"` als Header
8. **Bot-Image neu bauen** (siehe oben)
9. **`feedback.md`** im Repo anlegen mit `## Format-Beispiel`-Separator
10. **PostgREST-Schema** in `PGRST_DB_SCHEMAS` eintragen

---

## Env-Variablen-Übersicht

| Variable | Wo | Zweck |
|---|---|---|
| `GITHUB_FEEDBACK_TOKEN` | `.env` (server-only) | GitHub PAT, Contents read+write |
| `GITHUB_FEEDBACK_REPO` | `.env` | `owner/repo` |
| `NEXT_PUBLIC_SUPABASE_SCHEMA` | `.env` | Schema-Name für PostgREST-Client (z.B. `geotherm`) |
| `SUPABASE_URL` | Bot `.env` | Interne Supabase-URL (`http://supabase-kong:8000`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Bot `.env` | Service-Role-Key der self-hosted Instanz |

---

## Bekannte Fallstricke

- **`GITHUB_FEEDBACK_TOKEN` niemals mit `NEXT_PUBLIC_`** — landet sonst im Browser-Bundle
- **PostgREST-Schema-Cache** nach `ALTER TABLE` leeren (NOTIFY oder Container-Restart)
- **`ALTER DEFAULT PRIVILEGES`** gilt nicht rückwirkend für nachträglich hinzugefügte Spalten — nach `ALTER TABLE ADD COLUMN` explizit `GRANT ALL ON ALL TABLES IN SCHEMA <name> TO ...` ausführen
- **Bot `restart` baut kein neues Image** — immer `build` + `up -d` verwenden
- **User-IDs unterscheiden sich** zwischen Supabase-Cloud und self-hosted — bei Datenmigration UUID-Mapping prüfen
