-- Create the profile_email_reminders table with tracking columns
CREATE TABLE IF NOT EXISTS public.profile_email_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_stage integer, -- 1, 3, 7, 15 (NULL for custom manual ones)
  reminder_type text NOT NULL DEFAULT 'automatic', -- 'automatic', 'manual'
  sent_by text NOT NULL DEFAULT 'system', -- 'system', or admin user's name/email
  email_status text NOT NULL, -- 'sent', 'failed', 'skipped_completed'
  sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profile_email_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_email_reminders
DROP POLICY IF EXISTS "Allow users to read their own reminder history" ON public.profile_email_reminders;
CREATE POLICY "Allow users to read their own reminder history"
  ON public.profile_email_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admins full access to reminder history" ON public.profile_email_reminders;
CREATE POLICY "Allow admins full access to reminder history"
  ON public.profile_email_reminders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Allow service_role full access" ON public.profile_email_reminders;
CREATE POLICY "Allow service_role full access"
  ON public.profile_email_reminders
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Drop old unique constraint if any
ALTER TABLE public.profile_email_reminders DROP CONSTRAINT IF EXISTS profile_email_reminders_user_stage_unique;

-- Create partial unique index to avoid duplicate automatic reminders for the same stage
CREATE UNIQUE INDEX IF NOT EXISTS profile_email_reminders_user_stage_auto_unique
  ON public.profile_email_reminders (user_id, reminder_stage)
  WHERE (reminder_type = 'automatic');

-- Add reminders_disabled column to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reminders_disabled boolean NOT NULL DEFAULT false;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unscheduling if already exists to ensure idempotency
SELECT cron.unschedule('daily-profile-reminder');

-- Schedule the profile-reminders edge function to run once daily at 09:00 UTC
SELECT cron.schedule(
  'daily-profile-reminder',
  '0 9 * * *', -- once every day at 09:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://vbysqbpoxgieuaohxqkb.supabase.co/functions/v1/profile-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer f6a2fe0a-3471-4eea-a581-75c4d2be396b"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
