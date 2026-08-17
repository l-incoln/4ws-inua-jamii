-- ============================================================
-- Phase 11e: Seed missing feature toggle defaults
-- Ensures all admin settings toggles have a DB row so they
-- show up correctly in the admin settings page.
-- ============================================================

INSERT INTO public.site_settings (key, value) VALUES
  -- Membership
  ('new_signups_enabled',             'true'),
  ('auto_approve_members',            'false'),
  -- Email / Notifications
  ('welcome_email_enabled',           'true'),
  -- Homepage section visibility
  ('show_impact_stats',               'true'),
  ('show_events_preview',             'true'),
  -- Events & RSVP
  ('rsvp_enabled',                    'true'),
  ('rsvp_require_login',              'true'),
  ('event_reminder_days',             '2'),
  -- Payments
  ('donation_currency',               'KES'),
  ('min_donation_amount',             '100'),
  ('mpesa_shortcode_type',            'paybill'),
  -- Legal / Footer defaults
  ('privacy_policy_url',              '/privacy'),
  ('terms_url',                       '/terms'),
  ('footer_tagline',                  'Empowering communities through unity, service, and sustainable impact.'),
  -- Membership currency
  ('membership_currency',             'KES')
ON CONFLICT (key) DO NOTHING;
