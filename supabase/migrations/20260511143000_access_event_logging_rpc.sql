-- ============================================================================
-- Controlled access-event logging.
--
-- The frontend adapter must not insert audit rows directly into access_events.
-- This RPC records supplier request lifecycle events only after verifying that
-- the caller is connected to the request as buyer, supplier owner or admin.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_supplier_access_event(
  p_supplier_access_request_id UUID,
  p_event_type public.access_event_type DEFAULT 'supplier_access_requested'::public.access_event_type,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_request public.supplier_access_requests%ROWTYPE;
  v_supplier_owner UUID;
  v_event_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required'
      USING ERRCODE = '28000';
  END IF;

  IF p_event_type NOT IN (
    'supplier_access_requested'::public.access_event_type,
    'supplier_access_pending'::public.access_event_type,
    'supplier_access_approved'::public.access_event_type,
    'supplier_access_rejected'::public.access_event_type,
    'supplier_access_revoked'::public.access_event_type
  ) THEN
    RAISE EXCEPTION 'Unsupported supplier access event type: %', p_event_type
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_request
  FROM public.supplier_access_requests r
  WHERE r.id = p_supplier_access_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Supplier access request not found'
      USING ERRCODE = '02000';
  END IF;

  SELECT s.owner_user_id
  INTO v_supplier_owner
  FROM public.suppliers s
  WHERE s.id = v_request.supplier_id;

  IF NOT (
    v_request.buyer_user_id = v_uid
    OR v_supplier_owner = v_uid
    OR public.has_role(v_uid, 'admin'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Not allowed to log this supplier access event'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.access_events (
    event_type,
    actor_user_id,
    target_user_id,
    supplier_id,
    supplier_access_request_id,
    metadata
  )
  VALUES (
    p_event_type,
    v_uid,
    v_request.buyer_user_id,
    v_request.supplier_id,
    v_request.id,
    COALESCE(p_metadata, '{}'::jsonb)
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
  'Controlled SECURITY DEFINER RPC for supplier access audit events. Allows only request buyer, supplier owner or admin.';

NOTIFY pgrst, 'reload schema';
