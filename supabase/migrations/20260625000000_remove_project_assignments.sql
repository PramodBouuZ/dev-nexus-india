-- Migration to remove public.project_assignments and use projects table columns instead

-- 1. Clean up old triggers/triggers functions and project_assignments table if any exist
DROP TRIGGER IF EXISTS trg_notify_assignment ON public.project_assignments;
DROP TABLE IF EXISTS public.project_assignments CASCADE;

-- 2. Add columns to public.projects for assignment tracking
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_developer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- 3. Update project select RLS policy to use the new columns
DROP POLICY IF EXISTS "projects_select_v5" ON public.projects;
CREATE POLICY "projects_select_v5" ON public.projects FOR SELECT TO authenticated
  USING (
    status IN ('open', 'in_discussion')
    OR auth.uid() = recruiter_id
    OR assigned_developer_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Re-define trigger function for project assignment on public.projects
CREATE OR REPLACE FUNCTION public.notify_on_project_assignment()
RETURNS trigger AS $$
BEGIN
  IF NEW.assigned_developer_id IS NOT NULL AND OLD.assigned_developer_id IS NULL THEN
    -- Update status and timestamp
    NEW.status := 'assigned';
    NEW.assigned_at := now();

    -- Notify Developer
    INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
    VALUES (
      NEW.assigned_developer_id,
      NEW.recruiter_id,
      'project_assigned',
      'Project Assigned',
      'You have been assigned to: ' || COALESCE(NEW.title, 'a project'),
      '/projects/' || NEW.id,
      NEW.id
    );

    -- Notify Recruiter
    INSERT INTO public.notifications(user_id, actor_id, type, title, message, link, reference_id)
    VALUES (
      NEW.recruiter_id,
      NEW.assigned_developer_id,
      'developer_accepted_project',
      'Project Started',
      'Developer has started working on: ' || COALESCE(NEW.title, 'your project'),
      '/projects/' || NEW.id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create BEFORE UPDATE trigger on projects to handle notifications and automatic status update to 'assigned'
DROP TRIGGER IF EXISTS trg_notify_assignment ON public.projects;
CREATE TRIGGER trg_notify_assignment
  BEFORE UPDATE OF assigned_developer_id ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_project_assignment();

-- 5. Re-define trigger function for project completion to use assigned_developer_id
CREATE OR REPLACE FUNCTION public.notify_on_project_completion()
RETURNS trigger AS $$
DECLARE
  rec_id uuid;
  dev_id uuid;
  ptitle text;
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    SELECT recruiter_id, title INTO rec_id, ptitle FROM public.projects WHERE id = NEW.id;
    dev_id := NEW.assigned_developer_id;

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

DROP TRIGGER IF EXISTS trg_notify_completion ON public.projects;
CREATE TRIGGER trg_notify_completion AFTER UPDATE OF status ON public.projects
  FOR EACH ROW WHEN (NEW.status = 'completed') EXECUTE FUNCTION public.notify_on_project_completion();
