-- ============================================================
-- Phase 11b: Newsletter subscribers table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  source      TEXT DEFAULT 'footer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert their own email)
CREATE POLICY "newsletter: public subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (TRUE);

-- Only admins can read the full list
CREATE POLICY "newsletter: admin read"
  ON public.newsletter_subscribers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Only admins can update/delete
CREATE POLICY "newsletter: admin manage"
  ON public.newsletter_subscribers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS newsletter_subscribers_email_idx ON public.newsletter_subscribers (email);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_active_idx ON public.newsletter_subscribers (is_active);
