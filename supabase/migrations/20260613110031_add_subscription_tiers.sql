-- Add subscription_tier to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';

-- Function to count projects created by a recruiter in the current calendar month
CREATE OR REPLACE FUNCTION public.count_monthly_projects(_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.projects
  WHERE recruiter_id = _user_id
    AND created_at >= date_trunc('month', now())
    AND created_at < (date_trunc('month', now()) + interval '1 month');
$$;

-- Enforce project limit for free recruiters via Trigger
CREATE OR REPLACE FUNCTION public.check_project_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tier TEXT;
  project_count INTEGER;
BEGIN
  SELECT subscription_tier INTO tier FROM public.users WHERE user_id = NEW.recruiter_id;

  IF tier = 'free' THEN
    project_count := public.count_monthly_projects(NEW.recruiter_id);
    IF project_count >= 10 THEN
      RAISE EXCEPTION 'Monthly project limit reached for free plan. Please upgrade to Recruiter Pro.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_project_limit ON public.projects;
CREATE TRIGGER trg_check_project_limit
BEFORE INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.check_project_limit();
