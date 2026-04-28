-- SUPPLIERS additions
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS country_flag text,
  ADD COLUMN IF NOT EXISTS in_business_since integer,
  ADD COLUMN IF NOT EXISTS response_time text,
  ADD COLUMN IF NOT EXISTS profile_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS verification_scope text,
  ADD COLUMN IF NOT EXISTS verification_date text,
  ADD COLUMN IF NOT EXISTS documents_reviewed text[] NOT NULL DEFAULT '{}'::text[];

-- OFFERS additions
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS species text,
  ADD COLUMN IF NOT EXISTS origin_flag text,
  ADD COLUMN IF NOT EXISTS freshness text,
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS image_list text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS packaging_label text,
  ADD COLUMN IF NOT EXISTS price_range_label text,
  ADD COLUMN IF NOT EXISTS moq_label text,
  ADD COLUMN IF NOT EXISTS traceability text,
  ADD COLUMN IF NOT EXISTS sample_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inspection_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_source_label text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS delivery_basis_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS volume_breaks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_articles jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS commercial_terms jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Drop old views to allow column reordering
DROP VIEW IF EXISTS public.offers_public;
DROP VIEW IF EXISTS public.suppliers_public;

CREATE VIEW public.suppliers_public
WITH (security_invoker = on) AS
SELECT
  id,
  company_name,
  country_code,
  country_flag,
  website,
  description,
  rating,
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
FROM public.suppliers
WHERE verification_status IN ('verified','pending','unverified');

CREATE VIEW public.offers_public
WITH (security_invoker = on) AS
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
  o.price_min,
  o.price_max,
  o.price_currency,
  o.price_unit,
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
  o.updated_at,
  o.supplier_id AS supplier_public_id
FROM public.offers o
WHERE o.status = 'published';

-- Public read policies via base tables (sensitive fields stay hidden because app reads views)
DROP POLICY IF EXISTS "Public can read suppliers via view" ON public.suppliers;
CREATE POLICY "Public can read suppliers via view"
  ON public.suppliers FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can read published offers via view" ON public.offers;
CREATE POLICY "Public can read published offers via view"
  ON public.offers FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_category_id ON public.offers(category_id);
CREATE INDEX IF NOT EXISTS idx_offers_supplier_id ON public.offers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_offers_origin_country ON public.offers(origin_country_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON public.suppliers(country_code);