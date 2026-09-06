-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 16 Migration
-- Event Registration System: customizable forms, external links,
-- hybrid mode, QR sharing, and rich registration tracking.
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================

-- ============================================================
-- Add registration config columns to events
-- ============================================================
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS rsvp_mode TEXT DEFAULT 'website'
    CHECK (rsvp_mode IN ('website', 'external', 'hybrid', 'none')),
  ADD COLUMN IF NOT EXISTS external_rsvp_url TEXT,
  ADD COLUMN IF NOT EXISTS external_rsvp_label TEXT DEFAULT 'Register on External Form',
  ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requires_login BOOLEAN DEFAULT FALSE;

-- ============================================================
-- Custom form fields per event
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_form_fields (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  field_name    TEXT NOT NULL,
  field_label   TEXT NOT NULL,
  field_type    TEXT NOT NULL DEFAULT 'text'
    CHECK (field_type IN ('text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'number', 'date')),
  field_options TEXT[],
  is_required   BOOLEAN DEFAULT TRUE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.event_form_fields ENABLE ROW LEVEL SECURITY;

-- Public can read form fields (to render the registration form)
CREATE POLICY "Public can read event form fields" ON public.event_form_fields
  FOR SELECT USING (true);

-- Admins can manage form fields
CREATE POLICY "Admins manage event form fields" ON public.event_form_fields
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_event_form_fields_event ON public.event_form_fields(event_id);

-- ============================================================
-- Rich registration records
-- Replaces the simple rsvps table for events that use the form system.
-- The old rsvps table is kept for backward compatibility.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id            UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  field_data          JSONB DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'registered'
    CHECK (status IN ('pending', 'registered', 'confirmed', 'attended', 'cancelled')),
  source              TEXT NOT NULL DEFAULT 'website'
    CHECK (source IN ('website', 'external', 'hybrid')),
  external_completed  BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, email)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Public can insert registrations (the form is public)
CREATE POLICY "Public can insert registrations" ON public.event_registrations
  FOR INSERT WITH CHECK (true);

-- Users can read their own registrations
CREATE POLICY "Users can read own registrations" ON public.event_registrations
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can do everything with registrations
CREATE POLICY "Admins manage registrations" ON public.event_registrations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email ON public.event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON public.event_registrations(status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_event_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_registrations_updated_at ON public.event_registrations;
CREATE TRIGGER event_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE PROCEDURE public.update_event_registrations_updated_at();

-- ============================================================
-- Seed default site settings
-- ============================================================
INSERT INTO public.site_settings (key, value) VALUES
  ('event_registration_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
