-- DeveloperConnect - Phase 2: Project Workflow & Timeline Management Migration
-- Compatible with the existing production database

-- 1. Create the base stage_status Enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.stage_status AS ENUM ('planned','in_progress','under_review','completed','blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create the base project_stages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.project_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  status public.stage_status NOT NULL DEFAULT 'planned',
  position integer NOT NULL DEFAULT 0,
  comment text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Extend public.stage_status Enum with new standard statuses
ALTER TYPE public.stage_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.stage_status ADD VALUE IF NOT EXISTS 'waiting_for_approval';
ALTER TYPE public.stage_status ADD VALUE IF NOT EXISTS 'delayed';
ALTER TYPE public.stage_status ADD VALUE IF NOT EXISTS 'cancelled';

-- 4. Add new columns to public.project_stages safely if they don't exist
ALTER TABLE public.project_stages ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100);
ALTER TABLE public.project_stages ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE public.project_stages ADD COLUMN IF NOT EXISTS start_date DATE;

-- 5. Create public.project_activities table for tracking history safely
CREATE TABLE IF NOT EXISTS public.project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'project_created', 'timeline_created', 'stage_added', 'stage_updated', 'stage_deleted', 'stage_reordered', 'progress_updated', 'stage_completed', 'deadline_updated', 'project_started', 'project_completed', 'invitation_accepted'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for project_activities
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

-- Helper to check if a user is a project party
DROP POLICY IF EXISTS pa_select_parties ON public.project_activities;
CREATE POLICY pa_select_parties ON public.project_activities FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.recruiter_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.applications a WHERE a.project_id = project_id AND a.developer_id = auth.uid() AND a.status = 'accepted'
    ) OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS pa_insert_parties ON public.project_activities;
CREATE POLICY pa_insert_parties ON public.project_activities FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.recruiter_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.applications a WHERE a.project_id = project_id AND a.developer_id = auth.uid() AND a.status = 'accepted'
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- 6. Enable Supabase Realtime for both project_stages and project_activities
ALTER TABLE public.project_stages REPLICA IDENTITY FULL;
ALTER TABLE public.project_activities REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.project_stages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.project_activities; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Ensure seeded admin also has recruiter role to allow project posting & full workflow testing
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'recruiter'::public.app_role FROM auth.users WHERE email = 'admin@devconnect.app'
ON CONFLICT DO NOTHING;
