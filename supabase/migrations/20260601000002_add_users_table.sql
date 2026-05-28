-- 1. Create the public.users table as requested
CREATE TABLE IF NOT EXISTS public.users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
CREATE POLICY "Users can view their own record" ON public.users
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all records" ON public.users
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Update the trigger function to populate public.users and sync role correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  selected_role TEXT;
BEGIN
  -- Get role from metadata, default to 'developer'
  selected_role := COALESCE(NEW.raw_user_meta_data->>'role', 'developer');

  -- Insert into base profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Insert into public.users (the new table requested)
  INSERT INTO public.users (user_id, email, role)
  VALUES (NEW.id, NEW.email, selected_role);

  -- Assign role to public.user_roles (internal RBAC table)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role::app_role)
  ON CONFLICT DO NOTHING;

  -- Create matching subprofile shell
  IF selected_role = 'recruiter' THEN
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
