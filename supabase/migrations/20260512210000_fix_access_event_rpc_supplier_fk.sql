-- ============================================================================
-- Fix log_supplier_access_event supplier FK privilege failure.
--
-- The RPC runs as SECURITY INVOKER to satisfy Advisor hardening. Writing
-- access_events.supplier_id forces the authenticated buyer path through the
-- suppliers FK/privilege boundary. The audit event already has a stable
-- supplier_access_request_id; supplier context can be derived through that
-- request when needed.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_supplier_access_event(
  p_supplier_access_request_id UUID,
  p_event_type public.access_event_type DEFAULT 'supplier_access_requested'::public.access_event_type,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_request public.supplier_access_requests%ROWTYPE;
  v_metadata JSONB := COALESCE(p_metadata, '{}'::jsonb);
  v_event_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '28000';
  END IF;

  IF jsonb_typeof(v_metadata) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Supplier access event metadata must be a JSON object'
      USING ERRCODE = '22023';
  END IF;

  IF p_event_type <> 'supplier_access_requested'::public.access_event_type THEN
    RAISE EXCEPTION 'Unsupported supplier access event type for buyer RPC: %', p_event_type
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_request
  FROM public.supplier_access_requests AS sar
  WHERE sar.id = p_supplier_access_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supplier access request not found'
      USING ERRCODE = '02000';
  END IF;

  IF v_request.buyer_user_id <> v_uid THEN
    RAISE EXCEPTION 'Not allowed to log this supplier access event'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.access_events (
    event_type,
    actor_user_id,
    target_user_id,
    supplier_access_request_id,
    metadata
  )
  VALUES (
    p_event_type,
    v_uid,
    v_request.buyer_user_id,
    v_request.id,
    v_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_supplier_access_event(UUID, public.access_event_type, JSONB)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.log_supplier_access_event(UUID, public.access_event_type, JSONB)
  FROM anon, public;

COMMENT ON FUNCTION public.log_supplier_access_event(UUID, public.access_event_type, JSONB) IS
  'SECURITY INVOKER RPC for buyer-created supplier access audit events. Supplier context is derived through supplier_access_request_id to avoid direct suppliers FK privilege checks.';

NOTIFY pgrst, 'reload schema';
