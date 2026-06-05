
ALTER TABLE public.developer_profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS profile_views integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_rate integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_projects integer NOT NULL DEFAULT 0;

ALTER TABLE public.recruiter_profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- Backfill emails from auth.users
UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND p.email IS NULL;

-- Backfill phone from gated tables (so admin UI shows existing values)
UPDATE public.developer_profiles dp SET phone = dph.phone FROM public.developer_phones dph WHERE dph.developer_id = dp.id AND dp.phone IS NULL;
UPDATE public.recruiter_profiles rp SET phone = rph.phone FROM public.recruiter_phones rph WHERE rph.recruiter_id = rp.id AND rp.phone IS NULL;

-- Increment profile views helper
CREATE OR REPLACE FUNCTION public.increment_profile_view(_developer_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.developer_profiles SET profile_views = profile_views + 1 WHERE id = _developer_id;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_profile_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_profile_view(uuid) TO anon, authenticated;

-- Admin alerts table
CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_alerts TO authenticated;
GRANT ALL ON public.admin_alerts TO service_role;
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_alerts_admin_only" ON public.admin_alerts;
CREATE POLICY "admin_alerts_admin_only" ON public.admin_alerts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
