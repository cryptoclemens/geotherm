-- Migration: projects-Tabelle für gespeicherte DeltaT-Projekte
-- Erstellt: 2026-04-11

CREATE TABLE IF NOT EXISTS public.projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  location      jsonb,
  deltat_input  jsonb,
  deltat_result jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS: Nutzer sehen nur eigene Projekte
CREATE POLICY "projects_select_own"
  ON public.projects
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "projects_insert_own"
  ON public.projects
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "projects_update_own"
  ON public.projects
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "projects_delete_own"
  ON public.projects
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Performance-Indizes
CREATE INDEX projects_user_id_idx ON public.projects (user_id);
CREATE INDEX projects_created_at_idx ON public.projects (created_at DESC);

-- Auto-Update für updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
