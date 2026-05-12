-- ============================================================================
-- Supabase Advisor hardening: SECURITY DEFINER views + access-event RPC.
--
-- Fixes Advisor ERROR 0010 for:
--   - public.offers_public
--   - public.suppliers_public
--   - public.access_events_admin
--
-- Also removes the Advisor WARN 0029 for log_supplier_access_event by making the
-- buyer-side audit RPC SECURITY INVOKER. The qualified price RPCs remain
-- SECURITY DEFINER intentionally: they are the controlled price-access boundary
-- until a dedicated backend/API layer replaces them.
-- ============================================================================

-- ── 1. Public catalog views must run as the querying role ────────────────────

ALTER VIEW public.offers_public SET (security_invoker = on);
ALTER VIEW public.suppliers_public SET (security_invoker = on);

-- Only SELECT should be exposed on public views. Earlier default privileges can
-- grant overly broad view privileges, so reset them explicitly.
REVOKE ALL ON public.offers_public FROM anon, authenticated, public;
REVOKE ALL ON public.suppliers_public FROM anon, authenticated, public;
GRANT SELECT ON public.offers_public TO anon, authenticated;
GRANT SELECT ON public.suppliers_public TO anon, authenticated;

-- SECURITY INVOKER views require the caller to have privileges on the referenced
-- base columns. Grant only the columns used by the safe public views, never exact
-- price fields or supplier identity fields.
REVOKE SELECT ON public.offers FROM anon, authenticated;
GRANT SELECT (
  id,
  product_name,
  species,
  latin_name,
  category_id,
  origin_country_code,
  origin_flag,
  format,
  format_cut,
  packaging_label,
  packaging,
  certifications,
  price_range_label,
  moq_value,
  moq_unit,
  moq_label,
  freshness,
  image,
  image_list,
  gallery,
  delivery_basis_options,
  volume_breaks,
  related_articles,
  specs,
  commercial_terms,
  traceability,
  sample_available,
  inspection_available,
  photo_source_label,
  description,
  image_url,
  status,
  published_at,
  created_at,
  updated_at
) ON public.offers TO anon, authenticated;

REVOKE SELECT ON public.suppliers FROM anon, authenticated;
GRANT SELECT (
  id,
  country_code,
  country_flag,
  certifications,
  verification_status,
  in_business_since,
  response_time,
  profile_slug,
  verification_scope,
  verification_date,
  documents_reviewed,
  created_at,
  updated_at
) ON public.suppliers TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read published offer public fields"
  ON public.offers;

CREATE POLICY "Public can read published offer public fields"
  ON public.offers FOR SELECT
  TO anon, authenticated
  USING (status = 'published'::public.offer_status);

DROP POLICY IF EXISTS "Public can read supplier public fields"
  ON public.suppliers;

CREATE POLICY "Public can read supplier public fields"
  ON public.suppliers FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── 2. Admin audit view is not a public API until admin backend is designed ──

ALTER VIEW public.access_events_admin SET (security_invoker = on);
ALTER VIEW public.access_events_admin SET (security_barrier = on);

REVOKE ALL ON public.access_events_admin FROM anon, authenticated, public;

COMMENT ON VIEW public.access_events_admin IS
  'Internal admin audit view for access_events. SECURITY INVOKER; not exposed through PostgREST until the admin backend/API is implemented.';

-- ── 3. Buyer-side access event logging should not require SECURITY DEFINER ───

DROP POLICY IF EXISTS "Users insert own supplier access request events"
  ON public.access_events;

CREATE POLICY "Users insert own supplier access request events"
  ON public.access_events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND actor_user_id = auth.uid()
    AND target_user_id = auth.uid()
    AND supplier_access_request_id IS NOT NULL
    AND event_type = 'supplier_access_requested'::public.access_event_type
  );

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
  FROM public.supplier_access_requests r
  WHERE r.id = p_supplier_access_request_id;

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
  'SECURITY INVOKER RPC for buyer-created supplier access audit events. Supplier/admin lifecycle events require a dedicated backend/admin API.';

NOTIFY pgrst, 'reload schema';
