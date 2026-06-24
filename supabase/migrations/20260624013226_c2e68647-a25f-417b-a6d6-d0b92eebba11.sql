
REVOKE EXECUTE ON FUNCTION public.get_user_organization_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bump_usage(uuid, text, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_bump_diet() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_bump_pdf() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_bump_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_bump_chat() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_org_limit(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_organization_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_org_limit(uuid, text) TO authenticated;
