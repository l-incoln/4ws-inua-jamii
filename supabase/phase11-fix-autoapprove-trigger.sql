-- ============================================================
-- Phase 11: Fix auto-approve — trigger must respect membership_status
-- from raw_user_meta_data instead of always hardcoding 'pending'.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_status TEXT;
BEGIN
  meta_status := NEW.raw_user_meta_data ->> 'membership_status';

  INSERT INTO public.profiles (
    id, full_name, phone, avatar_url, membership_status,
    tier, selected_tier, consent_agreed, consent_agreed_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'avatar_url',
    -- Respect the status set by the signup action (auto-approve support)
    COALESCE(meta_status, 'pending'),
    COALESCE(NEW.raw_user_meta_data ->> 'tier', 'basic'),
    COALESCE(NEW.raw_user_meta_data ->> 'tier', 'basic'),
    COALESCE((NEW.raw_user_meta_data ->> 'consent_agreed')::boolean, FALSE),
    CASE WHEN (NEW.raw_user_meta_data ->> 'consent_agreed') = 'true' THEN NOW() ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    tier          = COALESCE(EXCLUDED.tier, profiles.tier),
    selected_tier = COALESCE(EXCLUDED.selected_tier, profiles.selected_tier),
    -- Only update status if the profile is still pending and metadata says approved
    membership_status = CASE
      WHEN profiles.membership_status = 'pending' AND COALESCE(meta_status, 'pending') = 'approved'
      THEN 'approved'
      ELSE profiles.membership_status
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
