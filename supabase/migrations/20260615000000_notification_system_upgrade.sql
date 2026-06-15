-- Migration to fix and standardize the Notification system and Dashboard visibility

-- 1. Standardize Notifications Table
DO $$
BEGIN
  -- Rename body to message for consistency if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='body') THEN
    ALTER TABLE public.notifications RENAME COLUMN body TO message;
  END IF;

  -- Add actor_id and reference_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='actor_id') THEN
    ALTER TABLE public.notifications ADD COLUMN actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='reference_id') THEN
    ALTER TABLE public.notifications ADD COLUMN reference_id UUID;
  END IF;

  -- Add is_read boolean and sync with read_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='is_read') THEN
    ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;
    UPDATE public.notifications SET is_read = true WHERE read_at IS NOT NULL;
  END IF;
END $$;

-- 2. Update Notification Trigger Functions

-- Application Created -> Notify Recruiter
CREATE OR REPLACE FUNCTION public.notify_on_application_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  rec_id uuid;
  ptitle text;
  dname text;
BEGIN
  SELECT recruiter_id, title INTO rec_id, ptitle FROM public.projects WHERE id = NEW.project_id;
  SELECT full_name INTO dname FROM public.profiles WHERE id = NEW.developer_id;

  IF rec_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
    VALUES (
      rec_id,
      NEW.developer_id,
      'new_application',
      'New Application',
      COALESCE(dname,'A developer') || ' applied to "' || COALESCE(ptitle,'your project') || '"',
      '/applications/' || NEW.id::text,
      NEW.id
    );
  END IF;
  RETURN NEW;
END $$;

-- Application Status Updated -> Notify Developer
CREATE OR REPLACE FUNCTION public.notify_on_application_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  ptitle text;
  rec_id uuid;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT p.title, p.recruiter_id INTO ptitle, rec_id FROM public.projects p WHERE p.id = NEW.project_id;

    INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
    VALUES (
      NEW.developer_id,
      rec_id,
      CASE NEW.status
        WHEN 'accepted' THEN 'application_accepted'::notification_type
        WHEN 'rejected' THEN 'application_rejected'::notification_type
        ELSE 'project_update'::notification_type
      END,
      'Application ' || initcap(NEW.status::text),
      'Your application for "' || COALESCE(ptitle,'the project') || '" was ' || NEW.status::text,
      '/applications/' || NEW.id::text,
      NEW.id
    );
  END IF;
  RETURN NEW;
END $$;

-- Invite Created -> Notify Developer
CREATE OR REPLACE FUNCTION public.notify_on_invite_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  rname text;
BEGIN
  SELECT full_name INTO rname FROM public.profiles WHERE id = NEW.recruiter_id;

  INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
  VALUES (
    NEW.developer_id,
    NEW.recruiter_id,
    'recruiter_invite',
    'New Project Invite',
    COALESCE(rname,'A recruiter') || ' sent you an invite: ' || COALESCE(NEW.message, ''),
    '/dashboard',
    NEW.id
  );
  RETURN NEW;
END $$;

-- Invite Status Updated -> Notify Recruiter
CREATE OR REPLACE FUNCTION public.notify_on_invite_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  dname text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','rejected') THEN
    SELECT full_name INTO dname FROM public.profiles WHERE id = NEW.developer_id;

    INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
    VALUES (
      NEW.recruiter_id,
      NEW.developer_id,
      CASE WHEN NEW.status = 'accepted' THEN 'invite_accepted'::notification_type ELSE 'invite_rejected'::notification_type END,
      'Invite ' || initcap(NEW.status::text),
      COALESCE(dname,'A developer') || ' ' || NEW.status::text || ' your invite.',
      '/dashboard',
      NEW.id
    );
  END IF;
  RETURN NEW;
END $$;

-- Contact Request Created -> Notify Target
CREATE OR REPLACE FUNCTION public.notify_on_contact_request_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  rname text;
BEGIN
  SELECT full_name INTO rname FROM public.profiles WHERE id = NEW.requester_id;

  INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
  VALUES (
    NEW.target_id,
    NEW.requester_id,
    'contact_request',
    'Contact Request',
    COALESCE(rname,'Someone') || ' requested your contact details.',
    '/dashboard',
    NEW.id
  );
  RETURN NEW;
END $$;

-- Contact Request Status Updated -> Notify Requester
CREATE OR REPLACE FUNCTION public.notify_on_contact_request_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  tname text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT full_name INTO tname FROM public.profiles WHERE id = NEW.target_id;

    INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
    VALUES (
      NEW.requester_id,
      NEW.target_id,
      CASE NEW.status WHEN 'approved' THEN 'contact_approved'::notification_type ELSE 'contact_rejected'::notification_type END,
      'Contact Request ' || initcap(NEW.status::text),
      COALESCE(tname, 'The user') || ' ' || NEW.status::text || ' your contact request.',
      '/dashboard',
      NEW.id
    );
  END IF;
  RETURN NEW;
END $$;

-- Project Assignment -> Notify Parties (Updating the one from 20260610000000_workflow_upgrade.sql)
CREATE OR REPLACE FUNCTION public.notify_on_project_assignment()
RETURNS trigger AS $$
DECLARE
  ptitle text;
BEGIN
  SELECT title INTO ptitle FROM public.projects WHERE id = NEW.project_id;

  -- Notify Developer
  INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
  VALUES (
    NEW.developer_id,
    NEW.recruiter_id,
    'project_assigned',
    'Project Assigned',
    'You have been assigned to: ' || COALESCE(ptitle, 'a project'),
    '/projects/' || NEW.project_id,
    NEW.id
  );

  -- Notify Recruiter
  INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
  VALUES (
    NEW.recruiter_id,
    NEW.developer_id,
    'developer_accepted_project',
    'Project Started',
    'Developer has started working on: ' || COALESCE(ptitle, 'your project'),
    '/projects/' || NEW.project_id,
    NEW.id
  );

  -- Update project status to assigned
  UPDATE public.projects SET status = 'assigned' WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Project Completed -> Notify Parties
CREATE OR REPLACE FUNCTION public.notify_on_project_completion()
RETURNS trigger AS $$
DECLARE
  rec_id uuid;
  dev_id uuid;
  ptitle text;
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    SELECT recruiter_id, title INTO rec_id, ptitle FROM public.projects WHERE id = NEW.id;
    SELECT developer_id INTO dev_id FROM public.project_assignments WHERE project_id = NEW.id LIMIT 1;

    -- Notify Developer
    IF dev_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
      VALUES (dev_id, rec_id, 'project_update', 'Project Completed', 'The project "' || COALESCE(ptitle, 'Project') || '" has been marked as completed.', '/projects/' || NEW.id, NEW.id);
    END IF;

    -- Notify Recruiter
    INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
    VALUES (rec_id, dev_id, 'project_update', 'Project Completed', 'The project "' || COALESCE(ptitle, 'Project') || '" has been successfully completed.', '/projects/' || NEW.id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Message -> Notify Recipient (Updating the one from 20260610000000_workflow_upgrade.sql)
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger AS $$
DECLARE
  target_id uuid;
  sender_name text;
BEGIN
  -- Determine target_id from conversation or application
  IF NEW.conversation_id IS NOT NULL THEN
    SELECT CASE WHEN participant_1_id = NEW.sender_id THEN participant_2_id ELSE participant_1_id END
    INTO target_id FROM public.conversations WHERE id = NEW.conversation_id;
  ELSIF NEW.application_id IS NOT NULL THEN
    SELECT CASE WHEN developer_id = NEW.sender_id THEN p.recruiter_id ELSE developer_id END
    INTO target_id
    FROM public.applications a JOIN public.projects p ON a.project_id = p.id
    WHERE a.id = NEW.application_id;
  END IF;

  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

  IF target_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
    VALUES (
      target_id,
      NEW.sender_id,
      'new_message',
      'New Message from ' || COALESCE(sender_name, 'User'),
      COALESCE(SUBSTRING(NEW.body FROM 1 FOR 50), 'Sent an attachment'),
      CASE WHEN NEW.application_id IS NOT NULL THEN '/applications/' || NEW.application_id ELSE '/dashboard' END,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure RLS Policies for Notifications are correct
DROP POLICY IF EXISTS notif_select_own ON public.notifications;
CREATE POLICY notif_select_own ON public.notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS notif_update_own ON public.notifications;
CREATE POLICY notif_update_own ON public.notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Re-attach Triggers (making sure they use the updated functions)
DROP TRIGGER IF EXISTS trg_notify_on_application ON public.applications;
CREATE TRIGGER trg_notify_on_application AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_insert();

DROP TRIGGER IF EXISTS trg_notify_on_app_status ON public.applications;
CREATE TRIGGER trg_notify_on_app_status AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_status();

DROP TRIGGER IF EXISTS trg_notify_on_invite ON public.invites;
CREATE TRIGGER trg_notify_on_invite AFTER INSERT ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_invite_insert();

DROP TRIGGER IF EXISTS trg_notify_invite_status ON public.invites;
CREATE TRIGGER trg_notify_invite_status AFTER UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_invite_status();

DROP TRIGGER IF EXISTS trg_notify_on_car_insert ON public.contact_access_requests;
CREATE TRIGGER trg_notify_on_car_insert AFTER INSERT ON public.contact_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_contact_request_insert();

DROP TRIGGER IF EXISTS trg_notify_on_car_status ON public.contact_access_requests;
CREATE TRIGGER trg_notify_on_car_status AFTER UPDATE ON public.contact_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_contact_request_status();

DROP TRIGGER IF EXISTS trg_notify_assignment ON public.project_assignments;
CREATE TRIGGER trg_notify_assignment AFTER INSERT ON public.project_assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_project_assignment();

DROP TRIGGER IF EXISTS trg_notify_message ON public.messages;
CREATE TRIGGER trg_notify_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

DROP TRIGGER IF EXISTS trg_notify_completion ON public.projects;
CREATE TRIGGER trg_notify_completion AFTER UPDATE OF status ON public.projects
  FOR EACH ROW WHEN (NEW.status = 'completed') EXECUTE FUNCTION public.notify_on_project_completion();
