-- Add review categories to reviews table
ALTER TABLE public.reviews
ADD COLUMN communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
ADD COLUMN payment_timeliness_rating INTEGER CHECK (payment_timeliness_rating BETWEEN 1 AND 5), -- for recruiter
ADD COLUMN requirement_clarity_rating INTEGER CHECK (requirement_clarity_rating BETWEEN 1 AND 5), -- for recruiter
ADD COLUMN professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5), -- for recruiter
ADD COLUMN technical_skills_rating INTEGER CHECK (technical_skills_rating BETWEEN 1 AND 5), -- for developer
ADD COLUMN delivery_quality_rating INTEGER CHECK (delivery_quality_rating BETWEEN 1 AND 5), -- for developer
ADD COLUMN timeline_adherence_rating INTEGER CHECK (timeline_adherence_rating BETWEEN 1 AND 5); -- for developer

-- Add whatsapp and telegram to phones tables
ALTER TABLE public.developer_phones
ADD COLUMN whatsapp text,
ADD COLUMN telegram text;

ALTER TABLE public.recruiter_phones
ADD COLUMN whatsapp text,
ADD COLUMN telegram text;

-- Add project stats and extra info to developer_profiles
ALTER TABLE public.developer_profiles
ADD COLUMN active_projects INTEGER DEFAULT 0,
ADD COLUMN total_applications INTEGER DEFAULT 0,
ADD COLUMN total_invitations_received INTEGER DEFAULT 0,
ADD COLUMN certifications JSONB DEFAULT '[]',
ADD COLUMN education JSONB DEFAULT '[]',
ADD COLUMN languages JSONB DEFAULT '[]',
ADD COLUMN portfolio_screenshots TEXT[] DEFAULT '{}';

-- Add project stats to recruiter_profiles
ALTER TABLE public.recruiter_profiles
ADD COLUMN projects_posted INTEGER DEFAULT 0,
ADD COLUMN developers_hired INTEGER DEFAULT 0;

-- Function to check if a review is mandatory (project completed but no review yet)
CREATE OR REPLACE FUNCTION public.needs_review(user_id UUID)
RETURNS TABLE(contract_id UUID, project_id UUID, other_party_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT c.id, c.project_id,
    CASE WHEN c.developer_id = user_id THEN c.recruiter_id ELSE c.developer_id END
  FROM public.contracts c
  JOIN public.projects p ON c.project_id = p.id
  WHERE (c.developer_id = user_id OR c.recruiter_id = user_id)
    AND p.status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.contract_id = c.id AND r.reviewer_id = user_id
    );
$$;

-- Grant execute on needs_review to authenticated users
GRANT EXECUTE ON FUNCTION public.needs_review(UUID) TO authenticated;
