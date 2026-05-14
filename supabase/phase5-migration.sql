-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 5 Migration
-- Security patches, performance indexes, and minor schema fixes.
-- Run this in the Supabase SQL Editor.
-- Safe to run multiple times.
-- ============================================================

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

-- M-Pesa callback looks up donations by reference — needs index
CREATE INDEX IF NOT EXISTS donations_reference_idx
  ON public.donations (reference)
  WHERE reference IS NOT NULL;

-- Donor's own donation history
CREATE INDEX IF NOT EXISTS donations_donor_id_idx
  ON public.donations (donor_id)
  WHERE donor_id IS NOT NULL;

-- Donation status filter (admin panels, analytics)
CREATE INDEX IF NOT EXISTS donations_status_idx
  ON public.donations (status, created_at DESC);

-- Blog post listing (published posts, newest first)
CREATE INDEX IF NOT EXISTS blog_posts_status_published_idx
  ON public.blog_posts (status, published_at DESC)
  WHERE status = 'published';

-- Notification polling (user unread count in layout)
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, read, created_at DESC)
  WHERE read = FALSE;

-- RSVP event capacity check
CREATE INDEX IF NOT EXISTS rsvps_event_status_idx
  ON public.rsvps (event_id, status);

-- Profile lookup by role (admin auth checks in middleware)
CREATE INDEX IF NOT EXISTS profiles_role_idx
  ON public.profiles (role);

-- Site settings key lookup (already PK but an extra covering index helps)
-- Already indexed as PK — no action needed.

-- ============================================================
-- CONTACT MESSAGES — add is_read column for admin panel
-- ============================================================
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS contact_messages_is_read_idx
  ON public.contact_messages (is_read, created_at DESC);

-- ============================================================
-- DONATIONS — add admin update policy (for manual status fixes)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'donations' AND policyname = 'donations: admin manage'
  ) THEN
    CREATE POLICY "donations: admin manage"
      ON public.donations FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- ============================================================
-- RSVPS — add checked_in columns for attendance tracking
-- ============================================================
ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS checked_in    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- ============================================================
-- MEDIA ASSETS — add file_type index for media library filters
-- ============================================================
CREATE INDEX IF NOT EXISTS media_assets_file_type_idx
  ON public.media_assets (file_type, created_at DESC);

CREATE INDEX IF NOT EXISTS media_assets_folder_idx
  ON public.media_assets (folder, created_at DESC);

-- ============================================================
-- ANNOUNCEMENTS — add updated_at column for editing
-- ============================================================
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS announcements_updated_at ON public.announcements;
CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE PROCEDURE public.update_announcements_updated_at();

-- ============================================================
-- MPESA TRANSACTIONS — optional audit table for raw callbacks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mpesa_transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkout_request_id TEXT NOT NULL,
  result_code         INT NOT NULL,
  receipt_number      TEXT,
  phone_number        TEXT,
  amount              NUMERIC(12, 2),
  raw_payload         JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mpesa_transactions: admin read"
  ON public.mpesa_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Service role can insert from API route
CREATE POLICY "mpesa_transactions: service insert"
  ON public.mpesa_transactions FOR INSERT
  WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS mpesa_transactions_checkout_idx
  ON public.mpesa_transactions (checkout_request_id);
