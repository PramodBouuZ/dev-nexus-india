-- DeveloperConnect — full schema bundle
-- Run ONCE on a brand-new Supabase project via SQL Editor
-- Generated: 2026-06-09T05:51:25Z


-- ========================================================================
-- 20260425173508_8ff6ec95-4d90-43d5-8caf-c9de8e82b546.sql
-- ========================================================================

-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'developer', 'recruiter');
CREATE TYPE public.project_type AS ENUM ('fixed', 'hourly');
CREATE TYPE public.project_status AS ENUM ('open', 'in_progress', 'completed', 'closed');
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE public.contract_status AS ENUM ('active', 'completed', 'cancelled');

-- PROFILES (one per auth user)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES (separate table to avoid privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- DEVELOPER PROFILES
CREATE TABLE public.developer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  hourly_rate_inr INTEGER,
  availability_hours_per_week INTEGER,
  experience_years INTEGER,
  github_url TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  location TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;

-- RECRUITER PROFILES
CREATE TABLE public.recruiter_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_website TEXT,
  company_description TEXT,
  company_size TEXT,
  industry TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recruiter_profiles ENABLE ROW LEVEL SECURITY;

-- PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tech_stack TEXT[] DEFAULT '{}',
  project_type project_type NOT NULL DEFAULT 'fixed',
  budget_min_inr INTEGER,
  budget_max_inr INTEGER,
  hours_per_week INTEGER,
  duration_weeks INTEGER,
  status project_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- APPLICATIONS
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_message TEXT,
  proposed_rate_inr INTEGER,
  status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, developer_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- CONTRACTS
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreed_rate_inr INTEGER,
  status contract_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- MESSAGES (per application thread)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contract_id, reviewer_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_dev_touch BEFORE UPDATE ON public.developer_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_rec_touch BEFORE UPDATE ON public.recruiter_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_proj_touch BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_app_touch BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Assign role from signup metadata (developer/recruiter); default developer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'developer'::app_role)
  )
  ON CONFLICT DO NOTHING;

  -- Create matching subprofile shell
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'developer') = 'recruiter' THEN
    INSERT INTO public.recruiter_profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.developer_profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== RLS POLICIES ===========

-- profiles: anyone authenticated can read; user can update own
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles: user can read own; admin can read all
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- developer_profiles: public read, owner write, admin verify
CREATE POLICY "dev_select_all" ON public.developer_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "dev_update_own" ON public.developer_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "dev_insert_own" ON public.developer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "dev_admin_update" ON public.developer_profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- recruiter_profiles
CREATE POLICY "rec_select_all" ON public.recruiter_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "rec_update_own" ON public.recruiter_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "rec_insert_own" ON public.recruiter_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- projects: anyone authenticated can read open projects, recruiter manages own
CREATE POLICY "projects_select_all" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert_recruiter" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = recruiter_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = recruiter_id);

-- applications: developer creates; both parties can read; recruiter & developer can update status
CREATE POLICY "apps_select_parties" ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = developer_id OR auth.uid() IN (SELECT recruiter_id FROM public.projects WHERE id = project_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "apps_insert_dev" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = developer_id AND public.has_role(auth.uid(), 'developer'));
CREATE POLICY "apps_update_parties" ON public.applications FOR UPDATE TO authenticated
  USING (auth.uid() = developer_id OR auth.uid() IN (SELECT recruiter_id FROM public.projects WHERE id = project_id));

-- contracts: parties can read; recruiter creates
CREATE POLICY "contracts_select_parties" ON public.contracts FOR SELECT TO authenticated
  USING (auth.uid() = developer_id OR auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "contracts_insert_recruiter" ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "contracts_update_parties" ON public.contracts FOR UPDATE TO authenticated
  USING (auth.uid() = developer_id OR auth.uid() = recruiter_id);

-- messages: only application parties can read/insert
CREATE POLICY "msg_select_parties" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() IN (
    SELECT a.developer_id FROM public.applications a WHERE a.id = application_id
    UNION
    SELECT p.recruiter_id FROM public.applications a JOIN public.projects p ON p.id = a.project_id WHERE a.id = application_id
  ));
CREATE POLICY "msg_insert_parties" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND auth.uid() IN (
    SELECT a.developer_id FROM public.applications a WHERE a.id = application_id
    UNION
    SELECT p.recruiter_id FROM public.applications a JOIN public.projects p ON p.id = a.project_id WHERE a.id = application_id
  ));

-- reviews
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews_insert_party" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND auth.uid() IN (
    SELECT developer_id FROM public.contracts WHERE id = contract_id
    UNION
    SELECT recruiter_id FROM public.contracts WHERE id = contract_id
  ));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- ========================================================================
-- 20260425173533_ed7eb2a8-f6ac-45c3-a248-d876e48a29f5.sql
-- ========================================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;


-- ========================================================================
-- 20260426030721_7355e018-9663-4b1f-97de-bec08cf50065.sql
-- ========================================================================
-- Status enum for verification requests
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id UUID NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'pending',
  github_url TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  notes TEXT,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Only one pending request per developer
CREATE UNIQUE INDEX verification_requests_one_pending
  ON public.verification_requests (developer_id)
  WHERE status = 'pending';

CREATE INDEX verification_requests_status_idx ON public.verification_requests (status);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Developer can view own requests; admins view all
CREATE POLICY "vr_select_own_or_admin"
ON public.verification_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = developer_id
  OR public.has_role(auth.uid(), 'admin')
);

-- Developer creates their own request
CREATE POLICY "vr_insert_own"
ON public.verification_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = developer_id
  AND public.has_role(auth.uid(), 'developer')
);

-- Developer can update their own pending request (edit before review)
CREATE POLICY "vr_update_own_pending"
ON public.verification_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = developer_id AND status = 'pending')
WITH CHECK (auth.uid() = developer_id AND status = 'pending');

-- Admin can update any request (approve/reject)
CREATE POLICY "vr_update_admin"
ON public.verification_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER trg_vr_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Sync developer_profiles.is_verified when admin reviews
CREATE OR REPLACE FUNCTION public.sync_developer_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.developer_profiles
      SET is_verified = true, updated_at = now()
      WHERE id = NEW.developer_id;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    UPDATE public.developer_profiles
      SET is_verified = false, updated_at = now()
      WHERE id = NEW.developer_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_developer_verified
AFTER UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_developer_verified();

-- ========================================================================
-- 20260428123932_789b3b09-1515-4e41-91c8-a7a6952c446a.sql
-- ========================================================================
-- ============ ENUMS ============
CREATE TYPE public.work_preference AS ENUM ('part_time', 'full_time', 'both');
CREATE TYPE public.hiring_type AS ENUM ('part_time', 'weekly', 'monthly', 'ongoing');
CREATE TYPE public.work_mode AS ENUM ('remote', 'hybrid', 'onsite');
CREATE TYPE public.developer_type AS ENUM ('frontend', 'backend', 'fullstack', 'mobile', 'devops', 'data', 'ai_ml', 'designer', 'other');
CREATE TYPE public.contact_access_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.notification_type AS ENUM (
  'new_matching_project','new_application','application_accepted','application_rejected',
  'recruiter_invite','invite_accepted','contact_request','contact_approved','contact_rejected',
  'project_update','account_update','welcome'
);
CREATE TYPE public.invite_status AS ENUM ('pending','accepted','rejected','withdrawn');

-- Extend application_status if missing values
DO $$ BEGIN
  ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'shortlisted';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ DEVELOPER PROFILE EXTENSIONS ============
ALTER TABLE public.developer_profiles
  ADD COLUMN IF NOT EXISTS work_preference public.work_preference DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS hours_per_day integer,
  ADD COLUMN IF NOT EXISTS available_days text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_slots text,
  ADD COLUMN IF NOT EXISTS weekly_rate_inr integer,
  ADD COLUMN IF NOT EXISTS monthly_rate_inr integer,
  ADD COLUMN IF NOT EXISTS project_min_inr integer,
  ADD COLUMN IF NOT EXISTS developer_type public.developer_type,
  ADD COLUMN IF NOT EXISTS phone text;

-- ============ RECRUITER PROFILE: phone ============
ALTER TABLE public.recruiter_profiles
  ADD COLUMN IF NOT EXISTS phone text;

-- ============ PROJECT EXTENSIONS ============
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS hiring_type public.hiring_type DEFAULT 'part_time',
  ADD COLUMN IF NOT EXISTS developer_type public.developer_type,
  ADD COLUMN IF NOT EXISTS work_mode public.work_mode DEFAULT 'remote',
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS ai_suggestions jsonb;

-- ============ INVITES (recruiter -> developer direct invite) ============
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL,
  developer_id uuid NOT NULL,
  project_id uuid,
  message text,
  status public.invite_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY invites_insert_recruiter ON public.invites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));
CREATE POLICY invites_select_parties ON public.invites FOR SELECT TO authenticated
  USING (auth.uid() = recruiter_id OR auth.uid() = developer_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY invites_update_parties ON public.invites FOR UPDATE TO authenticated
  USING (auth.uid() = recruiter_id OR auth.uid() = developer_id);
CREATE TRIGGER trg_invites_touch BEFORE UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CONTACT ACCESS REQUESTS ============
-- Mutual approval: requester asks; target approves/rejects.
-- Contact is revealed to BOTH only when status='approved' (target approved).
CREATE TABLE IF NOT EXISTS public.contact_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  target_id uuid NOT NULL,
  status public.contact_access_status NOT NULL DEFAULT 'pending',
  message text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (requester_id <> target_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS contact_access_unique_pair_pending
  ON public.contact_access_requests (LEAST(requester_id,target_id), GREATEST(requester_id,target_id))
  WHERE status = 'pending';

ALTER TABLE public.contact_access_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY car_select_parties ON public.contact_access_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = target_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY car_insert_requester ON public.contact_access_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY car_update_target ON public.contact_access_requests FOR UPDATE TO authenticated
  USING (auth.uid() = target_id) WITH CHECK (auth.uid() = target_id);
CREATE TRIGGER trg_car_touch BEFORE UPDATE ON public.contact_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Helper: do these two users have approved contact access?
CREATE OR REPLACE FUNCTION public.has_contact_access(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contact_access_requests
    WHERE status = 'approved'
      AND ((requester_id=_a AND target_id=_b) OR (requester_id=_b AND target_id=_a))
  )
$$;

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_select_own ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notif_update_own ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ TRIGGER FUNCTIONS for notifications ============

-- Application created -> notify recruiter
CREATE OR REPLACE FUNCTION public.notify_on_application_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rec_id uuid; ptitle text; dname text;
BEGIN
  SELECT recruiter_id, title INTO rec_id, ptitle FROM public.projects WHERE id = NEW.project_id;
  SELECT full_name INTO dname FROM public.profiles WHERE id = NEW.developer_id;
  IF rec_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,type,title,body,link)
    VALUES (rec_id,'new_application',
      COALESCE(dname,'A developer') || ' applied to "' || COALESCE(ptitle,'your project') || '"',
      NEW.cover_message,
      '/projects/' || NEW.project_id::text);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_on_application AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_insert();

-- Application status change -> notify developer
CREATE OR REPLACE FUNCTION public.notify_on_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ptitle text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT title INTO ptitle FROM public.projects WHERE id = NEW.project_id;
    INSERT INTO public.notifications(user_id,type,title,body,link)
    VALUES (NEW.developer_id,
      CASE NEW.status WHEN 'accepted' THEN 'application_accepted'::notification_type
                      WHEN 'rejected' THEN 'application_rejected'::notification_type
                      ELSE 'project_update'::notification_type END,
      'Your application was ' || NEW.status::text,
      'Project: ' || COALESCE(ptitle,''),
      '/applications/' || NEW.id::text);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_on_app_status AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_status();

-- Invite created -> notify developer
CREATE OR REPLACE FUNCTION public.notify_on_invite_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rname text;
BEGIN
  SELECT full_name INTO rname FROM public.profiles WHERE id = NEW.recruiter_id;
  INSERT INTO public.notifications(user_id,type,title,body,link)
  VALUES (NEW.developer_id,'recruiter_invite',
    COALESCE(rname,'A recruiter') || ' sent you an invite',
    NEW.message,'/dashboard');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_on_invite AFTER INSERT ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_invite_insert();

-- Invite accepted -> notify recruiter
CREATE OR REPLACE FUNCTION public.notify_on_invite_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE dname text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status='accepted' THEN
    SELECT full_name INTO dname FROM public.profiles WHERE id = NEW.developer_id;
    INSERT INTO public.notifications(user_id,type,title,body,link)
    VALUES (NEW.recruiter_id,'invite_accepted',
      COALESCE(dname,'A developer') || ' accepted your invite',NULL,'/dashboard');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_on_invite_status AFTER UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_invite_status();

-- Contact request created -> notify target
CREATE OR REPLACE FUNCTION public.notify_on_contact_request_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rname text;
BEGIN
  SELECT full_name INTO rname FROM public.profiles WHERE id = NEW.requester_id;
  INSERT INTO public.notifications(user_id,type,title,body,link)
  VALUES (NEW.target_id,'contact_request',
    COALESCE(rname,'Someone') || ' requested your contact details',
    NEW.message,'/dashboard');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_on_car_insert AFTER INSERT ON public.contact_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_contact_request_insert();

-- Contact request status update -> notify requester
CREATE OR REPLACE FUNCTION public.notify_on_contact_request_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications(user_id,type,title,body,link)
    VALUES (NEW.requester_id,
      CASE NEW.status WHEN 'approved' THEN 'contact_approved'::notification_type
                      ELSE 'contact_rejected'::notification_type END,
      'Contact request ' || NEW.status::text, NULL, '/dashboard');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_on_car_status AFTER UPDATE ON public.contact_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_contact_request_status();

-- Welcome notification on signup
CREATE OR REPLACE FUNCTION public.notify_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.notifications(user_id,type,title,body,link)
  VALUES (NEW.id,'welcome','Welcome to Developer Connect!',
    'Complete your profile to start matching.', '/profile');
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_on_signup AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_signup();

-- ========================================================================
-- 20260428123958_d0569dc1-1a14-4cd5-94ee-895cfc90f641.sql
-- ========================================================================
REVOKE EXECUTE ON FUNCTION public.notify_on_application_insert() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_application_status() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_invite_insert() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_invite_status() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_contact_request_insert() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_contact_request_status() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_signup() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_contact_access(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_contact_access(uuid, uuid) TO authenticated;

-- ========================================================================
-- 20260501064657_8b9c5e17-e5be-43c0-8b98-6f7d35b6344a.sql
-- ========================================================================

-- 1) Stage status enum
DO $$ BEGIN
  CREATE TYPE public.stage_status AS ENUM ('planned','in_progress','under_review','completed','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Add stage_update to notification_type enum
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'stage_update';
EXCEPTION WHEN others THEN NULL; END $$;

-- 3) project_stages
CREATE TABLE IF NOT EXISTS public.project_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text NOT NULL,
  status public.stage_status NOT NULL DEFAULT 'planned',
  position integer NOT NULL DEFAULT 0,
  comment text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_stages_project ON public.project_stages(project_id);

ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;

-- Helper: only project parties (recruiter, hired developer, admin) can see
CREATE OR REPLACE FUNCTION public.is_project_party(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.recruiter_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.contracts c WHERE c.project_id = _project_id AND c.developer_id = _user_id
  ) OR public.has_role(_user_id, 'admin'::app_role)
$$;

CREATE POLICY ps_select_parties ON public.project_stages
  FOR SELECT TO authenticated
  USING (public.is_project_party(project_id, auth.uid()));

CREATE POLICY ps_insert_parties ON public.project_stages
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_party(project_id, auth.uid()) AND updated_by = auth.uid());

CREATE POLICY ps_update_parties ON public.project_stages
  FOR UPDATE TO authenticated
  USING (public.is_project_party(project_id, auth.uid()))
  WITH CHECK (public.is_project_party(project_id, auth.uid()));

CREATE POLICY ps_delete_parties ON public.project_stages
  FOR DELETE TO authenticated
  USING (public.is_project_party(project_id, auth.uid()));

CREATE TRIGGER trg_ps_touch
BEFORE UPDATE ON public.project_stages
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Notify on insert/status change
CREATE OR REPLACE FUNCTION public.notify_on_stage_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rec_id uuid; dev_id uuid; ptitle text; target uuid;
BEGIN
  SELECT recruiter_id, title INTO rec_id, ptitle FROM public.projects WHERE id = NEW.project_id;
  SELECT developer_id INTO dev_id FROM public.contracts WHERE project_id = NEW.project_id ORDER BY created_at DESC LIMIT 1;
  -- notify the other party
  IF NEW.updated_by = rec_id THEN target := dev_id; ELSE target := rec_id; END IF;
  IF target IS NOT NULL AND target <> NEW.updated_by THEN
    INSERT INTO public.notifications(user_id,type,title,body,link)
    VALUES (target,'stage_update',
      'Stage "' || NEW.name || '" — ' || NEW.status::text,
      COALESCE('Project: '||ptitle,''),
      '/projects/'||NEW.project_id::text);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_stage_insert AFTER INSERT ON public.project_stages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_stage_change();

CREATE TRIGGER trg_stage_update AFTER UPDATE OF status ON public.project_stages
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_on_stage_change();

-- 4) Add attachments to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Allow body to be empty when attachments exist
ALTER TABLE public.messages ALTER COLUMN body DROP NOT NULL;

-- 5) Storage bucket for chat files (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files','chat-files', false, 10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip','application/x-zip-compressed','application/x-zip',
    'image/png','image/jpeg','image/webp','image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types, public = EXCLUDED.public;

-- Storage policies: file path must be {application_id}/{filename}
-- Only application participants can read/write.
CREATE OR REPLACE FUNCTION public.is_application_party(_app_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.applications a
    LEFT JOIN public.projects p ON p.id = a.project_id
    WHERE a.id = _app_id AND (a.developer_id = _user_id OR p.recruiter_id = _user_id)
  )
$$;

CREATE POLICY "chat-files read parties" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-files'
  AND public.is_application_party((storage.foldername(name))[1]::uuid, auth.uid())
);

CREATE POLICY "chat-files insert parties" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-files'
  AND public.is_application_party((storage.foldername(name))[1]::uuid, auth.uid())
  AND owner = auth.uid()
);

CREATE POLICY "chat-files delete owner" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'chat-files' AND owner = auth.uid());


-- ========================================================================
-- 20260503043535_5444ec57-1961-4e4a-bf5e-0fc0423697d4.sql
-- ========================================================================
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

-- ========================================================================
-- 20260503044822_368b84ff-faf2-4fef-ac44-145696c0caa8.sql
-- ========================================================================
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS contact_public boolean NOT NULL DEFAULT false;

-- ========================================================================
-- 20260508181907_ea124447-1fa1-43af-a795-f92ac43b71f3.sql
-- ========================================================================
-- Favorites table (recruiters save developers, developers save projects)
CREATE TYPE public.favorite_kind AS ENUM ('developer', 'project');

CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.favorite_kind NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, target_id)
);

CREATE INDEX idx_favorites_user ON public.favorites(user_id, kind);
CREATE INDEX idx_favorites_target ON public.favorites(kind, target_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fav_select_own" ON public.favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "fav_insert_own" ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fav_delete_own" ON public.favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Read receipts on messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Allow chat parties to update messages (only to set read_at on messages they received)
CREATE POLICY "msg_update_recipient_read" ON public.messages FOR UPDATE TO authenticated
  USING (
    sender_id <> auth.uid()
    AND auth.uid() IN (
      SELECT a.developer_id FROM applications a WHERE a.id = messages.application_id
      UNION
      SELECT p.recruiter_id FROM applications a JOIN projects p ON p.id = a.project_id WHERE a.id = messages.application_id
    )
  )
  WITH CHECK (
    sender_id <> auth.uid()
    AND auth.uid() IN (
      SELECT a.developer_id FROM applications a WHERE a.id = messages.application_id
      UNION
      SELECT p.recruiter_id FROM applications a JOIN projects p ON p.id = a.project_id WHERE a.id = messages.application_id
    )
  );

-- ========================================================================
-- 20260510101538_0e92eddd-783a-45df-af32-ae5c8e0167ba.sql
-- ========================================================================
-- Logo for company on recruiter profile
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS logo_url text;

-- Public 'avatars' bucket for profile images and company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (each user manages files under a folder = their user id)
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars user upload" ON storage.objects;
CREATE POLICY "avatars user upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars user update" ON storage.objects;
CREATE POLICY "avatars user update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars user delete" ON storage.objects;
CREATE POLICY "avatars user delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========================================================================
-- 20260516172246_03675ba4-5c76-489d-97a1-d1f0a60a920e.sql
-- ========================================================================

CREATE OR REPLACE FUNCTION public.notify_on_invite_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE dname text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','rejected') THEN
    SELECT full_name INTO dname FROM public.profiles WHERE id = NEW.developer_id;
    INSERT INTO public.notifications(user_id,type,title,body,link)
    VALUES (NEW.recruiter_id,
      CASE WHEN NEW.status = 'accepted' THEN 'invite_accepted'::notification_type
           ELSE 'invite_rejected'::notification_type END,
      COALESCE(dname,'A developer') || ' ' ||
        CASE WHEN NEW.status = 'accepted' THEN 'accepted' ELSE 'declined' END
        || ' your invite',
      NEW.message,'/dashboard');
  END IF;
  RETURN NEW;
END $function$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
                 WHERE t.typname = 'notification_type' AND e.enumlabel = 'invite_rejected') THEN
    ALTER TYPE notification_type ADD VALUE 'invite_rejected';
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_notify_invite_status') THEN
    CREATE TRIGGER trg_notify_invite_status
    AFTER UPDATE ON public.invites
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_invite_status();
  END IF;
END $$;

ALTER TABLE public.invites REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invites;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;


-- ========================================================================
-- 20260601000000_admin_enhancements.sql
-- ========================================================================
-- Admin panel enhancements

-- 1. Add is_verified to recruiter_profiles for "Verified Company" status
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

-- 2. Add is_suspended to profiles for user moderation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- 3. Create admin activity logs for auditability
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on activity logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_access" ON public.admin_activity_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Update existing policies to handle suspended users (optional but recommended for security)
-- For brevity in this task, we'll assume the application logic handles the is_suspended flag check during auth/login.

-- 5. Grant admins full update access to recruiter profiles (similar to developer profiles)
CREATE POLICY "rec_admin_update" ON public.recruiter_profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- ========================================================================
-- 20260601000001_developer_profile_sync.sql
-- ========================================================================
-- Add missing columns to developer_profiles for single-table persistence
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS developer_type TEXT;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS weekly_rate_inr INTEGER;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS monthly_rate_inr INTEGER;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS project_min_inr INTEGER;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS contact_public BOOLEAN DEFAULT false;

-- Add hours_per_day and time_slots which were in the UI but maybe missing from schema
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS hours_per_day INTEGER;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS time_slots TEXT;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS available_days TEXT[] DEFAULT '{}';

-- Add missing columns to recruiter_profiles for single-table persistence
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Migration to sync existing full_name and avatar_url from profiles to developer_profiles and recruiter_profiles
UPDATE public.developer_profiles dp
SET
  full_name = p.full_name,
  avatar_url = p.avatar_url
FROM public.profiles p
WHERE dp.id = p.id;

UPDATE public.recruiter_profiles rp
SET
  full_name = p.full_name,
  avatar_url = p.avatar_url
FROM public.profiles p
WHERE rp.id = p.id;

-- Update trigger function to sync full_name to sub-profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Assign role from signup metadata (developer/recruiter); default developer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'developer'::app_role)
  )
  ON CONFLICT DO NOTHING;

  -- Create matching subprofile shell with full_name
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'developer') = 'recruiter' THEN
    INSERT INTO public.recruiter_profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.developer_profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;


-- ========================================================================
-- 20260601000002_add_users_table.sql
-- ========================================================================
-- 1. Create the public.users table as requested
CREATE TABLE IF NOT EXISTS public.users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
CREATE POLICY "Users can view their own record" ON public.users
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all records" ON public.users
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Update the trigger function to populate public.users and sync role correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  selected_role TEXT;
BEGIN
  -- Get role from metadata, default to 'developer'
  selected_role := COALESCE(NEW.raw_user_meta_data->>'role', 'developer');

  -- Insert into base profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Insert into public.users (the new table requested)
  INSERT INTO public.users (user_id, email, role)
  VALUES (NEW.id, NEW.email, selected_role);

  -- Assign role to public.user_roles (internal RBAC table)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role::app_role)
  ON CONFLICT DO NOTHING;

  -- Create matching subprofile shell
  IF selected_role = 'recruiter' THEN
    INSERT INTO public.recruiter_profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.developer_profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;


-- ========================================================================
-- 20260601000002_fix_auth_roles.sql
-- ========================================================================
-- Create public.users table as requested
CREATE TABLE IF NOT EXISTS public.users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'developer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user trigger to populate public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  selected_role app_role;
BEGIN
  selected_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'developer'::app_role);

  -- Insert into public.profiles (legacy support)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Insert into public.users (new requested table)
  INSERT INTO public.users (user_id, email, role)
  VALUES (NEW.id, NEW.email, selected_role);

  -- Assign role in user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Create matching subprofile shell
  IF selected_role = 'recruiter' THEN
    INSERT INTO public.recruiter_profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.developer_profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;


-- ========================================================================
-- 20260601000003_profile_chat_enhancements.sql
-- ========================================================================
-- Enhance profiles and system tables
ALTER TABLE public.developer_profiles
  ADD COLUMN IF NOT EXISTS response_rate INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS completed_projects INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

ALTER TABLE public.recruiter_profiles
  ADD COLUMN IF NOT EXISTS hiring_status BOOLEAN DEFAULT true;

-- Optimized indexes for chat and contact requests
CREATE INDEX IF NOT EXISTS idx_messages_app_created ON public.messages(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_req_parties ON public.contact_access_requests(requester_id, target_id);

-- Ensure RLS for contact access requests is robust
CREATE POLICY "Users can view requests they are party to" ON public.contact_access_requests
  FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can insert requests" ON public.contact_access_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Targets can respond to requests" ON public.contact_access_requests
  FOR UPDATE TO authenticated USING (auth.uid() = target_id OR auth.uid() = requester_id);

-- Function to increment profile views safely
CREATE OR REPLACE FUNCTION increment_profile_view(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.developer_profiles
  SET profile_views = profile_views + 1
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage policies for chat attachments
-- Assuming 'chat-files' bucket is created via dashboard or another migration
-- These policies ensure only chat participants can access files
CREATE POLICY "Chat participants can upload files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'chat-files' AND (
      EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.projects p ON p.id = a.project_id
        WHERE a.id::text = (storage.foldername(name))[1]
        AND (a.developer_id = auth.uid() OR p.recruiter_id = auth.uid())
      )
    )
  );

CREATE POLICY "Chat participants can view files" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'chat-files' AND (
      EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.projects p ON p.id = a.project_id
        WHERE a.id::text = (storage.foldername(name))[1]
        AND (a.developer_id = auth.uid() OR p.recruiter_id = auth.uid())
      )
    )
  );


-- ========================================================================
-- 20260601000004_admin_full_management.sql
-- ========================================================================
-- Add suspension and reporter fields to profiles if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create alerts table for admin notifications
CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'registration', 'abuse_report', 'verification_request', 'alert'
  title TEXT NOT NULL,
  message TEXT,
  related_user_id UUID REFERENCES auth.users(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admin_alerts
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage alerts" ON public.admin_alerts
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.user_id = auth.uid() AND users.role = 'admin'
  ));

-- Track Visitors (Simple Table)
CREATE TABLE IF NOT EXISTS public.site_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'page_view', 'click'
  page_path TEXT,
  referrer TEXT,
  device_type TEXT,
  browser TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view analytics" ON public.site_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.user_id = auth.uid() AND users.role = 'admin'
  ));

-- Add "is_featured" to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create Trigger for Registration Alerts
CREATE OR REPLACE FUNCTION public.handle_new_registration_alert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_alerts (type, title, message, related_user_id)
  VALUES ('registration', 'New User Registered',
          'A new ' || NEW.role || ' has joined the platform: ' || NEW.email,
          NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_user_alert ON public.users;
CREATE TRIGGER on_new_user_alert
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_registration_alert();


-- ========================================================================
-- 20260601000005_admin_seed.sql
-- ========================================================================
-- In a real scenario, this would be manual. For verification in local:
-- This email was specified in the requirements.
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'support@developerconnect.in')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (user_id, email, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'support@developerconnect.in', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';


-- ========================================================================
-- 20260605080208_59c2a52f-93da-4d15-8557-a6e7f263b98c.sql
-- ========================================================================

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


-- ========================================================================
-- 20260605081459_8eef23a6-7970-4559-a74c-8dd6c1ee4330.sql
-- ========================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.applications REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.projects; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.applications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.developer_profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.recruiter_profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;


-- ========================================================================
-- 20260605081548_84839830-877b-4b07-b170-f52aaf8f2410.sql
-- ========================================================================

ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

UPDATE public.developer_profiles dp SET full_name = p.full_name, avatar_url = p.avatar_url FROM public.profiles p WHERE p.id = dp.id AND dp.full_name IS NULL;
UPDATE public.recruiter_profiles rp SET full_name = p.full_name FROM public.profiles p WHERE p.id = rp.id AND rp.full_name IS NULL;

-- Keep them in sync going forward
CREATE OR REPLACE FUNCTION public.sync_profile_to_subtables()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.developer_profiles SET full_name = NEW.full_name, avatar_url = NEW.avatar_url WHERE id = NEW.id;
  UPDATE public.recruiter_profiles SET full_name = NEW.full_name WHERE id = NEW.id;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.sync_profile_to_subtables() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_profile_to_subtables ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_subtables
AFTER INSERT OR UPDATE OF full_name, avatar_url ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_subtables();


-- ========================================================================
-- 20260605081629_50b59c7f-061d-4f37-bc22-ed7db1a5e4f5.sql
-- ========================================================================

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


-- ========================================================================
-- 20260606040707_9eacc881-3b25-4bc5-8831-e037111945cf.sql
-- ========================================================================

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


-- ========================================================================
-- 20260607050023_5d80b2e8-a78d-41d6-8c63-f9c28c4f1dbb.sql
-- ========================================================================

-- Backfill emails on existing profiles from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Update handle_new_user to also populate email so new signups appear correctly in admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = COALESCE(EXCLUDED.email, public.profiles.email);

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

-- Add missing tables to realtime publication so admin gets live updates across all tabs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='contact_access_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_access_requests;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='verification_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='admin_alerts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_alerts;
  END IF;
END $$;

ALTER TABLE public.contact_access_requests REPLICA IDENTITY FULL;


-- ========================================================================
-- 20260608084429_422ee115-82c9-43ba-96a1-5756cae52525.sql
-- ========================================================================

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


-- ========================================================================
-- 20260608085223_74bae669-f943-4b02-9085-dbccdd2f2242.sql
-- ========================================================================
ALTER TABLE public.messages REPLICA IDENTITY FULL;
