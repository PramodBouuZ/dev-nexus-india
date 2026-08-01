-- Database Migration: NDA management customizations, system chat messages, and smart notification preferences

-- 1. Alter public.ndas status to TEXT to easily support multiple workflow states
DO $$
BEGIN
  -- Check if column is of type enum and alter to text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ndas'
      AND column_name = 'status'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.ndas ALTER COLUMN status TYPE TEXT USING status::text;
  END IF;
END $$;

-- 2. Add extra custom NDA template, versioning, and view status columns
ALTER TABLE public.ndas ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.ndas ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
ALTER TABLE public.ndas ADD COLUMN IF NOT EXISTS file_version TEXT DEFAULT '1.0';
ALTER TABLE public.ndas ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;

-- 3. Extend messages table to support inline System and NDA events
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS system_event_type TEXT;

-- 4. Create public.notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_new_projects BOOLEAN NOT NULL DEFAULT true,
  email_invites BOOLEAN NOT NULL DEFAULT true,
  email_chat BOOLEAN NOT NULL DEFAULT true,
  email_nda BOOLEAN NOT NULL DEFAULT true,
  email_milestones BOOLEAN NOT NULL DEFAULT true,
  email_reviews BOOLEAN NOT NULL DEFAULT true,
  in_app_new_projects BOOLEAN NOT NULL DEFAULT true,
  in_app_invites BOOLEAN NOT NULL DEFAULT true,
  in_app_chat BOOLEAN NOT NULL DEFAULT true,
  in_app_nda BOOLEAN NOT NULL DEFAULT true,
  in_app_milestones BOOLEAN NOT NULL DEFAULT true,
  in_app_reviews BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS np_select_own ON public.notification_preferences;
CREATE POLICY np_select_own ON public.notification_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS np_insert_own ON public.notification_preferences;
CREATE POLICY np_insert_own ON public.notification_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS np_update_own ON public.notification_preferences;
CREATE POLICY np_update_own ON public.notification_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS np_admin_all ON public.notification_preferences;
CREATE POLICY np_admin_all ON public.notification_preferences FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to touch updated_at
DROP TRIGGER IF EXISTS trg_np_touch ON public.notification_preferences;
CREATE TRIGGER trg_np_touch BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create default preferences upon user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_preferences()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_profile_created_create_np ON public.profiles;
CREATE TRIGGER on_profile_created_create_np
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notification_preferences();

-- Backfill preferences for existing profiles
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT DO NOTHING;

-- 5. Add new tables/publications to realtime if needed
-- Note: supabase_realtime publication setup is often predefined. Let's make sure messages and ndas are published.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ndas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ndas;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notification_preferences'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_preferences;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Suppress errors in environments without active realtime pub setup
  NULL;
END $$;
