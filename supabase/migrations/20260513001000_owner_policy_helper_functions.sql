-- ============================================================================
-- Owner helper functions for RLS policies.
--
-- Several authenticated policies need to know whether the current user owns a
-- supplier or the supplier behind an offer/request. If policies reference
-- public.suppliers directly, buyers can hit "permission denied for table
-- suppliers" even when another OR branch would allow their own rows.
--
-- These SECURITY DEFINER boolean helpers keep base supplier identity protected
-- while giving RLS policies a narrow ownership predicate.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_supplier_owner(
  _user_id UUID,
  _supplier_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    _user_id IS NOT NULL
    AND _supplier_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.suppliers AS s
      WHERE s.id = _supplier_id
        AND s.owner_user_id = _user_id
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.is_offer_supplier_owner(
  _user_id UUID,
  _offer_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    _user_id IS NOT NULL
    AND _offer_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.offers AS o
      JOIN public.suppliers AS s ON s.id = o.supplier_id
      WHERE o.id = _offer_id
        AND s.owner_user_id = _user_id
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.is_supplier_access_request_supplier_owner(
  _user_id UUID,
  _supplier_access_request_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    _user_id IS NOT NULL
    AND _supplier_access_request_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.supplier_access_requests AS sar
      JOIN public.suppliers AS s ON s.id = sar.supplier_id
      WHERE sar.id = _supplier_access_request_id
        AND s.owner_user_id = _user_id
    ),
    false
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_supplier_owner(UUID, UUID)
  FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_offer_supplier_owner(UUID, UUID)
  FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_supplier_access_request_supplier_owner(UUID, UUID)
  FROM anon, public;

GRANT EXECUTE ON FUNCTION public.is_supplier_owner(UUID, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_offer_supplier_owner(UUID, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_supplier_access_request_supplier_owner(UUID, UUID)
  TO authenticated;

DROP POLICY IF EXISTS "Supplier owners view incoming access requests"
  ON public.supplier_access_requests;

CREATE POLICY "Supplier owners view incoming access requests"
  ON public.supplier_access_requests FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND public.is_supplier_owner(auth.uid(), supplier_access_requests.supplier_id)
  );

DROP POLICY IF EXISTS "Supplier owners update incoming access requests"
  ON public.supplier_access_requests;

CREATE POLICY "Supplier owners update incoming access requests"
  ON public.supplier_access_requests FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND public.is_supplier_owner(auth.uid(), supplier_access_requests.supplier_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND public.is_supplier_owner(auth.uid(), supplier_access_requests.supplier_id)
  );

DROP POLICY IF EXISTS "Supplier owners view grants for own suppliers"
  ON public.access_grants;

CREATE POLICY "Supplier owners view grants for own suppliers"
  ON public.access_grants FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND (
      public.is_supplier_owner(auth.uid(), access_grants.supplier_id)
      OR public.is_offer_supplier_owner(auth.uid(), access_grants.offer_id)
    )
  );

DROP POLICY IF EXISTS "Supplier owners create grants for own suppliers"
  ON public.access_grants;

CREATE POLICY "Supplier owners create grants for own suppliers"
  ON public.access_grants FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND granted_by = auth.uid()
    AND (
      public.is_supplier_owner(auth.uid(), access_grants.supplier_id)
      OR public.is_offer_supplier_owner(auth.uid(), access_grants.offer_id)
    )
  );

DROP POLICY IF EXISTS "Supplier owners update grants for own suppliers"
  ON public.access_grants;

CREATE POLICY "Supplier owners update grants for own suppliers"
  ON public.access_grants FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND (
      public.is_supplier_owner(auth.uid(), access_grants.supplier_id)
      OR public.is_offer_supplier_owner(auth.uid(), access_grants.offer_id)
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND (
      public.is_supplier_owner(auth.uid(), access_grants.supplier_id)
      OR public.is_offer_supplier_owner(auth.uid(), access_grants.offer_id)
    )
  );

DROP POLICY IF EXISTS "Supplier owners view access events for own suppliers"
  ON public.access_events;

CREATE POLICY "Supplier owners view access events for own suppliers"
  ON public.access_events FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND (
      public.is_supplier_owner(auth.uid(), access_events.supplier_id)
      OR public.is_offer_supplier_owner(auth.uid(), access_events.offer_id)
      OR public.is_supplier_access_request_supplier_owner(
        auth.uid(),
        access_events.supplier_access_request_id
      )
    )
  );

COMMENT ON FUNCTION public.is_supplier_owner(UUID, UUID) IS
  'SECURITY DEFINER boolean helper for RLS supplier ownership checks. Does not expose supplier fields.';

COMMENT ON FUNCTION public.is_offer_supplier_owner(UUID, UUID) IS
  'SECURITY DEFINER boolean helper for RLS offer supplier-ownership checks. Does not expose supplier or offer fields.';

COMMENT ON FUNCTION public.is_supplier_access_request_supplier_owner(UUID, UUID) IS
  'SECURITY DEFINER boolean helper for RLS supplier-access-request ownership checks. Does not expose supplier fields.';

NOTIFY pgrst, 'reload schema';
