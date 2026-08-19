-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 14 Migration
-- Impact tracking: distribution records + outreach activities
-- Plus maintenance mode seed
--
-- Safe to run multiple times (CREATE IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- ------------------------------------------------------------
-- Maintenance mode default (off)
-- ------------------------------------------------------------
INSERT INTO public.site_settings (key, value) VALUES
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- DISTRIBUTION RECORDS
-- Tracks food, clothing, materials, and other items distributed
-- to beneficiaries through foundation programs.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.distribution_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL CHECK (category IN ('food', 'clothing', 'materials', 'medical', 'educational', 'other')),
  quantity      INTEGER NOT NULL DEFAULT 0,
  unit          TEXT NOT NULL DEFAULT 'items',
  beneficiaries INTEGER NOT NULL DEFAULT 0,
  location      TEXT,
  distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  program_id    UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.distribution_records ENABLE ROW LEVEL SECURITY;

-- Anyone can read distribution records (public impact transparency)
CREATE POLICY "distribution_records: public read"
  ON public.distribution_records FOR SELECT
  USING (TRUE);

-- Admins can manage distribution records
CREATE POLICY "distribution_records: admin manage"
  ON public.distribution_records FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS distribution_records_date_idx
  ON public.distribution_records (distribution_date DESC);

CREATE INDEX IF NOT EXISTS distribution_records_category_idx
  ON public.distribution_records (category);

-- ------------------------------------------------------------
-- OUTREACH ACTIVITIES
-- Tracks community outreach activities and campaigns.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.outreach_activities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  activity_type   TEXT NOT NULL CHECK (activity_type IN ('community_visit', 'health_camp', 'education_drive', 'environmental', 'fundraiser', 'awareness_campaign', 'other')),
  location        TEXT,
  participants    INTEGER NOT NULL DEFAULT 0,
  beneficiaries   INTEGER NOT NULL DEFAULT 0,
  activity_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  image_url       TEXT,
  program_id      UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.outreach_activities ENABLE ROW LEVEL SECURITY;

-- Anyone can read outreach activities (public impact transparency)
CREATE POLICY "outreach_activities: public read"
  ON public.outreach_activities FOR SELECT
  USING (TRUE);

-- Admins can manage outreach activities
CREATE POLICY "outreach_activities: admin manage"
  ON public.outreach_activities FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS outreach_activities_date_idx
  ON public.outreach_activities (activity_date DESC);

CREATE INDEX IF NOT EXISTS outreach_activities_type_idx
  ON public.outreach_activities (activity_type);

-- ------------------------------------------------------------
-- Grant access to authenticated users
-- ------------------------------------------------------------
GRANT SELECT ON public.distribution_records TO anon, authenticated;
GRANT SELECT ON public.outreach_activities TO anon, authenticated;

-- ------------------------------------------------------------
-- Video support in gallery_items
-- Adds an optional video_url column for embedded videos
-- (YouTube/Vimeo). When set, the gallery item is treated as a
-- video rather than a static image. image_url remains required
-- as the poster/thumbnail.
-- ------------------------------------------------------------
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS video_url TEXT;
