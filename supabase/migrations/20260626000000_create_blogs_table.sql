-- Migration: Create Blogs Table
-- Safely creates the blogs table with appropriate columns, indexes, constraints, RLS policies, and Realtime configuration from scratch.
-- Reuses the existing authentication/user architecture without assuming/using the has_role() function.

-- 1. Create public.blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  author TEXT NOT NULL DEFAULT 'DeveloperConnect Team',
  read_time TEXT DEFAULT '5 min read',
  category TEXT NOT NULL DEFAULT 'Hiring',
  tags TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT check_blogs_status CHECK (status IN ('draft', 'published')),
  CONSTRAINT check_blogs_slug_not_empty CHECK (length(trim(slug)) > 0),
  CONSTRAINT blogs_slug_unique UNIQUE (slug)
);

-- 2. Indexes for fast retrieval and sorting
CREATE INDEX IF NOT EXISTS blogs_status_idx ON public.blogs (status);
CREATE INDEX IF NOT EXISTS blogs_created_at_idx ON public.blogs (created_at DESC);
CREATE INDEX IF NOT EXISTS blogs_slug_idx ON public.blogs (slug);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Drop existing policies if they exist (to ensure idempotency)
DROP POLICY IF EXISTS blogs_select_policy ON public.blogs;
DROP POLICY IF EXISTS blogs_select_public ON public.blogs;
DROP POLICY IF EXISTS blogs_admin_policy ON public.blogs;
DROP POLICY IF EXISTS blogs_admin_all ON public.blogs;

-- Policy for reading blogs:
-- Anyone (including public/anon) can view 'published' blogs.
-- Users with 'admin' roles (authenticated) can view any blogs (including drafts).
-- The admin check is done inline using:
--   a) User email check (hardcoded superadmin fallback)
--   b) auth.jwt() metadata claim ('user_metadata' ->> 'role' = 'admin')
--   c) public.users table check
--   d) public.user_roles table check
CREATE POLICY blogs_select_policy ON public.blogs FOR SELECT
  USING (
    status = 'published' OR
    (
      auth.uid() IS NOT NULL AND
      (
        (auth.jwt() ->> 'email' = 'info.bouuz@gmail.com') OR
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
        EXISTS (
          SELECT 1 FROM public.users
          WHERE public.users.user_id = auth.uid()
          AND public.users.role = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE public.user_roles.user_id = auth.uid()
          AND public.user_roles.role::text = 'admin'
        )
      )
    )
  );

-- Policy for admin actions (INSERT, UPDATE, DELETE):
-- Only authenticated admin users can modify blogs.
CREATE POLICY blogs_admin_policy ON public.blogs FOR ALL TO authenticated
  USING (
    (auth.jwt() ->> 'email' = 'info.bouuz@gmail.com') OR
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.user_id = auth.uid()
      AND public.users.role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE public.user_roles.user_id = auth.uid()
      AND public.user_roles.role::text = 'admin'
    )
  );

-- 5. Realtime Configuration
-- Set replica identity to FULL to support update/delete tracking
ALTER TABLE public.blogs REPLICA IDENTITY FULL;

-- Safely add the blogs table to the supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'blogs'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.blogs;
    END IF;
  END IF;
END $$;
