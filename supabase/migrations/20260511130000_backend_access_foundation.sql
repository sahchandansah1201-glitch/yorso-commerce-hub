-- ============================================================================
-- Backend access foundation for supplier/offer data.
--
-- Goals:
--   1. Stop direct public reads from base supplier/offer tables.
--   2. Keep public catalog reads available through safe views only.
--   3. Add supplier-scoped access requests, reusable access grants and audit
--      events for the frontend Supplier Access Flow.
--   4. Add helper functions used by future RPC/views:
--      has_supplier_access(user, supplier) and has_offer_price_access(user, offer).
-- ============================================================================

-- ── 1. Enums ────────────────────────────────────────────────────────────────

DO $$
BEGIN
  CREATE TYPE public.access_request_status AS ENUM (
    'sent',
    'pending',
    'approved',
    'rejected',
    'revoked'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.access_grant_scope AS ENUM (
    'supplier',
    'offer',
    'document'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.access_event_type AS ENUM (
    'supplier_access_requested',
    'supplier_access_pending',
    'supplier_access_approved',
    'supplier_access_rejected',
    'supplier_access_revoked',
    'offer_price_access_approved',
    'access_grant_created',
    'access_grant_revoked'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Supplier access requests ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.supplier_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  status public.access_request_status NOT NULL DEFAULT 'sent',
  message TEXT,
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (buyer_user_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_access_requests_buyer
  ON public.supplier_access_requests(buyer_user_id);

CREATE INDEX IF NOT EXISTS idx_supplier_access_requests_supplier
  ON public.supplier_access_requests(supplier_id);

CREATE INDEX IF NOT EXISTS idx_supplier_access_requests_status
  ON public.supplier_access_requests(status);

ALTER TABLE public.supplier_access_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.supplier_access_requests TO authenticated;
REVOKE ALL ON public.supplier_access_requests FROM anon;

DROP TRIGGER IF EXISTS trg_supplier_access_requests_updated_at
  ON public.supplier_access_requests;

CREATE TRIGGER trg_supplier_access_requests_updated_at
  BEFORE UPDATE ON public.supplier_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Buyers view own supplier access requests"
  ON public.supplier_access_requests;

CREATE POLICY "Buyers view own supplier access requests"
  ON public.supplier_access_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_user_id);

DROP POLICY IF EXISTS "Buyers create own supplier access requests"
  ON public.supplier_access_requests;

CREATE POLICY "Buyers create own supplier access requests"
  ON public.supplier_access_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = buyer_user_id
    AND public.has_role(auth.uid(), 'buyer'::public.app_role)
  );

DROP POLICY IF EXISTS "Supplier owners view incoming access requests"
  ON public.supplier_access_requests;

CREATE POLICY "Supplier owners view incoming access requests"
  ON public.supplier_access_requests FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND EXISTS (
      SELECT 1
      FROM public.suppliers s
      WHERE s.id = supplier_access_requests.supplier_id
        AND s.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Supplier owners update incoming access requests"
  ON public.supplier_access_requests;

CREATE POLICY "Supplier owners update incoming access requests"
  ON public.supplier_access_requests FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND EXISTS (
      SELECT 1
      FROM public.suppliers s
      WHERE s.id = supplier_access_requests.supplier_id
        AND s.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND EXISTS (
      SELECT 1
      FROM public.suppliers s
      WHERE s.id = supplier_access_requests.supplier_id
        AND s.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage supplier access requests"
  ON public.supplier_access_requests;

CREATE POLICY "Admins manage supplier access requests"
  ON public.supplier_access_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── 3. Reusable access grants ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.access_grant_scope NOT NULL,
  grantee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  document_id UUID,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_supplier_request_id UUID REFERENCES public.supplier_access_requests(id) ON DELETE SET NULL,
  source_price_request_id UUID REFERENCES public.price_access_requests(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT access_grants_single_target CHECK (
    (scope = 'supplier'::public.access_grant_scope AND supplier_id IS NOT NULL AND offer_id IS NULL AND document_id IS NULL)
    OR
    (scope = 'offer'::public.access_grant_scope AND supplier_id IS NULL AND offer_id IS NOT NULL AND document_id IS NULL)
    OR
    (scope = 'document'::public.access_grant_scope AND supplier_id IS NULL AND offer_id IS NULL AND document_id IS NOT NULL)
  ),
  CONSTRAINT access_grants_valid_expiry CHECK (
    expires_at IS NULL OR expires_at > starts_at
  )
);

CREATE INDEX IF NOT EXISTS idx_access_grants_grantee
  ON public.access_grants(grantee_user_id);

CREATE INDEX IF NOT EXISTS idx_access_grants_supplier
  ON public.access_grants(supplier_id)
  WHERE scope = 'supplier'::public.access_grant_scope;

CREATE INDEX IF NOT EXISTS idx_access_grants_offer
  ON public.access_grants(offer_id)
  WHERE scope = 'offer'::public.access_grant_scope;

CREATE INDEX IF NOT EXISTS idx_access_grants_document
  ON public.access_grants(document_id)
  WHERE scope = 'document'::public.access_grant_scope;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_supplier_access_grant
  ON public.access_grants(grantee_user_id, supplier_id)
  WHERE scope = 'supplier'::public.access_grant_scope
    AND revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_offer_access_grant
  ON public.access_grants(grantee_user_id, offer_id)
  WHERE scope = 'offer'::public.access_grant_scope
    AND revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_document_access_grant
  ON public.access_grants(grantee_user_id, document_id)
  WHERE scope = 'document'::public.access_grant_scope
    AND revoked_at IS NULL;

ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.access_grants TO authenticated;
REVOKE ALL ON public.access_grants FROM anon;

DROP TRIGGER IF EXISTS trg_access_grants_updated_at
  ON public.access_grants;

CREATE TRIGGER trg_access_grants_updated_at
  BEFORE UPDATE ON public.access_grants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Grantees view own access grants"
  ON public.access_grants;

CREATE POLICY "Grantees view own access grants"
  ON public.access_grants FOR SELECT
  TO authenticated
  USING (auth.uid() = grantee_user_id);

DROP POLICY IF EXISTS "Supplier owners view grants for own suppliers"
  ON public.access_grants;

CREATE POLICY "Supplier owners view grants for own suppliers"
  ON public.access_grants FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND (
      EXISTS (
        SELECT 1
        FROM public.suppliers s
        WHERE s.id = access_grants.supplier_id
          AND s.owner_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.offers o
        JOIN public.suppliers s ON s.id = o.supplier_id
        WHERE o.id = access_grants.offer_id
          AND s.owner_user_id = auth.uid()
      )
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
      EXISTS (
        SELECT 1
        FROM public.suppliers s
        WHERE s.id = access_grants.supplier_id
          AND s.owner_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.offers o
        JOIN public.suppliers s ON s.id = o.supplier_id
        WHERE o.id = access_grants.offer_id
          AND s.owner_user_id = auth.uid()
      )
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
      EXISTS (
        SELECT 1
        FROM public.suppliers s
        WHERE s.id = access_grants.supplier_id
          AND s.owner_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.offers o
        JOIN public.suppliers s ON s.id = o.supplier_id
        WHERE o.id = access_grants.offer_id
          AND s.owner_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND (
      EXISTS (
        SELECT 1
        FROM public.suppliers s
        WHERE s.id = access_grants.supplier_id
          AND s.owner_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.offers o
        JOIN public.suppliers s ON s.id = o.supplier_id
        WHERE o.id = access_grants.offer_id
          AND s.owner_user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Admins manage access grants"
  ON public.access_grants;

CREATE POLICY "Admins manage access grants"
  ON public.access_grants FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── 4. Access event log ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.access_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type public.access_event_type NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  grant_id UUID REFERENCES public.access_grants(id) ON DELETE SET NULL,
  supplier_access_request_id UUID REFERENCES public.supplier_access_requests(id) ON DELETE SET NULL,
  price_access_request_id UUID REFERENCES public.price_access_requests(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_events_actor
  ON public.access_events(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_access_events_target
  ON public.access_events(target_user_id);

CREATE INDEX IF NOT EXISTS idx_access_events_supplier
  ON public.access_events(supplier_id);

CREATE INDEX IF NOT EXISTS idx_access_events_offer
  ON public.access_events(offer_id);

CREATE INDEX IF NOT EXISTS idx_access_events_type
  ON public.access_events(event_type);

ALTER TABLE public.access_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_events TO authenticated;
REVOKE ALL ON public.access_events FROM anon;

DROP POLICY IF EXISTS "Users view own access events"
  ON public.access_events;

CREATE POLICY "Users view own access events"
  ON public.access_events FOR SELECT
  TO authenticated
  USING (
    auth.uid() = actor_user_id
    OR auth.uid() = target_user_id
  );

DROP POLICY IF EXISTS "Supplier owners view access events for own suppliers"
  ON public.access_events;

CREATE POLICY "Supplier owners view access events for own suppliers"
  ON public.access_events FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'supplier'::public.app_role)
    AND (
      EXISTS (
        SELECT 1
        FROM public.suppliers s
        WHERE s.id = access_events.supplier_id
          AND s.owner_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.offers o
        JOIN public.suppliers s ON s.id = o.supplier_id
        WHERE o.id = access_events.offer_id
          AND s.owner_user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Admins manage access events"
  ON public.access_events;

CREATE POLICY "Admins manage access events"
  ON public.access_events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── 5. Safe public views and base-table privilege tightening ────────────────

DROP POLICY IF EXISTS "Public can read suppliers via view" ON public.suppliers;
DROP POLICY IF EXISTS "Public can read published offers via view" ON public.offers;

DROP VIEW IF EXISTS public.offers_public CASCADE;
DROP VIEW IF EXISTS public.suppliers_public CASCADE;

-- Safe public offer view. It intentionally excludes exact numeric price,
-- supplier identity and supplier_id. Public trade/logistics fields stay public.
CREATE VIEW public.offers_public AS
SELECT
  o.id,
  o.product_name,
  o.species,
  o.latin_name,
  o.category_id,
  o.origin_country_code,
  o.origin_flag,
  o.format,
  o.format_cut,
  o.packaging_label,
  o.packaging,
  o.certifications,
  o.price_range_label,
  o.moq_value,
  o.moq_unit,
  o.moq_label,
  o.freshness,
  o.image,
  o.image_list,
  o.gallery,
  o.delivery_basis_options,
  o.volume_breaks,
  o.related_articles,
  o.specs,
  o.commercial_terms,
  o.traceability,
  o.sample_available,
  o.inspection_available,
  o.photo_source_label,
  o.description,
  o.image_url,
  o.status,
  o.published_at,
  o.created_at,
  o.updated_at
FROM public.offers o
WHERE o.status = 'published'::public.offer_status;

-- Safe public supplier view. It intentionally excludes company_name, contacts,
-- website, legal details, owner_user_id and exact catalog breadth.
CREATE VIEW public.suppliers_public AS
SELECT
  s.id,
  s.country_code,
  s.country_flag,
  s.certifications,
  s.verification_status,
  s.in_business_since,
  s.response_time,
  s.profile_slug,
  s.verification_scope,
  s.verification_date,
  s.documents_reviewed,
  s.created_at,
  s.updated_at
FROM public.suppliers s;

GRANT SELECT ON public.offers_public TO anon, authenticated;
GRANT SELECT ON public.suppliers_public TO anon, authenticated;

-- Do not allow anonymous clients to query base tables directly.
REVOKE ALL ON public.offers FROM anon;
REVOKE ALL ON public.suppliers FROM anon;

-- Authenticated users keep base-table privileges, but RLS now limits rows to
-- admin and supplier-owner policies. General buyers should use safe views/RPC.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;

-- ── 6. Access helper functions ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.has_supplier_access(
  _user_id UUID,
  _supplier_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(_user_id IS NOT NULL AND _supplier_id IS NOT NULL, false)
    AND (
      public.has_role(_user_id, 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1
        FROM public.suppliers s
        WHERE s.id = _supplier_id
          AND s.owner_user_id = _user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.access_grants g
        WHERE g.grantee_user_id = _user_id
          AND g.scope = 'supplier'::public.access_grant_scope
          AND g.supplier_id = _supplier_id
          AND g.revoked_at IS NULL
          AND g.starts_at <= now()
          AND (g.expires_at IS NULL OR g.expires_at > now())
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.has_offer_price_access(
  _user_id UUID,
  _offer_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(_user_id IS NOT NULL AND _offer_id IS NOT NULL, false)
    AND (
      public.has_role(_user_id, 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1
        FROM public.offers o
        JOIN public.suppliers s ON s.id = o.supplier_id
        WHERE o.id = _offer_id
          AND s.owner_user_id = _user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.price_access_requests r
        WHERE r.buyer_user_id = _user_id
          AND r.offer_id = _offer_id
          AND r.status = 'approved'::public.price_access_status
      )
      OR EXISTS (
        SELECT 1
        FROM public.access_grants g
        WHERE g.grantee_user_id = _user_id
          AND g.scope = 'offer'::public.access_grant_scope
          AND g.offer_id = _offer_id
          AND g.revoked_at IS NULL
          AND g.starts_at <= now()
          AND (g.expires_at IS NULL OR g.expires_at > now())
      )
      OR EXISTS (
        SELECT 1
        FROM public.offers o
        JOIN public.access_grants g ON g.supplier_id = o.supplier_id
        WHERE o.id = _offer_id
          AND g.grantee_user_id = _user_id
          AND g.scope = 'supplier'::public.access_grant_scope
          AND g.revoked_at IS NULL
          AND g.starts_at <= now()
          AND (g.expires_at IS NULL OR g.expires_at > now())
      )
    );
$$;

-- Backward-compatible alias used by existing get_qualified_offer(s) RPC.
CREATE OR REPLACE FUNCTION public.has_price_access(
  _user_id UUID,
  _offer_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_offer_price_access(_user_id, _offer_id);
$$;

REVOKE EXECUTE ON FUNCTION public.has_supplier_access(UUID, UUID)
  FROM anon, authenticated, public;

REVOKE EXECUTE ON FUNCTION public.has_offer_price_access(UUID, UUID)
  FROM anon, authenticated, public;

REVOKE EXECUTE ON FUNCTION public.has_price_access(UUID, UUID)
  FROM anon, authenticated, public;

COMMENT ON TABLE public.supplier_access_requests IS
  'Buyer requests supplier-scoped price/identity access. Used by Supplier Access Flow.';

COMMENT ON TABLE public.access_grants IS
  'Reusable supplier, offer or document grants. Active grants are scoped and time-bounded.';

COMMENT ON TABLE public.access_events IS
  'Audit log for access request and grant lifecycle events.';

COMMENT ON FUNCTION public.has_supplier_access(UUID, UUID) IS
  'Returns true for admin, supplier owner, or active supplier-scoped grant.';

COMMENT ON FUNCTION public.has_offer_price_access(UUID, UUID) IS
  'Returns true for admin, supplier owner, approved legacy price request, active offer grant, or active supplier grant.';

NOTIFY pgrst, 'reload schema';
