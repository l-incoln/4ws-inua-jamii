-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 6 Migration
-- New features: partners, social links, core values, membership
-- duration, payment gate, archives, reminders, activity tracking.
-- Run this in the Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- ============================================================

-- ============================================================
-- 1. PARTNERS / SPONSORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  logo_url    TEXT,
  website_url TEXT,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS partners_updated_at ON public.partners;
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE PROCEDURE public.update_partners_updated_at();

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'partners: public read active') THEN
    CREATE POLICY "partners: public read active"
      ON public.partners FOR SELECT USING (is_active = TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'partners: admin manage') THEN
    CREATE POLICY "partners: admin manage"
      ON public.partners FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS partners_sort_idx ON public.partners (sort_order ASC);


-- ============================================================
-- 2. REMINDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reminders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT,
  remind_at    TIMESTAMPTZ NOT NULL,
  entity_type  TEXT,    -- 'event', 'membership', 'donation', 'task', 'custom'
  entity_id    UUID,
  is_sent      BOOLEAN NOT NULL DEFAULT FALSE,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  created_by   UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'reminders: user read own') THEN
    CREATE POLICY "reminders: user read own"
      ON public.reminders FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'reminders: user manage own') THEN
    CREATE POLICY "reminders: user manage own"
      ON public.reminders FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminders' AND policyname = 'reminders: admin manage') THEN
    CREATE POLICY "reminders: admin manage"
      ON public.reminders FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS reminders_user_idx ON public.reminders (user_id, remind_at);
CREATE INDEX IF NOT EXISTS reminders_unsent_idx ON public.reminders (remind_at) WHERE is_sent = FALSE AND is_dismissed = FALSE;


-- ============================================================
-- 3. EXTEND PROFILES — tier selection at signup, payment tracking
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS selected_tier         TEXT DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS payment_confirmed      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_reference      TEXT,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_agreed         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_agreed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarded_by           UUID REFERENCES public.profiles(id);


-- ============================================================
-- 4. MEMBERSHIP TERMS — add duration_years
-- ============================================================
ALTER TABLE public.membership_terms
  ADD COLUMN IF NOT EXISTS duration_years INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS notes TEXT;


-- ============================================================
-- 5. ARCHIVE COLUMNS — soft-delete/archive for admin pages
-- ============================================================
ALTER TABLE public.blog_posts      ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.announcements   ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.events          ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.programs        ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.documents       ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS blog_posts_archived_idx     ON public.blog_posts     (is_archived);
CREATE INDEX IF NOT EXISTS announcements_archived_idx  ON public.announcements  (is_archived);
CREATE INDEX IF NOT EXISTS events_archived_idx         ON public.events         (is_archived);
CREATE INDEX IF NOT EXISTS programs_archived_idx       ON public.programs       (is_archived);
CREATE INDEX IF NOT EXISTS documents_archived_idx      ON public.documents      (is_archived);


-- ============================================================
-- 6. NEW SITE SETTINGS — social, core values, membership duration
-- ============================================================
INSERT INTO public.site_settings (key, value) VALUES
  -- New Social Channels
  ('tiktok_url',                   ''),
  ('whatsapp_url',                 ''),
  -- Core Values (editable from CMS)
  ('core_value_1_title',           'Community First'),
  ('core_value_1_body',            'Every decision we make is guided by what is best for our communities.'),
  ('core_value_2_title',           'Integrity'),
  ('core_value_2_body',            'We operate with transparency, honesty, and accountability in all we do.'),
  ('core_value_3_title',           'Empowerment'),
  ('core_value_3_body',            'We believe in building capacity so communities can sustain themselves.'),
  ('core_value_4_title',           'Collaboration'),
  ('core_value_4_body',            'We achieve more together through partnerships and shared purpose.'),
  ('core_value_5_title',           'Excellence'),
  ('core_value_5_body',            'We hold ourselves to high standards in program delivery and governance.'),
  ('core_value_6_title',           'Sustainability'),
  ('core_value_6_body',            'Our work is designed for lasting impact, not just short-term relief.'),
  -- Membership Duration per Tier (years)
  ('membership_duration_basic',    '1'),
  ('membership_duration_active',   '1'),
  ('membership_duration_champion', '2'),
  -- Show Partners on Homepage
  ('show_partners_section',        'true'),
  ('partners_section_title',       'Our Partners & Sponsors'),
  -- Admin Notification
  ('admin_notify_new_member',      'true'),
  ('admin_notify_new_donation',    'true')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- 7. UPDATE handle_new_user TO CAPTURE TIER + CONSENT
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, phone, avatar_url, membership_status,
    tier, selected_tier, consent_agreed, consent_agreed_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'avatar_url',
    'pending',
    COALESCE(NEW.raw_user_meta_data ->> 'tier', 'basic'),
    COALESCE(NEW.raw_user_meta_data ->> 'tier', 'basic'),
    COALESCE((NEW.raw_user_meta_data ->> 'consent_agreed')::boolean, FALSE),
    CASE WHEN (NEW.raw_user_meta_data ->> 'consent_agreed') = 'true' THEN NOW() ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    tier          = COALESCE(EXCLUDED.tier, 'basic'),
    selected_tier = COALESCE(EXCLUDED.selected_tier, 'basic');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 8. ACTIVITY LOG IMPROVEMENTS — add more action categories
-- ============================================================
-- Ensure activity_logs table exists (should from phase 3/4)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,   -- insert, update, delete, login, upload, rsvp, badge, notify, settings, approve, reject, issue
  entity_type TEXT,            -- profiles, events, blog_posts, site_settings, donations, membership_terms, etc.
  entity_id   TEXT,
  metadata    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'activity_logs: admin read') THEN
    CREATE POLICY "activity_logs: admin read"
      ON public.activity_logs FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'activity_logs: service insert') THEN
    CREATE POLICY "activity_logs: service insert"
      ON public.activity_logs FOR INSERT
      WITH CHECK (TRUE);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS activity_logs_created_idx    ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx     ON public.activity_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_logs_entity_idx     ON public.activity_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS activity_logs_user_idx       ON public.activity_logs (actor_id, created_at DESC);


-- ============================================================
-- 9. ADMIN NOTIFICATIONS TABLE — notify admin of key events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        TEXT NOT NULL,   -- 'new_member', 'new_donation', 'new_application', 'new_contact'
  title       TEXT NOT NULL,
  body        TEXT,
  entity_type TEXT,
  entity_id   TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_notifications' AND policyname = 'admin_notifications: admin manage') THEN
    CREATE POLICY "admin_notifications: admin manage"
      ON public.admin_notifications FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_notifications' AND policyname = 'admin_notifications: service insert') THEN
    CREATE POLICY "admin_notifications: service insert"
      ON public.admin_notifications FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS admin_notifications_unread_idx ON public.admin_notifications (is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_notifications_type_idx   ON public.admin_notifications (type, created_at DESC);


-- ============================================================
-- 10. TRIGGER — auto-notify admin when new member registers
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_admin_new_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire for new profiles (not updates)
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.admin_notifications (type, title, body, entity_type, entity_id)
    VALUES (
      'new_member',
      'New Member Application',
      COALESCE(NEW.full_name, 'A new user') || ' has registered and is awaiting approval.',
      'profiles',
      NEW.id::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_member_notify ON public.profiles;
CREATE TRIGGER on_new_member_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.notify_admin_new_member();


-- ============================================================
-- 11. TRIGGER — auto-notify admin on new donation
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_admin_new_donation()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR
     (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') THEN
    INSERT INTO public.admin_notifications (type, title, body, entity_type, entity_id)
    VALUES (
      'new_donation',
      'New Donation Received',
      COALESCE(NEW.donor_name, 'Anonymous') || ' donated KES ' || NEW.amount::TEXT,
      'donations',
      NEW.id::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_donation_notify ON public.donations;
CREATE TRIGGER on_new_donation_notify
  AFTER INSERT OR UPDATE ON public.donations
  FOR EACH ROW EXECUTE PROCEDURE public.notify_admin_new_donation();
