-- ============================================================================
-- Dev/smoke baseline for Supplier Access Flow write-path verification.
--
-- Purpose:
--   Provide one safe public supplier and one published offer so local smoke
--   scripts can verify:
--     anon cannot write supplier access requests;
--     authenticated buyers can create supplier_access_requests;
--     log_supplier_access_event writes access_events as SECURITY INVOKER.
--
-- This file contains no users and no secrets. Create a confirmed buyer account
-- separately in Supabase Auth before running the write smoke.
-- ============================================================================

WITH category AS (
  INSERT INTO public.categories (slug, name, sort_order)
  VALUES ('codex-smoke-seafood', 'Codex Smoke Seafood', 9900)
  ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      sort_order = EXCLUDED.sort_order,
      updated_at = now()
  RETURNING id
),
supplier AS (
  INSERT INTO public.suppliers (
    id,
    company_name,
    country_code,
    country_flag,
    description,
    verification_status,
    certifications,
    in_business_since,
    response_time,
    profile_slug,
    verification_scope,
    verification_date,
    documents_reviewed
  )
  VALUES (
    '00000000-0000-4000-8000-000000000101'::uuid,
    'Codex Smoke Supplier Ltd.',
    'NO',
    '🇳🇴',
    'Deterministic supplier row for backend access smoke tests.',
    'verified'::public.supplier_verification_status,
    ARRAY['HACCP', 'MSC']::text[],
    2016,
    'within a day',
    'codex-smoke-supplier',
    'documents and identity reviewed',
    '2026-05-12',
    ARRAY['business registration', 'HACCP certificate']::text[]
  )
  ON CONFLICT (id) DO UPDATE
  SET company_name = EXCLUDED.company_name,
      country_code = EXCLUDED.country_code,
      country_flag = EXCLUDED.country_flag,
      description = EXCLUDED.description,
      verification_status = EXCLUDED.verification_status,
      certifications = EXCLUDED.certifications,
      in_business_since = EXCLUDED.in_business_since,
      response_time = EXCLUDED.response_time,
      profile_slug = EXCLUDED.profile_slug,
      verification_scope = EXCLUDED.verification_scope,
      verification_date = EXCLUDED.verification_date,
      documents_reviewed = EXCLUDED.documents_reviewed,
      updated_at = now()
  RETURNING id
)
INSERT INTO public.offers (
  id,
  supplier_id,
  category_id,
  product_name,
  species,
  latin_name,
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
  published_at
)
SELECT
  '00000000-0000-4000-8000-000000000201'::uuid,
  supplier.id,
  category.id,
  'Codex Smoke Atlantic Salmon HOG',
  'Salmon',
  'Salmo salar',
  'NO',
  '🇳🇴',
  'Frozen',
  'HOG',
  '20 kg cartons',
  '20 kg cartons',
  ARRAY['HACCP', 'MSC']::text[],
  '$8.40-$9.10 / kg',
  1000,
  'kg',
  'MOQ: 1,000 kg',
  'Frozen',
  '/placeholder.svg',
  ARRAY['/placeholder.svg']::text[],
  '[]'::jsonb,
  '[{"basis":"FOB","port":"Ålesund"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '{"size":"3-4 kg","glaze":"0%"}'::jsonb,
  '{"incoterms":"FOB","payment":"30% advance"}'::jsonb,
  'Lot-level traceability available after supplier access.',
  true,
  true,
  'Smoke placeholder image',
  'Deterministic published offer for backend access smoke tests.',
  '/placeholder.svg',
  'published'::public.offer_status,
  now()
FROM supplier, category
ON CONFLICT (id) DO UPDATE
SET supplier_id = EXCLUDED.supplier_id,
    category_id = EXCLUDED.category_id,
    product_name = EXCLUDED.product_name,
    species = EXCLUDED.species,
    latin_name = EXCLUDED.latin_name,
    origin_country_code = EXCLUDED.origin_country_code,
    origin_flag = EXCLUDED.origin_flag,
    format = EXCLUDED.format,
    format_cut = EXCLUDED.format_cut,
    packaging_label = EXCLUDED.packaging_label,
    packaging = EXCLUDED.packaging,
    certifications = EXCLUDED.certifications,
    price_range_label = EXCLUDED.price_range_label,
    moq_value = EXCLUDED.moq_value,
    moq_unit = EXCLUDED.moq_unit,
    moq_label = EXCLUDED.moq_label,
    freshness = EXCLUDED.freshness,
    image = EXCLUDED.image,
    image_list = EXCLUDED.image_list,
    gallery = EXCLUDED.gallery,
    delivery_basis_options = EXCLUDED.delivery_basis_options,
    volume_breaks = EXCLUDED.volume_breaks,
    related_articles = EXCLUDED.related_articles,
    specs = EXCLUDED.specs,
    commercial_terms = EXCLUDED.commercial_terms,
    traceability = EXCLUDED.traceability,
    sample_available = EXCLUDED.sample_available,
    inspection_available = EXCLUDED.inspection_available,
    photo_source_label = EXCLUDED.photo_source_label,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    status = EXCLUDED.status,
    published_at = EXCLUDED.published_at,
    updated_at = now();
