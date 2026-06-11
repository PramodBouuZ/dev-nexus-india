-- DeveloperConnect Platform Workflow Upgrade Migration

-- 1. Enums updates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'project_status' AND e.enumlabel = 'assigned') THEN
    ALTER TYPE public.project_status ADD VALUE 'assigned';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'project_status' AND e.enumlabel = 'in_discussion') THEN
    ALTER TYPE public.project_status ADD VALUE 'in_discussion';
  END IF;
END $$;

DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'project_assigned';
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_message';
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'developer_accepted_project';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (LEAST(participant_1_id, participant_2_id), GREATEST(participant_1_id, participant_2_id)),
  CONSTRAINT different_participants CHECK (participant_1_id <> participant_2_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conv_select_participants ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY conv_insert_participants ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Update messages to support conversations
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ALTER COLUMN application_id DROP NOT NULL;

-- 3. Project Assignments
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  developer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  UNIQUE (project_id)
);

ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY pa_select_parties ON public.project_assignments
  FOR SELECT TO authenticated
  USING (auth.uid() = recruiter_id OR auth.uid() = developer_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY pa_insert_recruiter ON public.project_assignments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));

-- 4. Application and Invite Limits
CREATE OR REPLACE FUNCTION public.check_application_limit()
RETURNS trigger AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM public.applications
    WHERE developer_id = NEW.developer_id
      AND status IN ('pending', 'accepted', 'shortlisted')
  ) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 active project applications allowed at a time.';
  END IF;

  IF (SELECT status FROM public.projects WHERE id = NEW.project_id) NOT IN ('open', 'in_discussion') THEN
    RAISE EXCEPTION 'This project is no longer accepting applications.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_app_limit ON public.applications;
CREATE TRIGGER trg_check_app_limit
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.check_application_limit();

CREATE OR REPLACE FUNCTION public.check_invite_limit()
RETURNS trigger AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM public.invites
    WHERE recruiter_id = NEW.recruiter_id
      AND status = 'pending'
  ) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 active invites allowed at a time.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_invite_limit ON public.invites;
CREATE TRIGGER trg_check_invite_limit
  BEFORE INSERT ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.check_invite_limit();

-- 5. Contact Access Request updates
ALTER TABLE public.contact_access_requests ADD COLUMN IF NOT EXISTS request_type text;

-- Helper: do these two users have approved contact access?
CREATE OR REPLACE FUNCTION public.has_contact_access(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contact_access_requests
    WHERE status = 'approved'
      AND ((requester_id=_a AND target_id=_b) OR (requester_id=_b AND target_id=_a))
  )
$$;

-- 6. Updated RLS for projects (Assignment visibility)
DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
DROP POLICY IF EXISTS "projects_select_v2" ON public.projects;
DROP POLICY IF EXISTS "projects_select_v3" ON public.projects;
DROP POLICY IF EXISTS "projects_select_v4" ON public.projects;
CREATE POLICY "projects_select_v5" ON public.projects FOR SELECT TO authenticated
  USING (
    status IN ('open', 'in_discussion')
    OR auth.uid() = recruiter_id
    OR EXISTS (SELECT 1 FROM public.project_assignments pa WHERE pa.project_id = public.projects.id AND pa.developer_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 7. Trigger for project assignment notification
CREATE OR REPLACE FUNCTION public.notify_on_project_assignment()
RETURNS trigger AS $$
DECLARE ptitle text;
BEGIN
  SELECT title INTO ptitle FROM public.projects WHERE id = NEW.project_id;

  -- Notify Developer
  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (NEW.developer_id, 'project_assigned', 'Project Assigned', 'You have been assigned to: ' || COALESCE(ptitle, 'a project'), '/projects/' || NEW.project_id);

  -- Notify Recruiter (Developer Accepted Project logic)
  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (NEW.recruiter_id, 'developer_accepted_project', 'Project Started', 'Developer has been assigned to ' || COALESCE(ptitle, 'your project'), '/projects/' || NEW.project_id);

  -- Update project status to assigned
  UPDATE public.projects SET status = 'assigned' WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_assignment ON public.project_assignments;
CREATE TRIGGER trg_notify_assignment
  AFTER INSERT ON public.project_assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_project_assignment();

-- 8. Notification on new message
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger AS $$
DECLARE
  target_id uuid;
  ptitle text;
BEGIN
  -- Determine target_id from conversation or application
  IF NEW.conversation_id IS NOT NULL THEN
    SELECT CASE WHEN participant_1_id = NEW.sender_id THEN participant_2_id ELSE participant_1_id END
    INTO target_id FROM public.conversations WHERE id = NEW.conversation_id;
  ELSIF NEW.application_id IS NOT NULL THEN
    SELECT CASE WHEN developer_id = NEW.sender_id THEN p.recruiter_id ELSE developer_id END, p.title
    INTO target_id, ptitle
    FROM public.applications a JOIN public.projects p ON a.project_id = p.id
    WHERE a.id = NEW.application_id;
  END IF;

  IF target_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
    VALUES (target_id, 'new_message', 'New Message',
      COALESCE(SUBSTRING(NEW.body FROM 1 FOR 50), 'Sent an attachment'),
      CASE WHEN NEW.application_id IS NOT NULL THEN '/applications/' || NEW.application_id ELSE '/dashboard' END);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_message ON public.messages;
CREATE TRIGGER trg_notify_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- 9. Automatic archive for completed projects
CREATE OR REPLACE FUNCTION public.archive_completed_project()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    -- Archive logic: already filtered in project listing policy
    INSERT INTO public.admin_activity_logs (admin_id, action, target_id, details)
    VALUES (auth.uid(), 'project_archived', NEW.id, jsonb_build_object('status', 'completed'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_archive_project ON public.projects;
CREATE TRIGGER trg_archive_project
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.archive_completed_project();

-- 10. Realtime configuration
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.project_assignments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
