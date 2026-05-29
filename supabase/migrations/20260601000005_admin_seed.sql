-- In a real scenario, this would be manual. For verification in local:
-- This email was specified in the requirements.
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'info.bouuz@gmail.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (user_id, email, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'info.bouuz@gmail.com', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Also insert into user_roles to satisfy public.has_role() checks
INSERT INTO public.user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;
