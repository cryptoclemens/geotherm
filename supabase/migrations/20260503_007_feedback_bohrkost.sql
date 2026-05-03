-- Migration: bohrkost zu feedback.in_app-Constraint ergänzen
-- Geotherm · Mai 2026

ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_in_app_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_in_app_check
  CHECK (in_app IN ('allgemein', 'gpa', 'deltat', 'bohrkost', 'docs'));
