
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
