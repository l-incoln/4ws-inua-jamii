-- ============================================================
-- Phase 15 — Optional per-event partners / sponsors
--
-- Adds a join table linking existing `partners` to individual `events`,
-- with an optional per-link "contribution" label (e.g. "Title Sponsor",
-- "Media Partner") so each event can show who supported it and how.
--
-- Also seeds two CMS toggles in `site_settings`:
--   show_event_partners   ('false' by default — feature is opt-in)
--   event_partners_title  ('Supported by' — section heading on event detail)
--
-- The feature only renders on the public event detail page when
-- `show_event_partners` is 'true' AND the event has at least one linked
-- partner, so it stays invisible until an admin turns it on.
-- ============================================================

-- 1. Join table ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_partners (
  event_id     UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  partner_id   UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  contribution TEXT,                                  -- optional role/label, e.g. "Title Sponsor"
  sort_order   INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, partner_id)
);

ALTER TABLE public.event_partners ENABLE ROW LEVEL SECURITY;

-- Public can read links (so the event detail page can show partners).
-- Access to the partner row itself is already gated by partners RLS
-- (public read only active partners), so inactive partners stay hidden.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_partners' AND policyname = 'event_partners: public read') THEN
    CREATE POLICY "event_partners: public read"
      ON public.event_partners FOR SELECT USING (TRUE);
  END IF;
END $$;

-- Admins manage the links.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_partners' AND policyname = 'event_partners: admin manage') THEN
    CREATE POLICY "event_partners: admin manage"
      ON public.event_partners FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS event_partners_event_idx
  ON public.event_partners (event_id, sort_order ASC);

-- 2. CMS settings seeds ----------------------------------------
INSERT INTO public.site_settings (key, value, updated_at)
VALUES
  ('show_event_partners', 'false', NOW()),
  ('event_partners_title', 'Supported by', NOW())
ON CONFLICT (key) DO NOTHING;
