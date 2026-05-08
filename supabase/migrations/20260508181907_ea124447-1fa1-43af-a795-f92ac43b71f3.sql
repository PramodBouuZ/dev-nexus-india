-- Favorites table (recruiters save developers, developers save projects)
CREATE TYPE public.favorite_kind AS ENUM ('developer', 'project');

CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.favorite_kind NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, target_id)
);

CREATE INDEX idx_favorites_user ON public.favorites(user_id, kind);
CREATE INDEX idx_favorites_target ON public.favorites(kind, target_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fav_select_own" ON public.favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "fav_insert_own" ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fav_delete_own" ON public.favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Read receipts on messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Allow chat parties to update messages (only to set read_at on messages they received)
CREATE POLICY "msg_update_recipient_read" ON public.messages FOR UPDATE TO authenticated
  USING (
    sender_id <> auth.uid()
    AND auth.uid() IN (
      SELECT a.developer_id FROM applications a WHERE a.id = messages.application_id
      UNION
      SELECT p.recruiter_id FROM applications a JOIN projects p ON p.id = a.project_id WHERE a.id = messages.application_id
    )
  )
  WITH CHECK (
    sender_id <> auth.uid()
    AND auth.uid() IN (
      SELECT a.developer_id FROM applications a WHERE a.id = messages.application_id
      UNION
      SELECT p.recruiter_id FROM applications a JOIN projects p ON p.id = a.project_id WHERE a.id = messages.application_id
    )
  );