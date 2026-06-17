-- Migration to fix contact_access_requests RLS policies
-- Dropping duplicate and potentially broken policies that might have used old column names

-- Drop old/incorrect policies if they exist
DROP POLICY IF EXISTS car_select_parties ON public.contact_access_requests;
DROP POLICY IF EXISTS car_insert_requester ON public.contact_access_requests;
DROP POLICY IF EXISTS car_update_target ON public.contact_access_requests;
DROP POLICY IF EXISTS "Users can view requests they are party to" ON public.contact_access_requests;
DROP POLICY IF EXISTS "Users can insert requests" ON public.contact_access_requests;
DROP POLICY IF EXISTS "Targets can respond to requests" ON public.contact_access_requests;

-- Create robust RLS policies using requester_id and target_id
-- SELECT: Parties involved or admin
CREATE POLICY "car_select_parties" ON public.contact_access_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = target_id OR public.has_role(auth.uid(), 'admin'));

-- INSERT: Only requester can insert, and requester_id must match auth.uid()
CREATE POLICY "car_insert_requester" ON public.contact_access_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- UPDATE: Only target can respond/update status
CREATE POLICY "car_update_target" ON public.contact_access_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = target_id)
  WITH CHECK (auth.uid() = target_id);

-- DELETE: Only requester can revoke (if still pending) or admin
CREATE POLICY "car_delete_requester" ON public.contact_access_requests
  FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR public.has_role(auth.uid(), 'admin'));
