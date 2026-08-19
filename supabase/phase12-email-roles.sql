-- ============================================================
-- Phase 12: Four-role email routing
--
-- Seeds the four canonical role addresses that own all outbound
-- communication. Each is CMS-editable from Admin › Email & Notifications;
-- these rows only ensure a default exists for fresh installs and for
-- deployments that never set them manually.
--
--   no-reply@     Automation     — receipts, confirmations, alerts (no reply-to)
--   info@         Public         — general enquiries, newsletter
--   membership@   Member relations — membership comms, birthday reminders
--   admin@        Administration  — payments, approvals, system alerts
--
-- Also normalises the public contact_email to the canonical domain
-- (4wsinuajamii.org, no hyphen) so the footer/contact page match the roles.
-- ============================================================

INSERT INTO public.site_settings (key, value) VALUES
  ('email_role_noreply',    'no-reply@4wsinuajamii.org'),
  ('email_role_info',       'info@4wsinuajamii.org'),
  ('email_role_membership', 'membership@4wsinuajamii.org'),
  ('email_role_admin',      'admin@4wsinuajamii.org')
ON CONFLICT (key) DO NOTHING;

-- Normalise the legacy hyphenated contact domain to the canonical one.
-- Only updates rows that still hold the old hyphenated address; leaves any
-- admin-customised value untouched.
UPDATE public.site_settings
   SET value = 'info@4wsinuajamii.org'
 WHERE key = 'contact_email'
   AND value = 'info@4ws-inuajamii.org';
