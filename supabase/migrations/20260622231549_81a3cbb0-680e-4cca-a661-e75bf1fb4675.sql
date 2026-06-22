
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  diet_id uuid REFERENCES public.diets(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  template_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  channel text NOT NULL DEFAULT 'email',
  payload jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_logs_user_id_idx ON public.email_logs(user_id);
CREATE INDEX email_logs_diet_id_idx ON public.email_logs(diet_id);
CREATE INDEX email_logs_created_at_idx ON public.email_logs(created_at DESC);

GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients see own email logs" ON public.email_logs FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'nutricionista')
    OR public.has_role(auth.uid(), 'admin')
  );
