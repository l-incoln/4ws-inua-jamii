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
  -- Site Info
  ('site_name',                    '4W''S Inua Jamii Foundation'),
  ('tagline',                      'Where, Who, Why, What — Transforming Communities'),
  ('about_mission',                'To uplift communities through sustainable programs in health, education, economic empowerment, and environmental conservation.'),
  ('about_vision',                 'A Kenya where every community thrives with dignity, opportunity, and resilience.'),
  -- Contact
  ('contact_email',                'info@4ws-inuajamii.org'),
  ('contact_phone',                '+254 700 000 000'),
  ('address',                      'Nairobi, Kenya'),
  -- Socials
  ('facebook_url',                 ''),
  ('twitter_url',                  ''),
  ('instagram_url',                ''),
  ('youtube_url',                  ''),
  ('linkedin_url',                 ''),
  -- Payments
  ('mpesa_paybill',                ''),
  ('mpesa_account',                ''),
  ('bank_name',                    ''),
  ('bank_account',                 ''),
  ('donation_currency',            'KES'),
  ('min_donation_amount',          '100'),
  ('mpesa_shortcode_type',         'paybill'),
  ('donation_thank_you_message',   'Thank you for your generous donation! Your support helps us transform lives across Kenya.'),
  ('donation_receipts_email',      ''),
  -- SEO & Metadata
  ('meta_description',             'Empowering underprivileged communities across Kenya through sustainable programs in health, education, economic development, and environmental stewardship.'),
  ('og_image_url',                 ''),
  ('google_analytics_id',          ''),
  ('google_tag_manager_id',        ''),
  ('facebook_pixel_id',            ''),
  -- Membership
  ('membership_fee_basic',         '500'),
  ('membership_fee_active',        '1500'),
  ('membership_fee_champion',      '5000'),
  ('membership_currency',          'KES'),
  ('new_signups_enabled',          'true'),
  ('auto_approve_members',         'false'),
  -- Email / Notifications
  ('from_email',                   ''),
  ('from_name',                    '4W''S Inua Jamii Foundation'),
  ('admin_notify_email',           ''),
  ('welcome_email_enabled',        'true'),
  ('welcome_email_body',           'Welcome to the 4W''S Inua Jamii Foundation community! We are thrilled to have you on board.'),
  -- Homepage Toggles
  ('show_events_preview',          'true'),
  ('show_impact_stats',            'true'),
  ('hero_title',                   'Empowering Communities Across Kenya'),
  ('hero_subtitle',                'We combine grassroots passion with strategic programming to create lasting transformation in health, education, and economic development.'),
  ('hero_cta_label',               'Join Our Mission'),
  ('hero_cta_url',                 '/auth/signup'),
  -- Events & RSVP
  ('rsvp_enabled',                 'true'),
  ('rsvp_require_login',           'true'),
  ('event_reminder_days',          '2'),
  -- Legal / Footer
  ('privacy_policy_url',           ''),
  ('terms_url',                    ''),
  ('registration_number',          ''),
  ('footer_tagline',               'Transforming communities, one life at a time.')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings: public read" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "settings: admin write" ON public.site_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ============================================================
-- DOCUMENTS (constitution, reports, policies)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  file_url    TEXT NOT NULL,
  file_name   TEXT,
  file_size   BIGINT,
  category    TEXT DEFAULT 'general' CHECK (category IN ('constitution', 'report', 'policy', 'guide', 'general')),
  version     TEXT,
  is_public   BOOLEAN DEFAULT TRUE,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents: public read"
  ON public.documents FOR SELECT USING (is_public = TRUE);

CREATE POLICY "documents: admin full"
  ON public.documents FOR ALL
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
  20971520,   -- 20 MB limit (documents can be large)
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

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


-- ============================================================
-- CONTACT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message
CREATE POLICY "contact_messages: public insert"
  ON public.contact_messages FOR INSERT
  WITH CHECK (TRUE);

-- Only admins can read messages
CREATE POLICY "contact_messages: admin read"
  ON public.contact_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can update (mark as read) or delete messages
CREATE POLICY "contact_messages: admin manage"
  ON public.contact_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================
-- PHASE 2 ADDITIONS (run as migrations on existing DB)
-- ============================================================

-- ── Attendance check-in on RSVPs ─────────────────────────────────────────────
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- Allow admins to update rsvps (check-in)
CREATE POLICY "rsvps: admin manage"
  ON public.rsvps FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================
-- BLOG COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT,                 -- populated for guest comments
  body        TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  parent_id   UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_comments: public read approved"
  ON public.blog_comments FOR SELECT
  USING (is_approved = TRUE);

CREATE POLICY "blog_comments: authenticated insert"
  ON public.blog_comments FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "blog_comments: admin manage"
  ON public.blog_comments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================
-- PROGRAM APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.program_applications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id     UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  motivation     TEXT NOT NULL,
  availability   TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  admin_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(program_id, user_id)
);

CREATE TRIGGER program_applications_updated_at
  BEFORE UPDATE ON public.program_applications
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.program_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program_applications: user read own"
  ON public.program_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "program_applications: authenticated insert"
  ON public.program_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "program_applications: admin manage"
  ON public.program_applications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================
-- VOLUNTEER TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.volunteer_tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  skills_required  TEXT[],
  deadline         DATE,
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'completed', 'cancelled')),
  claimed_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER volunteer_tasks_updated_at
  BEFORE UPDATE ON public.volunteer_tasks
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.volunteer_tasks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view tasks
CREATE POLICY "volunteer_tasks: authenticated read"
  ON public.volunteer_tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Volunteers and admins can update (claim/complete)
CREATE POLICY "volunteer_tasks: authenticated update"
  ON public.volunteer_tasks FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "volunteer_tasks: admin manage"
  ON public.volunteer_tasks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ============================================================
-- MEDIA ASSETS (CMS Media Library)
-- Tracks every file uploaded to Supabase Storage so the admin
-- can browse, edit, delete and clean up orphaned files.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media_assets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url          TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  file_size    BIGINT NOT NULL DEFAULT 0,
  mime_type    TEXT NOT NULL,
  width        INT,
  height       INT,
  alt_text     TEXT,
  folder       TEXT NOT NULL DEFAULT 'general'
               CHECK (folder IN ('team', 'programs', 'events', 'gallery', 'blog', 'documents', 'general')),
  uploaded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Public can read asset metadata (URLs are already public via storage)
CREATE POLICY "media_assets: public read"
  ON public.media_assets FOR SELECT USING (TRUE);

-- Only admins can insert / update / delete
CREATE POLICY "media_assets: admin write"
  ON public.media_assets FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for fast folder/date browsing
CREATE INDEX IF NOT EXISTS media_assets_folder_created_idx
  ON public.media_assets (folder, created_at DESC);

-- ─── Media Assets: extended columns (run after initial table creation) ─────────
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS title        TEXT,
  ADD COLUMN IF NOT EXISTS description  TEXT,
  ADD COLUMN IF NOT EXISTS tags         TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS file_type    TEXT    NOT NULL DEFAULT 'image'
    CHECK (file_type IN ('image', 'document')),
  ADD COLUMN IF NOT EXISTS thumb_url    TEXT;

-- Fast tag search (GIN index on array column)
CREATE INDEX IF NOT EXISTS media_assets_tags_idx
  ON public.media_assets USING GIN (tags);

-- Fast type filter
CREATE INDEX IF NOT EXISTS media_assets_type_idx
  ON public.media_assets (file_type, created_at DESC);

-- Also allow admins to update their own storage objects
CREATE POLICY "uploads: admin update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'uploads'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- LEADERSHIP TEAM
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leadership_team (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  role       TEXT NOT NULL,
  bio        TEXT,
  image_url  TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER leadership_team_updated_at
  BEFORE UPDATE ON public.leadership_team
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.leadership_team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leadership_team: public read"
  ON public.leadership_team FOR SELECT USING (is_active = TRUE);

CREATE POLICY "leadership_team: admin manage"
  ON public.leadership_team FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

