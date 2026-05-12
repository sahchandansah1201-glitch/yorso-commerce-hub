-- ============================================================================
-- Fix request_supplier_access PL/pgSQL ambiguity.
--
-- The previous function returned a TABLE with an output column named
-- supplier_id. In PL/pgSQL, output columns are variables, so unqualified
-- conflict targets can become ambiguous. This version uses explicit aliases
-- and ON CONSTRAINT.
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
    FROM public.suppliers AS s
    WHERE s.id = p_supplier_id
  ) THEN
    RAISE EXCEPTION 'Supplier not found'
      USING ERRCODE = '02000';
  END IF;

  RETURN QUERY
  WITH upserted AS (
    INSERT INTO public.supplier_access_requests AS sar (
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
    ON CONFLICT ON CONSTRAINT supplier_access_requests_buyer_user_id_supplier_id_key
    DO UPDATE
    SET updated_at = sar.updated_at
    RETURNING
      sar.id AS request_id,
      sar.supplier_id AS request_supplier_id,
      sar.status AS request_status,
      sar.created_at AS request_created_at,
      sar.updated_at AS request_updated_at,
      sar.decided_at AS request_decided_at
  )
  SELECT
    upserted.request_id,
    upserted.request_supplier_id,
    upserted.request_status,
    upserted.request_created_at,
    upserted.request_updated_at,
    upserted.request_decided_at
  FROM upserted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_supplier_access(UUID, TEXT)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.request_supplier_access(UUID, TEXT)
  FROM anon, public;

COMMENT ON FUNCTION public.request_supplier_access(UUID, TEXT) IS
  'SECURITY DEFINER buyer RPC for one-click supplier access requests. Uses explicit aliases to avoid PL/pgSQL output-column ambiguity.';

NOTIFY pgrst, 'reload schema';
