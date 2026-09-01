-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 14 Migration
-- Payments feature flag (site_settings.payments_enabled)
--
-- Adds a single CMS-toggleable flag that gates all online payment
-- functionality (donations + membership fee payments via M-Pesa / card).
--
-- The site ships with payments PAUSED (value = 'false') so it can go
-- live before the live payment details are finalised. Wherever users
-- would encounter payment UI, a "Coming Soon" notice is shown instead.
-- An admin flips this to 'true' from Admin › Settings › Payments once
-- the live M-Pesa / payment integration is configured and verified —
-- no redeploy required.
--
-- Safe to run multiple times (ON CONFLICT).
-- ============================================================

INSERT INTO public.site_settings (key, value, updated_at)
VALUES ('payments_enabled', 'false', now())
ON CONFLICT (key) DO NOTHING;
