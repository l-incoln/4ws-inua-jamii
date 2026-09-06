-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 18 Migration
-- Distinguish organization-level partners from event-only partners.
-- Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).
-- ============================================================

-- Add partner_type column to distinguish:
--   'organization' — supports the organization overall (lifetime or
--                    agreed period). Shown on homepage and other
--                    site-wide zones.
--   'event'        — tied to specific event(s) only. Never shown on
--                    the homepage partner strip.
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS partner_type TEXT NOT NULL DEFAULT 'organization'
  CHECK (partner_type IN ('organization', 'event'));

-- Validity period for organization partners (optional).
-- NULL valid_from = no start date; NULL valid_until = lifetime/ongoing.
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS valid_from   DATE;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS valid_until  DATE;

-- Optional description for organization partners (longer bio/role).
-- The existing description column already exists from phase6; no
-- change needed there.

-- Index for filtering organization partners on the homepage.
CREATE INDEX IF NOT EXISTS idx_partners_type_active
  ON public.partners(partner_type, is_active, sort_order);

-- New site_settings for independent control of each partner type.
INSERT INTO public.site_settings (key, value) VALUES
  ('show_organization_partners', 'true'),
  ('organization_partners_title', 'Our Partners & Sponsors'),
  ('show_event_partners_listing', 'true'),
  ('event_partners_listing_label', 'Sponsored by')
ON CONFLICT (key) DO NOTHING;

-- Refresh PostgREST schema cache so the new columns are visible.
NOTIFY pgrst, 'reload schema';
