-- ============================================================================
-- Restore authenticated EXECUTE on has_role for RLS policy predicates.
--
-- 20260428143447 revoked EXECUTE from authenticated. That breaks authenticated
-- queries whose RLS policies call public.has_role(...), including user_roles
-- reads and supplier_access_requests inserts.
--
-- has_role remains SECURITY DEFINER and does not expose table rows directly; it
-- only returns a boolean for role membership. anon remains blocked.
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  FROM anon, public;

COMMENT ON FUNCTION public.has_role(uuid, public.app_role) IS
  'SECURITY DEFINER role predicate used by RLS policies. Executable by authenticated users; anon remains blocked.';

NOTIFY pgrst, 'reload schema';
