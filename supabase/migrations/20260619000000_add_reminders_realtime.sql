-- Check if table is already in the publication and add it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'profile_email_reminders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_email_reminders;
  END IF;
END $$;
