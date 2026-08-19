-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 14b Fix
-- Allow public read on membership_terms for QR verification
--
-- Problem: The /verify/[token] page does a nested join:
--   membership_tokens → membership_terms → profiles
-- The membership_tokens table has a "public verify read" policy,
-- but membership_terms only allows "user read own" and "admin manage".
-- This means anyone scanning a QR code (not logged in as the term
-- owner) gets null for the nested join, causing "Invalid Verification
-- Link" even when the token is valid.
--
-- Fix: Add a public read policy on membership_terms so the nested
-- join works for verification. This is safe because membership_terms
-- only contains tier, dates, and is_active — no sensitive PII.
-- The profiles table already has a public read policy.
-- ============================================================

-- Drop the old restrictive policies (keep admin manage)
DROP POLICY IF EXISTS "membership_terms: user read own" ON public.membership_terms;
DROP POLICY IF EXISTS "membership_terms: admin manage" ON public.membership_terms;

-- Recreate with public read + admin manage
CREATE POLICY "membership_terms: public read"
  ON public.membership_terms FOR SELECT
  USING (TRUE);

CREATE POLICY "membership_terms: admin manage"
  ON public.membership_terms FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
