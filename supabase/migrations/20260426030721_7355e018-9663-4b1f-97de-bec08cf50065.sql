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