-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 4 Migration
-- Run this in the Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- ============================================================

-- ============================================================
-- FAQs TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  category    TEXT DEFAULT 'general',
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS faqs_updated_at ON public.faqs;
CREATE TRIGGER faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE PROCEDURE public.update_faqs_updated_at();

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faqs' AND policyname = 'faqs: public read active') THEN
    CREATE POLICY "faqs: public read active"
      ON public.faqs FOR SELECT USING (is_active = TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faqs' AND policyname = 'faqs: admin manage') THEN
    CREATE POLICY "faqs: admin manage"
      ON public.faqs FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS faqs_sort_idx ON public.faqs (sort_order ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS faqs_category_idx ON public.faqs (category);

-- Seed default FAQs
INSERT INTO public.faqs (question, answer, category, sort_order) VALUES
  ('What is 4W''S Inua Jamii Foundation?', '4W''S Inua Jamii Foundation is a Kenyan non-profit organization dedicated to empowering communities through programs in health, education, economic development, and environmental stewardship. The name "4W''S" stands for Wealth, Wisdom, Will, and Work — the four pillars we believe can transform any community.', 'about', 10),
  ('How can I become a member?', 'You can become a member by clicking "Join Foundation" on our website and creating a free account. After registration, your membership application will be reviewed by our team. Once approved, you will gain full access to member programs, events, and resources.', 'membership', 20),
  ('What membership tiers are available?', 'We have three membership tiers: Classic Member (basic tier) for new members getting started, Premium Member (active tier) for engaged members who regularly participate, and Gold Member (champion tier) for our most dedicated champions who lead community initiatives.', 'membership', 30),
  ('How do I donate to the Foundation?', 'You can donate via M-Pesa (our preferred method) or card payment. Visit our Donate page to select a campaign or make a general donation. All amounts are in Kenyan Shillings (KES). You will receive an official receipt by email.', 'donations', 40),
  ('Is my donation tax-deductible?', 'Yes. 4W''S Inua Jamii Foundation is a registered NGO in Kenya. We issue official donation receipts that may be used for tax purposes. Please consult your tax advisor for specific guidance.', 'donations', 50),
  ('How can I volunteer?', 'We welcome volunteers in areas such as health outreach, education support, environmental projects, event coordination, and community mobilisation. Visit our About page and click "Become a Volunteer" or contact us directly through the Contact page.', 'volunteering', 60),
  ('Where do you operate?', 'We are headquartered in Nairobi, Kenya, and operate across multiple counties. Our programs reach communities in both urban and rural areas, with a focus on underserved populations.', 'about', 70),
  ('How is my personal data protected?', 'We take your privacy seriously. We collect only the data necessary to provide our services, we never sell your personal information, and we comply with Kenya''s Data Protection Act 2019. For full details, see our Privacy Policy.', 'privacy', 80),
  ('Can I delete my account?', 'Yes. You have the right to delete your account at any time. Go to your Dashboard > Settings > Account Settings and use the "Delete Account" option. Please note that this action is permanent and cannot be undone.', 'privacy', 90),
  ('How can I track the impact of my donation?', 'Donors receive a receipt with a reference number. You can also see aggregated impact statistics on our website showing total beneficiaries, programs, and outcomes. We publish annual impact reports available in our Resources section.', 'donations', 100)
ON CONFLICT DO NOTHING;


-- ============================================================
-- IMAGE USAGES TABLE — track where images are used
-- ============================================================
CREATE TABLE IF NOT EXISTS public.image_usages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url    TEXT NOT NULL,
  usage_type   TEXT NOT NULL,   -- 'program', 'event', 'blog_post', 'gallery', 'leadership', 'hero', 'donate_campaign', 'site_setting'
  entity_id    TEXT,             -- UUID of the entity using this image
  entity_label TEXT,             -- human-readable label e.g. 'Community Health Program'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_image_usages_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS image_usages_updated_at ON public.image_usages;
CREATE TRIGGER image_usages_updated_at
  BEFORE UPDATE ON public.image_usages
  FOR EACH ROW EXECUTE PROCEDURE public.update_image_usages_updated_at();

ALTER TABLE public.image_usages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'image_usages' AND policyname = 'image_usages: admin manage') THEN
    CREATE POLICY "image_usages: admin manage"
      ON public.image_usages FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS image_usages_url_idx ON public.image_usages (image_url);
CREATE INDEX IF NOT EXISTS image_usages_type_idx ON public.image_usages (usage_type, entity_id);


-- ============================================================
-- EXTEND PROGRAMS TABLE — ensure all content columns exist
-- ============================================================
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS content      TEXT,
  ADD COLUMN IF NOT EXISTS goals        TEXT[],
  ADD COLUMN IF NOT EXISTS activities   TEXT[],
  ADD COLUMN IF NOT EXISTS tags         TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'published';


-- ============================================================
-- ADDITIONAL SITE_SETTINGS — donate page, about page, FAQs page CMS
-- ============================================================
INSERT INTO public.site_settings (key, value) VALUES
  ('donate_hero_title',        'Your Donation Changes Lives'),
  ('donate_hero_subtitle',     'Every shilling you give is invested directly into programs that change lives. 100% transparent. 100% impactful.'),
  ('donate_impact_amounts',    '[{"amount":500,"impact":"Feeds a family for a week"},{"amount":1000,"impact":"Buys a full term''s school supplies for one child"},{"amount":2500,"impact":"Funds a community health screening for 5 people"},{"amount":5000,"impact":"Supports a woman''s business training for one month"},{"amount":10000,"impact":"Plants 100 trees in a reforestation site"}]'),
  ('faq_hero_title',           'Frequently Asked Questions'),
  ('faq_hero_subtitle',        'Find answers to common questions about our Foundation, membership, donations, and programs.'),
  ('about_story_title',        'From a Small Group to a Big Movement'),
  ('about_story_body',         E'4W''S Inua Jamii Foundation was born in 2018 from a simple conviction held by a group of four friends: that wealth, wisdom, will, and work — our four W''s — when combined with community spirit, can transform any situation.\n\nWhat started as neighborhood clean-up drives and school supply donations has grown into a full-scale foundation running 12 active programs, serving over 5,000 beneficiaries annually, with a growing family of 350+ dedicated volunteers.\n\nToday, we operate with a professional team, transparent governance, and a passionate community of members and donors who believe in our mission.'),
  ('about_founded_year',       '2018'),
  ('about_founded_location',   'Nairobi, Kenya'),
  ('about_values_title',       'Our Core Values'),
  ('about_leadership_title',   'Our Leadership'),
  ('about_leadership_subtitle','Dedicated professionals who guide our mission with expertise, passion, and community-first thinking.')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- EXTEND PROFILES — Google OAuth support
-- ============================================================
-- No extra columns needed; Supabase handles Google OAuth provider automatically.
-- The profiles trigger will create a profile for Google sign-ins.
-- Ensure the handle_new_user trigger gracefully handles null passwords:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, membership_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'avatar_url',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- STORAGE POLICIES — ensure images bucket allows public read
-- ============================================================
-- Run in Supabase Dashboard > Storage > images bucket > Policies:
-- CREATE POLICY "images: public read" ON storage.objects FOR SELECT USING (bucket_id = 'images');
-- CREATE POLICY "images: auth upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
-- CREATE POLICY "images: admin delete" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
