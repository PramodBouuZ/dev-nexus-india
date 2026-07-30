-- Create the profile_email_reminders table
CREATE TABLE IF NOT EXISTS public.profile_email_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_stage integer NOT NULL, -- 1, 3, 7, 15
  sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  email_status text NOT NULL, -- 'sent', 'failed', 'skipped_completed'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT profile_email_reminders_user_stage_unique UNIQUE (user_id, reminder_stage)
);

-- Enable RLS
ALTER TABLE public.profile_email_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_email_reminders
CREATE POLICY "Allow users to read their own reminder history"
  ON public.profile_email_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow service_role full access"
  ON public.profile_email_reminders
  TO service_role
  USING (true)
  WITH CHECK (true);

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
