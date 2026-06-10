
-- Make handle_new_user resilient: never let a side-table issue block auth signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
BEGIN
  -- Resolve role safely (default developer if missing/invalid)
  BEGIN
    v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'developer')::public.app_role;
  EXCEPTION WHEN others THEN
    v_role := 'developer'::public.app_role;
  END;

  BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
    ON CONFLICT (id) DO UPDATE
      SET email = COALESCE(EXCLUDED.email, public.profiles.email),
          full_name = COALESCE(NULLIF(EXCLUDED.full_name,''), public.profiles.full_name);
  EXCEPTION WHEN others THEN
    RAISE WARNING 'handle_new_user: profiles insert failed for %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'handle_new_user: user_roles insert failed for %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    IF v_role = 'recruiter' THEN
      INSERT INTO public.recruiter_profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO public.developer_profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'handle_new_user: sub-profile insert failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- Also guard the welcome-notification trigger so it can't break profile inserts.
CREATE OR REPLACE FUNCTION public.notify_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    INSERT INTO public.notifications(user_id,type,title,body,link)
    VALUES (NEW.id,'welcome','Welcome to Developer Connect!',
      'Complete your profile to start matching.', '/profile');
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_on_signup failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END
$function$;
