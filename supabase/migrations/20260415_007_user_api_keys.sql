-- Migration: user_api_keys — BYOK (Bring Your Own Key) LLM-API-Schlüssel
-- Geotherm M5 · April 2026
--
-- Speichert verschlüsselte API-Schlüssel pro Nutzer und Provider.
-- Die eigentliche AES-256-GCM-Verschlüsselung erfolgt serverseitig
-- in Node.js (src/lib/crypto/apiKeyEncryption.ts) vor dem Eintragen.
-- In der Datenbank wird nur das Chiffrat gespeichert — kein Klartext-Key.

CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT        NOT NULL
                              CHECK (provider IN ('anthropic','openai','azure_openai','perplexity')),
  -- Anzeige-Hint: z.B. "sk-ant-•••••api4" — NIE der echte Key
  key_hint      TEXT        NOT NULL,
  -- AES-256-GCM verschlüsselt: base64(iv[16] || tag[16] || ciphertext)
  key_encrypted TEXT        NOT NULL,
  -- Nur für Azure OpenAI relevant
  azure_endpoint TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Pro Nutzer + Provider nur ein aktiver Eintrag
  UNIQUE (user_id, provider)
);

-- RLS aktivieren
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Nutzer kann nur eigene Keys lesen
CREATE POLICY user_api_keys_select_own ON public.user_api_keys
  FOR SELECT USING ((select auth.uid()) = user_id);

-- Nutzer kann eigene Keys anlegen
CREATE POLICY user_api_keys_insert_own ON public.user_api_keys
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Nutzer kann eigene Keys aktualisieren (z.B. azure_endpoint, is_active)
CREATE POLICY user_api_keys_update_own ON public.user_api_keys
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Nutzer kann eigene Keys löschen
CREATE POLICY user_api_keys_delete_own ON public.user_api_keys
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Performance-Index
CREATE INDEX IF NOT EXISTS user_api_keys_user_id_idx
  ON public.user_api_keys (user_id);

-- Auto-Timestamp
CREATE TRIGGER user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
