-- Backfill any users that might have been created without public.users or user_roles records
-- This ensures existing users get their roles and public presence fixed

INSERT INTO public.users (user_id, email, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'role', 'developer')
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'role', 'developer')::app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure profiles exist for all users
INSERT INTO public.profiles (id, email, full_name)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Ensure sub-profiles exist
INSERT INTO public.developer_profiles (id, full_name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
WHERE COALESCE(u.raw_user_meta_data->>'role', 'developer') = 'developer'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recruiter_profiles (id, full_name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
WHERE COALESCE(u.raw_user_meta_data->>'role', 'developer') = 'recruiter'
ON CONFLICT (id) DO NOTHING;
