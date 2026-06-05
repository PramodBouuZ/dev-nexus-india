
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.developer_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.recruiter_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

UPDATE public.developer_profiles dp SET full_name = p.full_name, avatar_url = p.avatar_url FROM public.profiles p WHERE p.id = dp.id AND dp.full_name IS NULL;
UPDATE public.recruiter_profiles rp SET full_name = p.full_name FROM public.profiles p WHERE p.id = rp.id AND rp.full_name IS NULL;

-- Keep them in sync going forward
CREATE OR REPLACE FUNCTION public.sync_profile_to_subtables()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.developer_profiles SET full_name = NEW.full_name, avatar_url = NEW.avatar_url WHERE id = NEW.id;
  UPDATE public.recruiter_profiles SET full_name = NEW.full_name WHERE id = NEW.id;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.sync_profile_to_subtables() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_profile_to_subtables ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_subtables
AFTER INSERT OR UPDATE OF full_name, avatar_url ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_subtables();
