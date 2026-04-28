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