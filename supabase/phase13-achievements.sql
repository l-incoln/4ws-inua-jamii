-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 13 Migration
-- Achievement System: Impact Score, Rank, Auto-Badges
--
-- Extends the member_impact_scores view with a donation-amount
-- total (so Champion Donor can be awarded on verified giving, not
-- just donation count) and seeds the configurable thresholds that
-- drive automatic badge unlocking.
--
-- Safe to run multiple times (DROP IF EXISTS / ON CONFLICT).
-- ============================================================

-- ------------------------------------------------------------
-- Extend the impact view with donation_amount_total.
-- Points (total_score) stay activity-weighted; the new column
-- lets the app compute a distinct Impact Score that reflects the
-- *meaning and level* of contribution (giving amount, badges).
--
-- Note: CREATE OR REPLACE VIEW cannot insert a column in the
-- middle of an existing view's column list (PostgreSQL matches
-- positionally and rejects what looks like a rename). We drop and
-- recreate instead — safe because a view holds no data, only a query.
--
-- SECURITY: The view is created WITH (security_invoker = true) so it
-- runs with the querying user's privileges, not the view owner's.
-- This respects RLS on the underlying tables. The required "authenticated
-- read all" policies on rsvps and donations were added in phase11f.
-- ------------------------------------------------------------
DROP VIEW IF EXISTS public.member_impact_scores;

CREATE VIEW public.member_impact_scores
WITH (security_invoker = true) AS
SELECT
  p.id   AS user_id,
  p.full_name,
  COALESCE(r.events_attended, 0)   AS events_attended,
  COALESCE(t.tasks_completed, 0)   AS tasks_completed,
  COALESCE(c.comments_made, 0)     AS comments_made,
  COALESCE(d.donations_made, 0)    AS donations_made,
  COALESCE(d.donation_amount_total, 0) AS donation_amount_total,
  (
    COALESCE(r.events_attended, 0) * 10 +
    COALESCE(t.tasks_completed, 0) * 15 +
    COALESCE(c.comments_made, 0)   * 2  +
    COALESCE(d.donations_made, 0)  * 20
  ) AS total_score
FROM public.profiles p
LEFT JOIN (
  SELECT user_id, COUNT(*) AS events_attended
  FROM public.rsvps
  WHERE status = 'confirmed'
  GROUP BY user_id
) r ON r.user_id = p.id
LEFT JOIN (
  SELECT claimed_by AS user_id, COUNT(*) AS tasks_completed
  FROM public.volunteer_tasks
  WHERE status = 'completed'
  GROUP BY claimed_by
) t ON t.user_id = p.id
LEFT JOIN (
  SELECT author_id AS user_id, COUNT(*) AS comments_made
  FROM public.blog_comments
  WHERE is_approved = TRUE
  GROUP BY author_id
) c ON c.user_id = p.id
LEFT JOIN (
  SELECT
    donor_id AS user_id,
    COUNT(*)            AS donations_made,
    COALESCE(SUM(amount), 0) AS donation_amount_total
  FROM public.donations
  WHERE status = 'completed'
  GROUP BY donor_id
) d ON d.user_id = p.id;

GRANT SELECT ON public.member_impact_scores TO authenticated;

-- ------------------------------------------------------------
-- Achievement threshold settings (CMS-editable).
-- Used by lib/achievements.ts to decide when badges auto-unlock.
-- ------------------------------------------------------------
INSERT INTO public.site_settings (key, value) VALUES
  ('founding_member_cutoff',     '2025-12-31'),
  ('champion_donor_threshold',   '10000'),
  ('top_contributor_threshold',  '500'),
  ('active_member_threshold',    '50'),
  ('event_hero_threshold',       '10')
ON CONFLICT (key) DO NOTHING;
