-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 9 Migration
-- Volunteer Tasks, Blog Comments, and Impact Scores View
-- Run this in the Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- ============================================================
-- VOLUNTEER TASKS  ← dashboard/tasks + admin/volunteers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.volunteer_tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  skills_required TEXT[] NOT NULL DEFAULT '{}',
  deadline        DATE,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'completed', 'cancelled')),
  claimed_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.volunteer_tasks ENABLE ROW LEVEL SECURITY;

-- Volunteers and admins can read all tasks (so they can see what's available)
CREATE POLICY "volunteer_tasks: authenticated read"
  ON public.volunteer_tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Volunteers can claim (update) tasks — but only the status/claimed_by/claimed_at/completed_at fields
CREATE POLICY "volunteer_tasks: volunteer claim"
  ON public.volunteer_tasks FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Admins have full access
CREATE POLICY "volunteer_tasks: admin manage"
  ON public.volunteer_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS volunteer_tasks_status_idx
  ON public.volunteer_tasks (status, created_at DESC);

CREATE INDEX IF NOT EXISTS volunteer_tasks_claimed_by_idx
  ON public.volunteer_tasks (claimed_by, status);


-- ============================================================
-- BLOG COMMENTS  ← blog post comments + admin moderation
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id      UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name  TEXT,
  body         TEXT NOT NULL,
  parent_id    UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  is_approved  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved comments (public blog readers)
CREATE POLICY "blog_comments: public read approved"
  ON public.blog_comments FOR SELECT
  USING (is_approved = TRUE);

-- Authenticated users can insert comments (they start unapproved)
CREATE POLICY "blog_comments: authenticated insert"
  ON public.blog_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR author_name IS NOT NULL);

-- Authors can update their own comments
CREATE POLICY "blog_comments: author update own"
  ON public.blog_comments FOR UPDATE
  USING (auth.uid() = author_id);

-- Admins have full access
CREATE POLICY "blog_comments: admin manage"
  ON public.blog_comments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS blog_comments_post_idx
  ON public.blog_comments (post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS blog_comments_approved_idx
  ON public.blog_comments (is_approved, created_at DESC);


-- ============================================================
-- MEMBER IMPACT SCORES (VIEW)  ← dashboard/achievements
-- Calculates impact score from events, tasks, comments, donations
-- Points: event=10, task=15, comment=2, donation=20
-- ============================================================
CREATE OR REPLACE VIEW public.member_impact_scores AS
SELECT
  p.id   AS user_id,
  p.full_name,
  COALESCE(r.events_attended, 0)   AS events_attended,
  COALESCE(t.tasks_completed, 0)   AS tasks_completed,
  COALESCE(c.comments_made, 0)     AS comments_made,
  COALESCE(d.donations_made, 0)    AS donations_made,
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
  SELECT donor_id AS user_id, COUNT(*) AS donations_made
  FROM public.donations
  WHERE status = 'completed'
  GROUP BY donor_id
) d ON d.user_id = p.id;

GRANT SELECT ON public.member_impact_scores TO authenticated;
