
CREATE OR REPLACE FUNCTION public.notify_on_invite_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE dname text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','rejected') THEN
    SELECT full_name INTO dname FROM public.profiles WHERE id = NEW.developer_id;
    INSERT INTO public.notifications(user_id,type,title,body,link)
    VALUES (NEW.recruiter_id,
      CASE WHEN NEW.status = 'accepted' THEN 'invite_accepted'::notification_type
           ELSE 'invite_rejected'::notification_type END,
      COALESCE(dname,'A developer') || ' ' ||
        CASE WHEN NEW.status = 'accepted' THEN 'accepted' ELSE 'declined' END
        || ' your invite',
      NEW.message,'/dashboard');
  END IF;
  RETURN NEW;
END $function$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
                 WHERE t.typname = 'notification_type' AND e.enumlabel = 'invite_rejected') THEN
    ALTER TYPE notification_type ADD VALUE 'invite_rejected';
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_notify_invite_status') THEN
    CREATE TRIGGER trg_notify_invite_status
    AFTER UPDATE ON public.invites
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_invite_status();
  END IF;
END $$;

ALTER TABLE public.invites REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invites;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
