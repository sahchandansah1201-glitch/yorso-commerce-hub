
-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TYPE public.supplier_verification_status AS ENUM ('unverified', 'pending', 'verified');

CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID,
  company_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  description TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  verification_status public.supplier_verification_status NOT NULL DEFAULT 'unverified',
  rating NUMERIC(3,2),
  certifications TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppliers_country ON public.suppliers(country_code);
CREATE INDEX idx_suppliers_owner ON public.suppliers(owner_user_id);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Base table: deny direct SELECT (use suppliers_public view instead).
-- Full row access only for admins and the supplier owner themselves.
CREATE POLICY "Admins can view all suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can view their own record"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Admins can manage suppliers"
  ON public.suppliers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supplier owner can update own record"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_user_id AND public.has_role(auth.uid(), 'supplier'))
  WITH CHECK (auth.uid() = owner_user_id);

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public view: only non-sensitive supplier fields
CREATE VIEW public.suppliers_public
WITH (security_invoker=on) AS
  SELECT
    id,
    country_code,
    verification_status,
    rating,
    certifications,
    created_at
  FROM public.suppliers;

-- ============================================================
-- OFFERS
-- ============================================================
CREATE TYPE public.offer_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  latin_name TEXT,
  format_cut TEXT,
  origin_country_code TEXT NOT NULL,
  price_amount NUMERIC(12,2),
  price_currency TEXT NOT NULL DEFAULT 'USD',
  price_unit TEXT NOT NULL DEFAULT 'kg',
  price_min NUMERIC(12,2),
  price_max NUMERIC(12,2),
  moq_value NUMERIC(12,2),
  moq_unit TEXT,
  packaging TEXT,
  incoterms TEXT,
  payment_terms TEXT,
  certifications TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  description TEXT,
  status public.offer_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_offers_supplier ON public.offers(supplier_id);
CREATE INDEX idx_offers_category ON public.offers(category_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_offers_origin ON public.offers(origin_country_code);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Base table: deny direct SELECT for general users (use offers_public view).
-- Full row visible only to admins and the owning supplier.
CREATE POLICY "Admins can view all offers"
  ON public.offers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can view their own offers"
  ON public.offers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = offers.supplier_id
        AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage offers"
  ON public.offers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers can manage their own offers"
  ON public.offers FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'supplier')
    AND EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = offers.supplier_id
        AND s.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'supplier')
    AND EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE s.id = offers.supplier_id
        AND s.owner_user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public view: published offers without exact price / supplier identity
CREATE VIEW public.offers_public
WITH (security_invoker=on) AS
  SELECT
    o.id,
    o.category_id,
    o.product_name,
    o.latin_name,
    o.format_cut,
    o.origin_country_code,
    o.price_currency,
    o.price_unit,
    o.price_min,
    o.price_max,
    o.moq_value,
    o.moq_unit,
    o.packaging,
    o.incoterms,
    o.payment_terms,
    o.certifications,
    o.image_url,
    o.description,
    o.published_at,
    o.created_at,
    -- public supplier hints (country + verification only)
    s.country_code AS supplier_country_code,
    s.verification_status AS supplier_verification_status,
    s.rating AS supplier_rating
  FROM public.offers o
  JOIN public.suppliers s ON s.id = o.supplier_id
  WHERE o.status = 'published';

-- ============================================================
-- PRICE ACCESS REQUESTS
-- ============================================================
CREATE TYPE public.price_access_status AS ENUM ('pending', 'approved', 'rejected', 'revoked');

CREATE TABLE public.price_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_user_id UUID NOT NULL,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  status public.price_access_status NOT NULL DEFAULT 'pending',
  message TEXT,
  decided_at TIMESTAMPTZ,
  decided_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (buyer_user_id, offer_id)
);

CREATE INDEX idx_par_buyer ON public.price_access_requests(buyer_user_id);
CREATE INDEX idx_par_offer ON public.price_access_requests(offer_id);
CREATE INDEX idx_par_status ON public.price_access_requests(status);

ALTER TABLE public.price_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view their own requests"
  ON public.price_access_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_user_id);

CREATE POLICY "Buyers create their own requests"
  ON public.price_access_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = buyer_user_id
    AND public.has_role(auth.uid(), 'buyer')
  );

CREATE POLICY "Admins view all requests"
  ON public.price_access_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all requests"
  ON public.price_access_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_par_updated_at
  BEFORE UPDATE ON public.price_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- PRICE ACCESS HELPER (security definer, used by app code)
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_price_access(_user_id UUID, _offer_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.price_access_requests
    WHERE buyer_user_id = _user_id
      AND offer_id = _offer_id
      AND status = 'approved'
  );
$$;
