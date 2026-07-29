-- Migration to synchronize user metadata changes from auth.users (Google signup / fetchRole updates) to public tables
-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  -- We only execute if the raw_user_meta_data->>'role' has changed
  IF (NEW.raw_user_meta_data->>'role') IS DISTINCT FROM (OLD.raw_user_meta_data->>'role') AND (NEW.raw_user_meta_data->>'role') IS NOT NULL AND (NEW.raw_user_meta_data->>'role') <> '' THEN
    BEGIN
      v_role := (NEW.raw_user_meta_data->>'role')::public.app_role;
    EXCEPTION WHEN others THEN
      -- If cast fails, ignore
      RETURN NEW;
    END;

    -- Update or insert public.users
    INSERT INTO public.users (user_id, email, role)
    VALUES (NEW.id, COALESCE(NEW.email, ''), v_role)
    ON CONFLICT (user_id) DO UPDATE SET role = v_role;

    -- Update or insert public.user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id) DO UPDATE SET role = v_role;

    -- Ensure correct sub-profile exists and clean up the incorrect one
    IF v_role = 'recruiter' THEN
      INSERT INTO public.recruiter_profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
      DELETE FROM public.developer_profiles WHERE id = NEW.id;
    ELSIF v_role = 'developer' THEN
      INSERT INTO public.developer_profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
      DELETE FROM public.recruiter_profiles WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();
