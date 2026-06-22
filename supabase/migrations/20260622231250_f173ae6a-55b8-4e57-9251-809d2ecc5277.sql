
CREATE POLICY "Diet PDFs - client read own" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'diet-pdfs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'nutricionista')
    OR public.has_role(auth.uid(),'admin')
  )
);
CREATE POLICY "Diet PDFs - nutri/admin write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'diet-pdfs' AND (
    public.has_role(auth.uid(),'nutricionista')
    OR public.has_role(auth.uid(),'admin')
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);
