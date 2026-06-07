
-- Backfill emails on existing profiles from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Update handle_new_user to also populate email so new signups appear correctly in admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = COALESCE(EXCLUDED.email, public.profiles.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'developer'::public.app_role))
  ON CONFLICT DO NOTHING;

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'developer') = 'recruiter' THEN
    INSERT INTO public.recruiter_profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.developer_profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Add missing tables to realtime publication so admin gets live updates across all tabs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='contact_access_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_access_requests;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='verification_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='admin_alerts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_alerts;
  END IF;
END $$;

ALTER TABLE public.contact_access_requests REPLICA IDENTITY FULL;
