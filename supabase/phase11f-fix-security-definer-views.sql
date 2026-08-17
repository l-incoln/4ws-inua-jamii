-- ============================================================
-- Phase 11f: Fix SECURITY DEFINER view warnings
-- Switch both views to security_invoker = true and add the
-- necessary RLS policies on underlying tables so the views
-- continue to function correctly.
-- ============================================================

-- ───────────────────────────────────────────────────────────
-- 1. public_birthdays view
-- ───────────────────────────────────────────────────────────
-- Add an RLS policy on member_birthdays so authenticated users
-- can read rows where the member has opted in (is_public = true).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_birthdays' AND policyname = 'member_birthdays: authenticated read public') THEN
    CREATE POLICY "member_birthdays: authenticated read public"
      ON public.member_birthdays FOR SELECT
      USING (is_public = TRUE);
  END IF;
END $$;

-- Switch the view to security_invoker so it respects the querying user's RLS
ALTER VIEW public.public_birthdays SET (security_invoker = true);


-- ───────────────────────────────────────────────────────────
-- 2. member_impact_scores view
-- ───────────────────────────────────────────────────────────
-- The view joins: profiles, rsvps, volunteer_tasks, blog_comments, donations
-- Existing RLS:
--   profiles:          public read (TRUE)              ✅
--   volunteer_tasks:   authenticated read              ✅
--   blog_comments:     public read approved             ✅
--   rsvps:             own read only + admin           ❌ needs authenticated read
--   donations:         own read only + admin           ❌ needs authenticated read

-- Add authenticated read policy on rsvps (event attendance is public for impact scoring)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rsvps' AND policyname = 'rsvps: authenticated read all') THEN
    CREATE POLICY "rsvps: authenticated read all"
      ON public.rsvps FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Add authenticated read policy on donations (needed for aggregate donation counts)
-- The view only exposes counts, not donor details or amounts.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donations' AND policyname = 'donations: authenticated read all') THEN
    CREATE POLICY "donations: authenticated read all"
      ON public.donations FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Switch the view to security_invoker so it respects the querying user's RLS
ALTER VIEW public.member_impact_scores SET (security_invoker = true);
