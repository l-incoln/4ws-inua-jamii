-- ============================================================
-- PHASE 8 — MEMBER BIRTHDAY SYSTEM
-- Run this in the Supabase SQL Editor after phase7-awareness-calendar.sql
--
-- Privacy model
--   * The exact date of birth lives in its own table, NOT in `profiles`
--     (profiles has a "public read" policy, so any column added there is
--     world-readable).
--   * A member sees and edits only their own row; admins can read all rows.
--   * Other members only ever see day + month of members who explicitly
--     opted in, through the `public_birthdays` view (no year, no age).
-- ============================================================

-- ============================================================
-- 1. MEMBER BIRTHDAYS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.member_birthdays (
  user_id           UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  birth_date        DATE NOT NULL,
  -- Member consented to the wider community seeing/celebrating the day
  is_public         BOOLEAN NOT NULL DEFAULT FALSE,
  -- Member wants a personal greeting (dashboard + email) on the day
  receive_greetings BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT member_birthdays_plausible_date CHECK (
    birth_date > DATE '1900-01-01' AND birth_date < CURRENT_DATE
  )
);

ALTER TABLE public.member_birthdays ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_birthdays' AND policyname = 'member_birthdays: user read own') THEN
    CREATE POLICY "member_birthdays: user read own"
      ON public.member_birthdays FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_birthdays' AND policyname = 'member_birthdays: user insert own') THEN
    CREATE POLICY "member_birthdays: user insert own"
      ON public.member_birthdays FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_birthdays' AND policyname = 'member_birthdays: user update own') THEN
    CREATE POLICY "member_birthdays: user update own"
      ON public.member_birthdays FOR UPDATE
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_birthdays' AND policyname = 'member_birthdays: user delete own') THEN
    CREATE POLICY "member_birthdays: user delete own"
      ON public.member_birthdays FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_birthdays' AND policyname = 'member_birthdays: admin read') THEN
    CREATE POLICY "member_birthdays: admin read"
      ON public.member_birthdays FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS member_birthdays_updated_at ON public.member_birthdays;
CREATE TRIGGER member_birthdays_updated_at
  BEFORE UPDATE ON public.member_birthdays
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- Day/month lookups drive the daily job
CREATE INDEX IF NOT EXISTS member_birthdays_day_idx
  ON public.member_birthdays (
    (EXTRACT(MONTH FROM birth_date)),
    (EXTRACT(DAY FROM birth_date))
  );


-- ============================================================
-- 2. PUBLIC BIRTHDAYS VIEW — opted-in members only, day + month only
--    Security-definer view: it reads member_birthdays on behalf of the
--    owner, so the underlying table stays unreadable to other members
--    while this view exposes nothing but the consented fields.
-- ============================================================
CREATE OR REPLACE VIEW public.public_birthdays AS
  SELECT
    b.user_id,
    p.full_name,
    p.avatar_url,
    p.tier,
    EXTRACT(MONTH FROM b.birth_date)::INT AS birth_month,
    EXTRACT(DAY   FROM b.birth_date)::INT AS birth_day
  FROM public.member_birthdays b
  JOIN public.profiles p ON p.id = b.user_id
  WHERE b.is_public = TRUE
    AND p.membership_status = 'approved';

ALTER VIEW public.public_birthdays SET (security_invoker = off);

REVOKE ALL ON public.public_birthdays FROM anon;
GRANT SELECT ON public.public_birthdays TO authenticated;


-- ============================================================
-- 3. DELIVERY LEDGER — makes the daily job idempotent
--    One row per (member, occasion, kind); the UNIQUE constraint is what
--    stops a re-run of the cron from emailing the same thing twice.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.birthday_notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- The date being celebrated (not the date the message was sent)
  occasion_date DATE NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('team_reminder', 'member_greeting')),
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, occasion_date, kind)
);

ALTER TABLE public.birthday_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'birthday_notifications' AND policyname = 'birthday_notifications: admin read') THEN
    CREATE POLICY "birthday_notifications: admin read"
      ON public.birthday_notifications FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS birthday_notifications_occasion_idx
  ON public.birthday_notifications (occasion_date DESC, kind);


-- ============================================================
-- 4. SITE SETTING — who receives the "birthday tomorrow" reminder
-- ============================================================
INSERT INTO public.site_settings (key, value)
VALUES ('birthday_notify_email', 'membership@4wsinuajamii.org')
ON CONFLICT (key) DO NOTHING;
