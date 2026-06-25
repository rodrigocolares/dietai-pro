
REVOKE EXECUTE ON FUNCTION public.check_org_limit(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_organization_id(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
