-- 1. Add documents checklist + status history timeline
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status_history jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Trigger: append to status_history on insert and on status change
CREATE OR REPLACE FUNCTION public.append_verification_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE entry jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    entry := jsonb_build_object(
      'status', NEW.status,
      'at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'by', NEW.developer_id,
      'note', 'Request submitted'
    );
    NEW.status_history := COALESCE(NEW.status_history, '[]'::jsonb) || entry;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    entry := jsonb_build_object(
      'status', NEW.status,
      'at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'by', COALESCE(NEW.reviewed_by, auth.uid()),
      'note', NEW.admin_notes
    );
    NEW.status_history := COALESCE(NEW.status_history, '[]'::jsonb) || entry;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_vr_history_ins ON public.verification_requests;
CREATE TRIGGER trg_vr_history_ins
BEFORE INSERT ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.append_verification_history();

DROP TRIGGER IF EXISTS trg_vr_history_upd ON public.verification_requests;
CREATE TRIGGER trg_vr_history_upd
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.append_verification_history();

-- 3. Seed admin user (email: admin@devconnect.app / password: Admin@12345)
DO $$
DECLARE admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@devconnect.app';
  IF admin_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_uid, 'authenticated', 'authenticated',
      'admin@devconnect.app', crypt('Admin@12345', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Platform Admin","role":"admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_uid,
            jsonb_build_object('sub', admin_uid::text, 'email', 'admin@devconnect.app', 'email_verified', true),
            'email', admin_uid::text, now(), now(), now());
    INSERT INTO public.profiles (id, email, full_name) VALUES (admin_uid, 'admin@devconnect.app', 'Platform Admin')
      ON CONFLICT (id) DO NOTHING;
  END IF;
  -- Ensure admin role assigned
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_uid, 'admin')
    ON CONFLICT DO NOTHING;
END $$;