-- Add missing columns to developer_profiles for single-table persistence
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS developer_type TEXT;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS weekly_rate_inr INTEGER;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS monthly_rate_inr INTEGER;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS project_min_inr INTEGER;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS contact_public BOOLEAN DEFAULT false;

-- Add hours_per_day and time_slots which were in the UI but maybe missing from schema
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS hours_per_day INTEGER;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS time_slots TEXT;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS available_days TEXT[] DEFAULT '{}';

-- Add missing columns to recruiter_profiles for single-table persistence
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Migration to sync existing full_name and avatar_url from profiles to developer_profiles and recruiter_profiles
UPDATE public.developer_profiles dp
SET
  full_name = p.full_name,
  avatar_url = p.avatar_url
FROM public.profiles p
WHERE dp.id = p.id;

UPDATE public.recruiter_profiles rp
SET
  full_name = p.full_name,
  avatar_url = p.avatar_url
FROM public.profiles p
WHERE rp.id = p.id;

-- Update trigger function to sync full_name to sub-profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Assign role from signup metadata (developer/recruiter); default developer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'developer'::app_role)
  )
  ON CONFLICT DO NOTHING;

  -- Create matching subprofile shell with full_name
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'developer') = 'recruiter' THEN
    INSERT INTO public.recruiter_profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.developer_profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
