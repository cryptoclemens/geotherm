-- Migration: Supabase Auth Site-URL Konfiguration (Dokumentation)
-- Erstellt: 2026-04-11
--
-- HINWEIS: Die Site-URL kann NICHT via SQL gesetzt werden.
-- Muss im Supabase Dashboard konfiguriert werden:
--
--   Authentication > URL Configuration
--   Site URL:      https://geotherm.vencly.com
--   Redirect URLs: https://geotherm.vencly.com/**
--                  http://localhost:3000/**
--
-- Workaround (Beta): User manuell bestätigen:
--   UPDATE auth.users SET email_confirmed_at = NOW(), updated_at = NOW()
--   WHERE email = 'user@example.com';

SELECT 'Auth Site-URL muss im Supabase Dashboard gesetzt werden' AS hinweis;
