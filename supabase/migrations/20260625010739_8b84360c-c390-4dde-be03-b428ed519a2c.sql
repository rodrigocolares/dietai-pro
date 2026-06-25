
-- 1. Tighten storage policies for diet-pdfs
DROP POLICY IF EXISTS "Diet PDFs - client read own" ON storage.objects;
DROP POLICY IF EXISTS "Diet PDFs - nutri/admin write" ON storage.objects;

-- INSERT: only nutricionista or admin (no client uploads)
CREATE POLICY "Diet PDFs - staff insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'diet-pdfs'
  AND (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
);

CREATE POLICY "Diet PDFs - staff update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'diet-pdfs'
  AND (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
);

CREATE POLICY "Diet PDFs - staff delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'diet-pdfs'
  AND (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
);

-- SELECT: clients can read own folder; staff can read only PDFs belonging to their organization
CREATE POLICY "Diet PDFs - read scoped"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'diet-pdfs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'super_admin')
    OR (
      (public.has_role(auth.uid(),'nutricionista') OR public.has_role(auth.uid(),'admin'))
      AND EXISTS (
        SELECT 1 FROM public.diets d
        WHERE d.pdf_url = storage.objects.name
          AND d.organization_id = public.get_user_organization_id(auth.uid())
      )
    )
  )
);

-- 2. Privilege escalation hardening on user_roles
CREATE POLICY "user_roles - super_admin insert"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "user_roles - super_admin update"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "user_roles - super_admin delete"
ON public.user_roles FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));

-- 3. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_usage(uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_bump_diet() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_bump_pdf() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_bump_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_bump_chat() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_org_limit(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_organization_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
