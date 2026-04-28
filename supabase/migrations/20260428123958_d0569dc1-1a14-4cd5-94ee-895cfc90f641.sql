REVOKE EXECUTE ON FUNCTION public.notify_on_application_insert() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_application_status() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_invite_insert() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_invite_status() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_contact_request_insert() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_contact_request_status() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_signup() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_contact_access(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_contact_access(uuid, uuid) TO authenticated;