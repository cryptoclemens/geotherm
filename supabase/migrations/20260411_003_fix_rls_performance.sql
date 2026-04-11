-- Migration: RLS Performance + Security Fixes
-- Applied: 2026-04-11 via Supabase MCP
-- Fixes: function_search_path_mutable, unindexed_foreign_key, auth_rls_initplan, multiple_permissive_policies

-- ── 1. Fix: set_updated_at — mutable search_path (Security WARN) ────────────
ALTER FUNCTION public.set_updated_at() SET search_path = '';

-- ── 2. Fix: fehlender Index auf feedback.user_id (Performance INFO) ─────────
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON public.feedback (user_id);

-- ── 3. Fix: RLS-Policies — profiles ─────────────────────────────────────────
-- Problem: auth.uid() wird per-row neu ausgewertet + zwei SELECT-Policies
-- Lösung: (select auth.uid()) einmalig + eine kombinierte SELECT-Policy

DROP POLICY IF EXISTS profiles_select_own   ON public.profiles;
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own   ON public.profiles;

-- Kombinierte SELECT-Policy: eigenes Profil ODER Admin
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (
    (select auth.uid()) = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

-- UPDATE: nur eigenes Profil
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ── 4. Fix: RLS-Policies — feedback ─────────────────────────────────────────
DROP POLICY IF EXISTS feedback_insert_own  ON public.feedback;
DROP POLICY IF EXISTS feedback_select_own  ON public.feedback;
DROP POLICY IF EXISTS feedback_all_admin   ON public.feedback;

-- INSERT: nur eigene Einträge
CREATE POLICY feedback_insert_own ON public.feedback
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Kombinierte SELECT-Policy: eigene Einträge ODER Admin
CREATE POLICY feedback_select ON public.feedback
  FOR SELECT USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

-- UPDATE + DELETE: nur Admins
CREATE POLICY feedback_update_admin ON public.feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

CREATE POLICY feedback_delete_admin ON public.feedback
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );
