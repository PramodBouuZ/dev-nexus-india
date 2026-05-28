-- Add suspension and reporter fields to profiles if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create alerts table for admin notifications
CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'registration', 'abuse_report', 'verification_request', 'alert'
  title TEXT NOT NULL,
  message TEXT,
  related_user_id UUID REFERENCES auth.users(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admin_alerts
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage alerts" ON public.admin_alerts
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.user_id = auth.uid() AND users.role = 'admin'
  ));

-- Track Visitors (Simple Table)
CREATE TABLE IF NOT EXISTS public.site_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'page_view', 'click'
  page_path TEXT,
  referrer TEXT,
  device_type TEXT,
  browser TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view analytics" ON public.site_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.user_id = auth.uid() AND users.role = 'admin'
  ));

-- Add "is_featured" to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create Trigger for Registration Alerts
CREATE OR REPLACE FUNCTION public.handle_new_registration_alert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_alerts (type, title, message, related_user_id)
  VALUES ('registration', 'New User Registered',
          'A new ' || NEW.role || ' has joined the platform: ' || NEW.email,
          NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_user_alert ON public.users;
CREATE TRIGGER on_new_user_alert
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_registration_alert();
