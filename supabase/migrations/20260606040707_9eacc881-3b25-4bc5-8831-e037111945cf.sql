
-- Profiles: admin can update & delete any
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "profiles_admin_delete" ON public.profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Developer profiles: admin delete
CREATE POLICY "dev_admin_delete" ON public.developer_profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Recruiter profiles: admin update & delete
CREATE POLICY "rec_admin_update" ON public.recruiter_profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "rec_admin_delete" ON public.recruiter_profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Projects: admin delete & update
CREATE POLICY "projects_admin_update" ON public.projects FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "projects_admin_delete" ON public.projects FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure realtime delivers row data for these tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.developer_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.recruiter_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.projects REPLICA IDENTITY FULL;

-- Add to realtime publication if not present
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
