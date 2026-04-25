
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'developer', 'recruiter');
CREATE TYPE public.project_type AS ENUM ('fixed', 'hourly');
CREATE TYPE public.project_status AS ENUM ('open', 'in_progress', 'completed', 'closed');
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE public.contract_status AS ENUM ('active', 'completed', 'cancelled');

-- PROFILES (one per auth user)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES (separate table to avoid privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- DEVELOPER PROFILES
CREATE TABLE public.developer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  hourly_rate_inr INTEGER,
  availability_hours_per_week INTEGER,
  experience_years INTEGER,
  github_url TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  location TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;

-- RECRUITER PROFILES
CREATE TABLE public.recruiter_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_website TEXT,
  company_description TEXT,
  company_size TEXT,
  industry TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recruiter_profiles ENABLE ROW LEVEL SECURITY;

-- PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tech_stack TEXT[] DEFAULT '{}',
  project_type project_type NOT NULL DEFAULT 'fixed',
  budget_min_inr INTEGER,
  budget_max_inr INTEGER,
  hours_per_week INTEGER,
  duration_weeks INTEGER,
  status project_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- APPLICATIONS
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_message TEXT,
  proposed_rate_inr INTEGER,
  status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, developer_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- CONTRACTS
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreed_rate_inr INTEGER,
  status contract_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- MESSAGES (per application thread)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contract_id, reviewer_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_dev_touch BEFORE UPDATE ON public.developer_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_rec_touch BEFORE UPDATE ON public.recruiter_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_proj_touch BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_app_touch BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Assign role from signup metadata (developer/recruiter); default developer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'developer'::app_role)
  )
  ON CONFLICT DO NOTHING;

  -- Create matching subprofile shell
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'developer') = 'recruiter' THEN
    INSERT INTO public.recruiter_profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.developer_profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== RLS POLICIES ===========

-- profiles: anyone authenticated can read; user can update own
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles: user can read own; admin can read all
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- developer_profiles: public read, owner write, admin verify
CREATE POLICY "dev_select_all" ON public.developer_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "dev_update_own" ON public.developer_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "dev_insert_own" ON public.developer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "dev_admin_update" ON public.developer_profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- recruiter_profiles
CREATE POLICY "rec_select_all" ON public.recruiter_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "rec_update_own" ON public.recruiter_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "rec_insert_own" ON public.recruiter_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- projects: anyone authenticated can read open projects, recruiter manages own
CREATE POLICY "projects_select_all" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert_recruiter" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = recruiter_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = recruiter_id);

-- applications: developer creates; both parties can read; recruiter & developer can update status
CREATE POLICY "apps_select_parties" ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = developer_id OR auth.uid() IN (SELECT recruiter_id FROM public.projects WHERE id = project_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "apps_insert_dev" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = developer_id AND public.has_role(auth.uid(), 'developer'));
CREATE POLICY "apps_update_parties" ON public.applications FOR UPDATE TO authenticated
  USING (auth.uid() = developer_id OR auth.uid() IN (SELECT recruiter_id FROM public.projects WHERE id = project_id));

-- contracts: parties can read; recruiter creates
CREATE POLICY "contracts_select_parties" ON public.contracts FOR SELECT TO authenticated
  USING (auth.uid() = developer_id OR auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "contracts_insert_recruiter" ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "contracts_update_parties" ON public.contracts FOR UPDATE TO authenticated
  USING (auth.uid() = developer_id OR auth.uid() = recruiter_id);

-- messages: only application parties can read/insert
CREATE POLICY "msg_select_parties" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() IN (
    SELECT a.developer_id FROM public.applications a WHERE a.id = application_id
    UNION
    SELECT p.recruiter_id FROM public.applications a JOIN public.projects p ON p.id = a.project_id WHERE a.id = application_id
  ));
CREATE POLICY "msg_insert_parties" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND auth.uid() IN (
    SELECT a.developer_id FROM public.applications a WHERE a.id = application_id
    UNION
    SELECT p.recruiter_id FROM public.applications a JOIN public.projects p ON p.id = a.project_id WHERE a.id = application_id
  ));

-- reviews
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews_insert_party" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND auth.uid() IN (
    SELECT developer_id FROM public.contracts WHERE id = contract_id
    UNION
    SELECT recruiter_id FROM public.contracts WHERE id = contract_id
  ));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
