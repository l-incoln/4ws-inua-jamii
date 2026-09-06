-- Phase 19: SEO & site verification settings
-- Adds search engine verification keys to site_settings.
-- These are consumed by lib/seo.ts (buildRootMetadata) and injected as
-- <meta name="google-site-verification"> / <meta name="msvalidate.01"> tags.

-- Google Search Console verification token (content attribute value)
INSERT INTO public.site_settings (key, value) VALUES
  ('google_site_verification', ''),
  ('bing_site_verification', '')
ON CONFLICT (key) DO NOTHING;

-- Notify PostgREST to refresh schema cache (safe to run multiple times)
NOTIFY pgrst, 'reload schema';
