
-- 1) Backfill phones into private tables, then drop public phone columns
INSERT INTO public.developer_phones (developer_id, phone, updated_at)
SELECT id, phone, now() FROM public.developer_profiles
WHERE phone IS NOT NULL AND phone <> ''
ON CONFLICT (developer_id) DO NOTHING;

INSERT INTO public.recruiter_phones (recruiter_id, phone, updated_at)
SELECT id, phone, now() FROM public.recruiter_profiles
WHERE phone IS NOT NULL AND phone <> ''
ON CONFLICT (recruiter_id) DO NOTHING;

ALTER TABLE public.developer_profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE public.recruiter_profiles DROP COLUMN IF EXISTS phone;

-- 2) Restrict profiles.email column visibility (column-level grants).
-- Other profile columns remain readable per existing policy.
REVOKE SELECT (email) ON public.profiles FROM anon, authenticated;

-- RPC for admins to bulk read emails
CREATE OR REPLACE FUNCTION public.admin_list_user_emails()
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email FROM public.profiles
  WHERE public.has_role(auth.uid(), 'admin');
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_user_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_user_emails() TO authenticated;

-- RPC for self to read own email
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_email() TO authenticated;

-- 3) Add WITH CHECK constraints to UPDATE policies to prevent ownership transfer
DROP POLICY IF EXISTS contracts_update_parties ON public.contracts;
CREATE POLICY contracts_update_parties ON public.contracts
  FOR UPDATE
  USING (auth.uid() = developer_id OR auth.uid() = recruiter_id)
  WITH CHECK (auth.uid() = developer_id OR auth.uid() = recruiter_id);

DROP POLICY IF EXISTS projects_update_own ON public.projects;
CREATE POLICY projects_update_own ON public.projects
  FOR UPDATE
  USING (auth.uid() = recruiter_id)
  WITH CHECK (auth.uid() = recruiter_id);

-- 4) Revoke EXECUTE from PUBLIC on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_contact_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_contact_access(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_project_party(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_project_party(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_application_party(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_application_party(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_profile_view(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_profile_view(uuid) TO authenticated;
