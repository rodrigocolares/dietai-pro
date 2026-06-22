
CREATE TABLE public.pdf_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_id uuid NOT NULL REFERENCES public.diets(id) ON DELETE CASCADE,
  generated_by uuid NOT NULL,
  client_id uuid NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pdf_logs TO authenticated;
GRANT ALL ON public.pdf_logs TO service_role;
ALTER TABLE public.pdf_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client sees own pdf logs" ON public.pdf_logs FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Nutri/admin insert pdf logs" ON public.pdf_logs FOR INSERT TO authenticated
  WITH CHECK (generated_by = auth.uid());
