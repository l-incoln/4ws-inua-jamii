-- ============================================================
-- Phase 11d: Member verification fields
-- ============================================================

-- Add ID verification columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_document_url TEXT,
  ADD COLUMN IF NOT EXISTS id_document_name TEXT,
  ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS id_verified_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Add site settings for verification toggles
INSERT INTO public.site_settings (key, value)
VALUES
  ('require_id_verification', 'false'),
  ('require_phone_verification', 'false')
ON CONFLICT (key) DO NOTHING;
