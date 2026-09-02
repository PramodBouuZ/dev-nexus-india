-- 1. App-level user settings
CREATE TABLE IF NOT EXISTS public.users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier text NOT NULL DEFAULT 'free',
  reminders_disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_or_admin" ON public.users FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_insert_own_or_admin" ON public.users FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_update_own_or_admin" ON public.users FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_users_touch BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Email logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  email_type text NOT NULL DEFAULT 'notification',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs (created_at DESC);
GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_logs_admin_select" ON public.email_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Profile email reminders
CREATE TABLE IF NOT EXISTS public.profile_email_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reminder_stage integer,
  reminder_type text NOT NULL DEFAULT 'automatic',
  email_status text NOT NULL DEFAULT 'sent',
  sent_by text,
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_per_user ON public.profile_email_reminders (user_id, sent_at DESC);
GRANT SELECT ON public.profile_email_reminders TO authenticated;
GRANT ALL ON public.profile_email_reminders TO service_role;
ALTER TABLE public.profile_email_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_admin_select" ON public.profile_email_reminders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  target_audience text NOT NULL DEFAULT 'all',
  delivery_methods text[] NOT NULL DEFAULT ARRAY['in_app']::text[],
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann_select_auth" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "ann_admin_insert" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ann_admin_update" ON public.announcements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ann_admin_delete" ON public.announcements FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_ann_touch BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Blogs
CREATE TABLE IF NOT EXISTS public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  content text NOT NULL DEFAULT '',
  featured_image text,
  category text,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  seo_title text,
  seo_description text,
  status text NOT NULL DEFAULT 'draft',
  author text NOT NULL DEFAULT 'DeveloperConnect Team',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blogs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blogs TO authenticated;
GRANT ALL ON public.blogs TO service_role;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blogs_public_read_published" ON public.blogs FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "blogs_admin_insert" ON public.blogs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "blogs_admin_update" ON public.blogs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "blogs_admin_delete" ON public.blogs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_blogs_touch BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. NDAs
CREATE TABLE IF NOT EXISTS public.ndas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL,
  developer_id uuid NOT NULL,
  file_url text,
  template_name text,
  template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  viewed_at timestamptz,
  received_at timestamptz,
  accepted_at timestamptz,
  developer_ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ndas_project_dev ON public.ndas (project_id, developer_id);
GRANT SELECT, INSERT, UPDATE ON public.ndas TO authenticated;
GRANT ALL ON public.ndas TO service_role;
ALTER TABLE public.ndas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ndas_party_select" ON public.ndas FOR SELECT TO authenticated
  USING (recruiter_id = auth.uid() OR developer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ndas_recruiter_insert" ON public.ndas FOR INSERT TO authenticated
  WITH CHECK (recruiter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ndas_party_update" ON public.ndas FOR UPDATE TO authenticated
  USING (recruiter_id = auth.uid() OR developer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (recruiter_id = auth.uid() OR developer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_ndas_touch BEFORE UPDATE ON public.ndas
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 7. Project activities
CREATE TABLE IF NOT EXISTS public.project_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid,
  activity_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pa_project ON public.project_activities (project_id, created_at DESC);
GRANT SELECT, INSERT ON public.project_activities TO authenticated;
GRANT ALL ON public.project_activities TO service_role;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pa_party_select" ON public.project_activities FOR SELECT TO authenticated
  USING (public.is_project_party(project_id, auth.uid()) OR user_id = auth.uid());
CREATE POLICY "pa_party_insert" ON public.project_activities FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 8. Projects assignment columns + statuses
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_developer_id uuid;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'in_discussion';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'cancelled';

-- 9. Realtime
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.email_logs REPLICA IDENTITY FULL;
ALTER TABLE public.profile_email_reminders REPLICA IDENTITY FULL;
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER TABLE public.blogs REPLICA IDENTITY FULL;
ALTER TABLE public.ndas REPLICA IDENTITY FULL;
ALTER TABLE public.project_activities REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_email_reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blogs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ndas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;