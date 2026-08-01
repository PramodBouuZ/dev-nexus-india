-- Database Migration: Admin Analytics, Review Moderation, and Announcements

-- 1. Add review moderation columns to public.reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved'; -- 'pending', 'approved', 'rejected'
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS report_reason TEXT;

-- 2. Create public.announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT NOT NULL, -- 'all', 'developers', 'recruiters', 'premium', 'incomplete'
  delivery_methods TEXT[] NOT NULL DEFAULT '{in_app}', -- 'email', 'in_app'
  scheduled_at TIMESTAMPTZ, -- NULL means send immediately
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_select_all ON public.announcements;
CREATE POLICY announcements_select_all ON public.announcements FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS announcements_admin_all ON public.announcements;
CREATE POLICY announcements_admin_all ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
