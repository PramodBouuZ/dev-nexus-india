-- Database Migration: Advanced SEO, Blog CMS, NDAs, and Email Logs

-- 1. Create Enums if not exist
DO $$ BEGIN
  CREATE TYPE public.nda_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Create public.blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author TEXT NOT NULL DEFAULT 'DeveloperConnect Team',
  read_time TEXT DEFAULT '5 min read',
  category TEXT NOT NULL DEFAULT 'Hiring',
  tags TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' or 'published'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for blogs
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blogs_select_public ON public.blogs;
CREATE POLICY blogs_select_public ON public.blogs FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS blogs_admin_all ON public.blogs;
CREATE POLICY blogs_admin_all ON public.blogs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Create public.ndas table
CREATE TABLE IF NOT EXISTS public.ndas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT, -- if custom NDA pdf is uploaded
  template_name TEXT, -- 'standard' or other template selection
  status public.nda_status NOT NULL DEFAULT 'pending',
  developer_ip TEXT,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, developer_id)
);

-- Enable RLS for NDAs
ALTER TABLE public.ndas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ndas_select_parties ON public.ndas;
CREATE POLICY ndas_select_parties ON public.ndas FOR SELECT TO authenticated
  USING (auth.uid() = recruiter_id OR auth.uid() = developer_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS ndas_insert_recruiter ON public.ndas;
CREATE POLICY ndas_insert_recruiter ON public.ndas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recruiter_id);

DROP POLICY IF EXISTS ndas_update_parties ON public.ndas;
CREATE POLICY ndas_update_parties ON public.ndas FOR UPDATE TO authenticated
  USING (auth.uid() = recruiter_id OR auth.uid() = developer_id);

-- 4. Create public.email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed'
  error_message TEXT,
  email_type TEXT, -- 'welcome', 'reminder', 'invite', 'nda', 'milestone', 'chat', 'registration', 'application', 'contact'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for email logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_logs_admin_only ON public.email_logs;
CREATE POLICY email_logs_admin_only ON public.email_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add Progress & Deadline to project_stages
ALTER TABLE public.project_stages ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100);
ALTER TABLE public.project_stages ADD COLUMN IF NOT EXISTS deadline DATE;

-- 6. Add Unique SEO Slugs columns
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS company_slug TEXT UNIQUE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_slug TEXT UNIQUE;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS developer_slug TEXT UNIQUE;

-- Backfill slugs for existing recruiter profiles
UPDATE public.recruiter_profiles
SET company_slug = COALESCE(company_slug, lower(regexp_replace(regexp_replace(company_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substring(id::text, 1, 8))
WHERE company_name IS NOT NULL AND company_slug IS NULL;

-- Backfill slugs for existing projects
UPDATE public.projects
SET project_slug = COALESCE(project_slug, lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substring(id::text, 1, 8))
WHERE project_slug IS NULL;

-- Backfill slugs for existing developer profiles
UPDATE public.developer_profiles
SET developer_slug = COALESCE(developer_slug, lower(regexp_replace(regexp_replace(full_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substring(id::text, 1, 8))
WHERE developer_slug IS NULL AND full_name IS NOT NULL;
