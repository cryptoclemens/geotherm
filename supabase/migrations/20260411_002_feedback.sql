-- Migration: feedback-Tabelle
-- Geotherm M2.5 · April 2026

CREATE TABLE IF NOT EXISTS feedback (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  in_app        TEXT NOT NULL
                  CHECK (in_app IN ('allgemein', 'gpa', 'deltat', 'docs')),
  category      TEXT NOT NULL
                  CHECK (category IN ('bug', 'ui-design', 'feature-wunsch', 'performance', 'datenqualitaet', 'sonstiges')),
  stars         INT CHECK (stars BETWEEN 1 AND 5),
  message       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'offen'
                  CHECK (status IN ('offen', 'triage', 'in-arbeit', 'erledigt', 'wontfix')),
  app_version   TEXT,
  user_agent    TEXT,
  github_synced BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Nutzer kann eigenes Feedback einsenden
CREATE POLICY "feedback_insert_own"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Nutzer kann eigenes Feedback lesen
CREATE POLICY "feedback_select_own"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Admin darf alles
CREATE POLICY "feedback_all_admin"
  ON feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
