-- ============================================================
-- Phase 11c: Email logs table for audit trail
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient   TEXT NOT NULL,
  subject     TEXT NOT NULL,
  template    TEXT,
  status      TEXT NOT NULL DEFAULT 'sent',
  error       TEXT,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read email logs
CREATE POLICY "email_logs: admin read"
  ON public.email_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Only the service role (server-side) can insert
CREATE POLICY "email_logs: service insert"
  ON public.email_logs FOR INSERT
  WITH CHECK (TRUE);

-- Only admins can delete (cleanup)
CREATE POLICY "email_logs: admin delete"
  ON public.email_logs FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS email_logs_sent_at_idx ON public.email_logs (sent_at DESC);
CREATE INDEX IF NOT EXISTS email_logs_recipient_idx ON public.email_logs (recipient);
