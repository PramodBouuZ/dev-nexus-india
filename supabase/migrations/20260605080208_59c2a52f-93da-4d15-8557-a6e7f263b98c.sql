
-- 1) Contracts INSERT: enforce recruiter role
DROP POLICY IF EXISTS contracts_insert_recruiter ON public.contracts;
CREATE POLICY contracts_insert_recruiter ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'::public.app_role));

-- 2) Move phone to private tables
CREATE TABLE IF NOT EXISTS public.developer_phones (
  developer_id uuid PRIMARY KEY REFERENCES public.developer_profiles(id) ON DELETE CASCADE,
  phone text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.developer_phones(developer_id, phone)
  SELECT id, phone FROM public.developer_profiles
  WHERE phone IS NOT NULL AND phone <> ''
ON CONFLICT (developer_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.recruiter_phones (
  recruiter_id uuid PRIMARY KEY REFERENCES public.recruiter_profiles(id) ON DELETE CASCADE,
  phone text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.recruiter_phones(recruiter_id, phone)
  SELECT id, phone FROM public.recruiter_profiles
  WHERE phone IS NOT NULL AND phone <> ''
ON CONFLICT (recruiter_id) DO NOTHING;

ALTER TABLE public.developer_profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE public.recruiter_profiles DROP COLUMN IF EXISTS phone;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_phones TO authenticated;
GRANT ALL ON public.developer_phones TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruiter_phones TO authenticated;
GRANT ALL ON public.recruiter_phones TO service_role;

ALTER TABLE public.developer_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_phones ENABLE ROW LEVEL SECURITY;

CREATE POLICY dp_select ON public.developer_phones FOR SELECT TO authenticated USING (
  auth.uid() = developer_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_contact_access(auth.uid(), developer_id)
  OR EXISTS (SELECT 1 FROM public.developer_profiles d WHERE d.id = developer_id AND d.contact_public = true)
);
CREATE POLICY dp_insert_own ON public.developer_phones FOR INSERT TO authenticated WITH CHECK (auth.uid() = developer_id);
CREATE POLICY dp_update_own ON public.developer_phones FOR UPDATE TO authenticated USING (auth.uid() = developer_id) WITH CHECK (auth.uid() = developer_id);
CREATE POLICY dp_delete_own ON public.developer_phones FOR DELETE TO authenticated USING (auth.uid() = developer_id);

CREATE POLICY rp_select ON public.recruiter_phones FOR SELECT TO authenticated USING (
  auth.uid() = recruiter_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_contact_access(auth.uid(), recruiter_id)
);
CREATE POLICY rp_insert_own ON public.recruiter_phones FOR INSERT TO authenticated WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY rp_update_own ON public.recruiter_phones FOR UPDATE TO authenticated USING (auth.uid() = recruiter_id) WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY rp_delete_own ON public.recruiter_phones FOR DELETE TO authenticated USING (auth.uid() = recruiter_id);

-- 3) Drop publicly readable email column on profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update handle_new_user trigger (don't insert email anymore)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;

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

-- 4) Restrict avatars listing (public URLs still work; bucket is public)
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars owner list" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND ((auth.uid())::text = (storage.foldername(name))[1]));

-- 5) Realtime broadcast channel access control
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime_msgs_read" ON realtime.messages;
CREATE POLICY "realtime_msgs_read" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    (topic LIKE 'msgs-%' AND public.is_application_party(NULLIF(substring(topic from 6), '')::uuid, auth.uid()))
    OR (topic = 'notif-' || auth.uid()::text)
    OR (topic = 'invites-rec-' || auth.uid()::text)
    OR (topic LIKE 'admin-rt-%' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  );

DROP POLICY IF EXISTS "realtime_msgs_write" ON realtime.messages;
CREATE POLICY "realtime_msgs_write" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (topic LIKE 'msgs-%' AND public.is_application_party(NULLIF(substring(topic from 6), '')::uuid, auth.uid()))
    OR (topic = 'notif-' || auth.uid()::text)
    OR (topic = 'invites-rec-' || auth.uid()::text)
    OR (topic LIKE 'admin-rt-%' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  );

-- 6) Revoke EXECUTE on internal trigger functions
REVOKE EXECUTE ON FUNCTION public.append_verification_history() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_application_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_application_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_contact_request_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_contact_request_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_invite_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_invite_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_stage_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_developer_verified() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
-- helper predicates: only anon needs to be blocked
REVOKE EXECUTE ON FUNCTION public.has_contact_access(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_application_party(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_project_party(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
