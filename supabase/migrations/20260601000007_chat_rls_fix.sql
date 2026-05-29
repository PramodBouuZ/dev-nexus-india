-- Update messages RLS to allow admins to see everything
DROP POLICY IF EXISTS "msg_select_parties" ON public.messages;
CREATE POLICY "msg_select_parties" ON public.messages FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT a.developer_id FROM public.applications a WHERE a.id = application_id
      UNION
      SELECT p.recruiter_id FROM public.applications a JOIN public.projects p ON p.id = a.project_id WHERE a.id = application_id
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Fix insert policy just in case
DROP POLICY IF EXISTS "msg_insert_parties" ON public.messages;
CREATE POLICY "msg_insert_parties" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND (
      auth.uid() IN (
        SELECT a.developer_id FROM public.applications a WHERE a.id = application_id
        UNION
        SELECT p.recruiter_id FROM public.applications a JOIN public.projects p ON p.id = a.project_id WHERE a.id = application_id
      )
    )
  );

-- Ensure the chat-files storage bucket exists and has correct policies
-- We'll just define the policies here to be safe
CREATE POLICY "Admins can view all chat files" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'chat-files' AND public.has_role(auth.uid(), 'admin')
  );
