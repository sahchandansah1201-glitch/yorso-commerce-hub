-- ============================================================================
-- Buyer-side RPC for creating supplier access requests.
--
-- Direct table inserts can fail after base-table privilege tightening because
-- PostgREST/RLS must validate supplier_id against public.suppliers. This RPC is
-- the intended narrow backend boundary: authenticated buyers can request access
-- to an existing public supplier without receiving broader base-table grants.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.request_supplier_access(
  p_supplier_id UUID,
  p_message TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  supplier_id UUID,
  status public.access_request_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_message TEXT := COALESCE(p_message, '');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '28000';
  END IF;

  IF NOT public.has_role(v_uid, 'buyer'::public.app_role) THEN
    RAISE EXCEPTION 'Buyer role required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.suppliers s
    WHERE s.id = p_supplier_id
  ) THEN
    RAISE EXCEPTION 'Supplier not found'
      USING ERRCODE = '02000';
  END IF;

  RETURN QUERY
  INSERT INTO public.supplier_access_requests (
    buyer_user_id,
    supplier_id,
    status,
    message
  )
  VALUES (
    v_uid,
    p_supplier_id,
    'sent'::public.access_request_status,
    v_message
  )
  ON CONFLICT (buyer_user_id, supplier_id) DO UPDATE
  SET updated_at = public.supplier_access_requests.updated_at
  RETURNING
    supplier_access_requests.id,
    supplier_access_requests.supplier_id,
    supplier_access_requests.status,
    supplier_access_requests.created_at,
    supplier_access_requests.updated_at,
    supplier_access_requests.decided_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_supplier_access(UUID, TEXT)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.request_supplier_access(UUID, TEXT)
  FROM anon, public;

COMMENT ON FUNCTION public.request_supplier_access(UUID, TEXT) IS
  'SECURITY DEFINER buyer RPC for one-click supplier access requests. Does not expose supplier base-table fields.';

NOTIFY pgrst, 'reload schema';
