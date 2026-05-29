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
