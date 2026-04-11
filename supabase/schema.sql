-- ============================================================
-- 4W'S INUA JAMII FOUNDATION - Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up your database.
-- ============================================================

-- ---- EXTENSIONS ----
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT,
  phone             TEXT,
  location          TEXT,
  bio               TEXT,
  avatar_url        TEXT,
  role              TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'volunteer')),
  tier              TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'active', 'champion')),
  membership_status TEXT NOT NULL DEFAULT 'pending' CHECK (membership_status IN ('pending', 'approved', 'rejected')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, membership_status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();


-- ============================================================
-- PROGRAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.programs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  icon         TEXT,
  image_url    TEXT,
  beneficiaries INT DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT NOT NULL,
  slug           TEXT UNIQUE,
  description    TEXT,
  location       TEXT NOT NULL,
  address        TEXT,
  event_date     DATE NOT NULL,
  start_time     TEXT,
  end_time       TEXT,
  image_url      TEXT,
  category       TEXT,
  max_attendees  INT,
  status         TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_by     UUID REFERENCES public.profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();


-- ============================================================
-- RSVPs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rsvps (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);


-- ============================================================
-- BLOG POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  excerpt       TEXT,
  body          TEXT,
  category      TEXT,
  tags          TEXT[],
  image_url     TEXT,
  author_id     UUID REFERENCES public.profiles(id),
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at  TIMESTAMPTZ,
  read_time     TEXT,
  views         INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();


-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  body        TEXT,
  is_pinned   BOOLEAN DEFAULT FALSE,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- DONATION CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.donation_campaigns (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  goal         NUMERIC(12, 2) NOT NULL,
  raised       NUMERIC(12, 2) DEFAULT 0,
  image_url    TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  deadline     DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- DONATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id  UUID REFERENCES public.donation_campaigns(id),
  donor_id     UUID REFERENCES public.profiles(id),
  donor_name   TEXT,
  donor_email  TEXT,
  amount       NUMERIC(12, 2) NOT NULL,
  currency     TEXT DEFAULT 'KES',
  payment_method TEXT CHECK (payment_method IN ('mpesa', 'card', 'bank', 'cash')),
  reference    TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  message      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update campaign raised amount on donation completion
CREATE OR REPLACE FUNCTION public.update_campaign_raised()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.donation_campaigns
    SET raised = raised + NEW.amount
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donations_update_raised
  AFTER INSERT OR UPDATE ON public.donations
  FOR EACH ROW EXECUTE PROCEDURE public.update_campaign_raised();


-- ============================================================
-- IMPACT METRICS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.impact_metrics (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label      TEXT NOT NULL,
  value      INT NOT NULL,
  unit       TEXT,
  icon       TEXT,
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial impact data
INSERT INTO public.impact_metrics (label, value, unit, icon, sort_order)
VALUES
  ('Beneficiaries Reached', 5000, '+', 'Users', 1),
  ('Events Held', 120, '+', 'Calendar', 2),
  ('Active Programs', 12, '', 'Leaf', 3),
  ('Volunteers', 350, '+', 'Heart', 4)
ON CONFLICT DO NOTHING;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: public read"
  ON public.profiles FOR SELECT USING (TRUE);

CREATE POLICY "profiles: user can update own"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles: admin can update all"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events: public read"
  ON public.events FOR SELECT USING (TRUE);

CREATE POLICY "events: admin write"
  ON public.events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RSVPs
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rsvps: user can read own"
  ON public.rsvps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "rsvps: user can manage own"
  ON public.rsvps FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "rsvps: admin read all"
  ON public.rsvps FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Blog posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts: public read published"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "blog_posts: admin write"
  ON public.blog_posts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements: members read"
  ON public.announcements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "announcements: admin write"
  ON public.announcements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Donation campaigns
ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns: public read active"
  ON public.donation_campaigns FOR SELECT USING (is_active = TRUE);

CREATE POLICY "campaigns: admin write"
  ON public.donation_campaigns FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "donations: donor can insert"
  ON public.donations FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "donations: donor can read own"
  ON public.donations FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "donations: admin read all"
  ON public.donations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Programs
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "programs: public read" ON public.programs FOR SELECT USING (TRUE);
CREATE POLICY "programs: admin write" ON public.programs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Impact metrics
ALTER TABLE public.impact_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "impact_metrics: public read" ON public.impact_metrics FOR SELECT USING (TRUE);
CREATE POLICY "impact_metrics: admin write" ON public.impact_metrics FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ============================================================
-- SITE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name',       '4W''S Inua Jamii Foundation'),
  ('tagline',         'Where, Who, Why, What — Transforming Communities'),
  ('contact_email',   'info@4ws-inuajamii.org'),
  ('contact_phone',   '+254 700 000 000'),
  ('address',         'Nairobi, Kenya'),
  ('facebook_url',    ''),
  ('twitter_url',     ''),
  ('instagram_url',   ''),
  ('youtube_url',     ''),
  ('linkedin_url',    ''),
  ('mpesa_paybill',   ''),
  ('mpesa_account',   ''),
  ('bank_name',       ''),
  ('bank_account',    ''),
  ('about_mission',   'To uplift communities through sustainable programs in health, education, economic empowerment, and environmental conservation.'),
  ('about_vision',    'A Kenya where every community thrives with dignity, opportunity, and resilience.')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings: public read" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "settings: admin write" ON public.site_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ============================================================
-- STORAGE BUCKET: uploads
-- Run these in Supabase SQL Editor to enable image uploads.
-- ============================================================

-- Create the uploads bucket (public = images are publicly readable via URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  TRUE,
  5242880,   -- 5 MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read/download public images
CREATE POLICY "uploads: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

-- Allow authenticated admins to upload
CREATE POLICY "uploads: admin insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete their uploads
CREATE POLICY "uploads: admin delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'uploads'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

