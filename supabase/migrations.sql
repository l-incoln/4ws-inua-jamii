-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 3 Migration
-- Run this in the Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- ============================================================
-- GALLERY ITEMS  ← fixes photo upload being broken
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  image_url   TEXT NOT NULL,
  category    TEXT,
  event_name  TEXT,
  taken_at    DATE,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_gallery_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gallery_items_updated_at ON public.gallery_items;
CREATE TRIGGER gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE PROCEDURE public.update_gallery_items_updated_at();

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_items: public read active"
  ON public.gallery_items FOR SELECT USING (is_active = TRUE);

CREATE POLICY "gallery_items: admin manage"
  ON public.gallery_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS gallery_items_sort_idx
  ON public.gallery_items (sort_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS gallery_items_category_idx
  ON public.gallery_items (category);


-- ============================================================
-- MEMBERSHIP TERMS  ← membership card lifecycle
-- ============================================================
CREATE TABLE IF NOT EXISTS public.membership_terms (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier        TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'active', 'champion')),
  valid_from  DATE NOT NULL,
  valid_until DATE NOT NULL,
  issued_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.membership_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membership_terms: user read own"
  ON public.membership_terms FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "membership_terms: admin manage"
  ON public.membership_terms FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS membership_terms_user_active_idx
  ON public.membership_terms (user_id, is_active, created_at DESC);


-- ============================================================
-- MEMBERSHIP TOKENS  ← QR code / verify link
-- ============================================================
CREATE TABLE IF NOT EXISTS public.membership_tokens (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id   UUID NOT NULL REFERENCES public.membership_terms(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token     UUID NOT NULL DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (term_id),
  UNIQUE (token)
);

ALTER TABLE public.membership_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membership_tokens: user read own"
  ON public.membership_tokens FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "membership_tokens: public verify read"
  ON public.membership_tokens FOR SELECT USING (TRUE);

CREATE POLICY "membership_tokens: admin manage"
  ON public.membership_tokens FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ============================================================
-- MEMBER BADGES  ← achievements & recognition
-- ============================================================
CREATE TABLE IF NOT EXISTS public.member_badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type  TEXT NOT NULL,
  awarded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes       TEXT,
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_type)
);

ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_badges: user read own"
  ON public.member_badges FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "member_badges: public read"
  ON public.member_badges FOR SELECT USING (TRUE);

CREATE POLICY "member_badges: admin manage"
  ON public.member_badges FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ============================================================
-- NOTIFICATIONS  ← in-app notification system
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL DEFAULT 'info',
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: user read own"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications: user update own"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications: admin manage"
  ON public.notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, read, created_at DESC);


-- ============================================================
-- ACTIVITY LOGS  ← audit trail: who did what when
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,   -- e.g. 'member.approved', 'gallery.upload', 'event.created'
  entity_type TEXT,            -- e.g. 'profile', 'event', 'blog_post'
  entity_id   TEXT,            -- UUID as text (polymorphic)
  metadata    JSONB,           -- arbitrary extra data
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs: admin read"
  ON public.activity_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "activity_logs: service insert"
  ON public.activity_logs FOR INSERT WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS activity_logs_actor_idx ON public.activity_logs (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_entity_idx ON public.activity_logs (entity_type, entity_id);


-- ============================================================
-- CONTENT VIEWS  ← analytics: page/content views
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_views (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,  -- 'blog_post', 'program', 'event', 'gallery'
  content_id   UUID NOT NULL,
  viewer_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_views: authenticated insert"
  ON public.content_views FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "content_views: admin read"
  ON public.content_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS content_views_content_idx
  ON public.content_views (content_type, content_id, created_at DESC);


-- ============================================================
-- PINNED CONTENT  ← admins pin important posts / events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pinned_content (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('blog_post', 'event', 'announcement', 'program')),
  content_id   UUID NOT NULL,
  pinned_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (content_type, content_id)
);

ALTER TABLE public.pinned_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pinned_content: public read"
  ON public.pinned_content FOR SELECT USING (TRUE);

CREATE POLICY "pinned_content: admin manage"
  ON public.pinned_content FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ============================================================
-- CONTENT TAGS  ← centralized tagging for auto-tag system
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_tags (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,
  content_id   UUID NOT NULL,
  tag          TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (content_type, content_id, tag)
);

ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_tags: public read"
  ON public.content_tags FOR SELECT USING (TRUE);

CREATE POLICY "content_tags: admin manage"
  ON public.content_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS content_tags_tag_idx ON public.content_tags (tag, content_type);


-- ============================================================
-- DOCUMENTS  (base table — safe if already exists)
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'documents_updated_at') THEN
    CREATE TRIGGER documents_updated_at
      BEFORE UPDATE ON public.documents
      FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
  END IF;
END $$;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'documents: public read'
  ) THEN
    CREATE POLICY "documents: public read"
      ON public.documents FOR SELECT USING (is_public = TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'documents: admin full'
  ) THEN
    CREATE POLICY "documents: admin full"
      ON public.documents FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- ============================================================
-- DOCUMENT DOWNLOADS  ← download analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_downloads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  downloader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.document_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_downloads: authenticated insert"
  ON public.document_downloads FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "document_downloads: admin read"
  ON public.document_downloads FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add version & expiry columns to documents (safe to run on existing table)
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS expires_at   DATE,
  ADD COLUMN IF NOT EXISTS download_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags         TEXT[] NOT NULL DEFAULT '{}';


-- ============================================================
-- EXTENDED COLUMNS on existing tables
-- ============================================================

-- Blog posts: add scheduled_at, pinned, expiry
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS is_pinned    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS expires_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS program_id   UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_id     UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Events: waitlist support
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS qr_code_url      TEXT,
  ADD COLUMN IF NOT EXISTS program_id       UUID REFERENCES public.programs(id) ON DELETE SET NULL;

-- Announcements: expires_at + pinning
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS expires_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Programs: content status, tags, expiry
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS tags         TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content      TEXT,
  ADD COLUMN IF NOT EXISTS goals        TEXT[],
  ADD COLUMN IF NOT EXISTS activities   TEXT[];

-- ============================================================
-- SEED PROGRAMS  ← makes footer program links functional
-- ============================================================
INSERT INTO public.programs (slug, title, description, icon, beneficiaries, is_active, status, tags, content, goals, activities)
VALUES
  (
    'community-health',
    'Community Health',
    'Delivering accessible healthcare and health education to underserved communities across Kenya. Our health program focuses on preventive care, maternal health, nutrition, and disease prevention.',
    'Heart',
    2500,
    TRUE,
    'published',
    ARRAY['health','community','prevention','maternal'],
    E'Our Community Health Program is at the heart of everything we do at 4W''S Inua Jamii Foundation. We believe that health is a fundamental human right, and we work tirelessly to ensure that every community member has access to quality healthcare services regardless of their economic situation.\n\nWe run regular mobile health clinics that bring doctors, nurses, and health educators directly to communities. Our teams conduct screenings for diabetes, hypertension, HIV/AIDS, and other prevalent conditions, providing free treatment and referrals where necessary.\n\nMaternal and child health is a key focus. We support expectant mothers with antenatal care, safe delivery services, postnatal support, and immunization programs for children under five. Our community health workers conduct home visits to ensure no mother or child is left behind.',
    ARRAY[
      'Reduce preventable deaths through early detection and treatment',
      'Improve maternal and child health outcomes',
      'Build community health literacy and self-care capacity',
      'Train community health workers in every target area'
    ],
    ARRAY[
      'Mobile health clinics and outreach camps',
      'Maternal care and safe motherhood training',
      'Child immunization drives',
      'HIV/AIDS testing and counseling',
      'Nutrition and food security workshops',
      'Mental health awareness sessions'
    ]
  ),
  (
    'education',
    'Education',
    'Empowering youth and adults with quality education, scholarships, vocational training, and digital literacy programs that open doors to opportunity and self-reliance.',
    'BookOpen',
    1800,
    TRUE,
    'published',
    ARRAY['education','youth','scholarships','digital'],
    E'Education is the most powerful tool for breaking cycles of poverty. The 4W''S Education Program works to ensure that every child and young adult in our target communities has access to quality education and the skills they need to thrive in the modern world.\n\nWe provide bursaries and scholarships to bright but financially disadvantaged students, enabling them to complete their primary, secondary, and tertiary education. Our school feeding program addresses the challenge of hunger as a barrier to learning.\n\nBeyond formal education, we run vocational training centers where young people learn practical skills in carpentry, tailoring, hairdressing, mechanics, and technology. These skills translate directly into employment and entrepreneurship opportunities.',
    ARRAY[
      'Increase school enrollment and retention in target communities',
      'Award 200+ scholarships annually to deserving students',
      'Equip youth with vocational and digital skills',
      'Improve adult literacy rates among community members'
    ],
    ARRAY[
      'Bursary and scholarship program',
      'School feeding and nutrition support',
      'Digital literacy and computer training',
      'Vocational skills training centers',
      'Adult literacy classes',
      'Mentorship and career guidance'
    ]
  ),
  (
    'economic-empowerment',
    'Economic Empowerment',
    'Building sustainable livelihoods through microfinance, business training, cooperative development, and market linkages that enable families to achieve financial independence.',
    'DollarSign',
    1200,
    TRUE,
    'published',
    ARRAY['economic','livelihoods','microfinance','business'],
    E'Economic empowerment is central to lasting community transformation. When families have stable incomes and financial security, they can invest in their children''s education, access healthcare, and contribute positively to their communities.\n\nOur Economic Empowerment Program operates through several interconnected initiatives. We provide microfinance loans to small-scale entrepreneurs, farmers, and traders who lack access to formal banking. These affordable loans, paired with business mentorship, help turn small ideas into sustainable enterprises.\n\nWe organize women and youth savings groups (VSLAs) that build a culture of saving and collective investment. Many of these groups have grown into successful cooperatives with collective assets exceeding hundreds of thousands of shillings.',
    ARRAY[
      'Provide microfinance access to 500+ entrepreneurs annually',
      'Establish functional savings and credit groups in all target areas',
      'Create linkages between producers and markets',
      'Reduce household poverty levels by 40% in program areas'
    ],
    ARRAY[
      'Microfinance and business loans',
      'Village savings and loan associations (VSLAs)',
      'Business skills training and mentorship',
      'Market linkage and trade fair events',
      'Women enterprise development groups',
      'Agricultural value chain support'
    ]
  ),
  (
    'environment',
    'Environment',
    'Protecting our natural resources and building climate resilience through tree planting, clean energy adoption, waste management, and environmental education in our communities.',
    'Sprout',
    3000,
    TRUE,
    'published',
    ARRAY['environment','conservation','climate','sustainability'],
    E'Environmental conservation is not just about protecting nature — it is about securing the future of our communities. Healthy ecosystems provide clean water, fertile soils, and clean air that are essential for human wellbeing.\n\nThe 4W''S Environment Program takes a comprehensive approach to environmental protection and climate resilience. We have planted over 50,000 trees across our operational areas, restoring degraded lands and creating green corridors that support biodiversity.\n\nWe work with communities to adopt clean cooking solutions that reduce deforestation and indoor air pollution. Our biogas and solar energy programs bring affordable, clean energy to rural households, reducing dependence on firewood and charcoal.',
    ARRAY[
      'Plant 100,000 trees in degraded areas by 2026',
      'Transition 500 households to clean cooking energy',
      'Establish community-managed forest and water catchment protection zones',
      'Reduce plastic and solid waste pollution in target communities'
    ],
    ARRAY[
      'Community tree nurseries and planting drives',
      'Clean energy (biogas, solar) installations',
      'Water catchment and wetland conservation',
      'Community clean-up campaigns',
      'Environmental education in schools',
      'Climate-smart agriculture training'
    ]
  )
ON CONFLICT (slug) DO UPDATE SET
  title        = EXCLUDED.title,
  description  = EXCLUDED.description,
  content      = EXCLUDED.content,
  goals        = EXCLUDED.goals,
  activities   = EXCLUDED.activities,
  tags         = EXCLUDED.tags,
  is_active    = EXCLUDED.is_active,
  status       = EXCLUDED.status;


-- ============================================================
-- GALLERY ITEMS: admin read policy
-- ============================================================
CREATE POLICY "gallery_items: admin read all"
  ON public.gallery_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS blog_posts_status_published_idx ON public.blog_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_pinned_idx ON public.blog_posts (is_pinned, published_at DESC);
CREATE INDEX IF NOT EXISTS events_date_idx ON public.events (event_date DESC, status);
CREATE INDEX IF NOT EXISTS programs_active_idx ON public.programs (is_active, status);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications (user_id, read);
CREATE INDEX IF NOT EXISTS member_badges_user_idx ON public.member_badges (user_id);
CREATE INDEX IF NOT EXISTS rsvps_event_idx ON public.rsvps (event_id, status);
