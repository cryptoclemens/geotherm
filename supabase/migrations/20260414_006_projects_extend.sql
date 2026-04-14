-- Migration: projects-Tabelle um fehlende Spalten erweitern
-- Erstellt: 2026-04-14

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_type text
    CHECK (project_type IN ('Dublette','Einzelbohrung','Explorationsbohrung','EGS')),
  ADD COLUMN IF NOT EXISTS status text
    CHECK (status IN ('Idee','Planung','Aktiv','Archiviert')),
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS geological_data jsonb,
  ADD COLUMN IF NOT EXISTS bohrkost_input jsonb,
  ADD COLUMN IF NOT EXISTS bohrkost_result jsonb;

-- Performance-Index für Filterung nach Typ/Status
CREATE INDEX IF NOT EXISTS projects_project_type_idx ON public.projects (project_type);
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects (status);
