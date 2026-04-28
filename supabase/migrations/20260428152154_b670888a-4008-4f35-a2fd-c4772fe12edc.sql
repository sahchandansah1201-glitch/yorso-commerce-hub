-- Безопасное разделение публичного каталога и qualified-доступа
-- ----------------------------------------------------------------
-- ПРОБЛЕМА: текущие views offers_public/suppliers_public отдают точные цены
-- (price_min/max/currency/unit) и идентификаторы поставщиков всем ролям.
-- Фронт скрывает эти поля в UI, но они попадают в network response.
--
-- РЕШЕНИЕ:
--   1. offers_public пересоздаём БЕЗ price_min/price_max/price_currency/price_unit
--      и БЕЗ supplier_public_id. Только публично безопасные поля.
--   2. suppliers_public пересоздаём БЕЗ company_name/website/description/rating.
--      Остаются только обезличенные сигналы доверия (страна, статус верификации,
--      сертификации, profile_slug, год основания, время отклика).
--   3. Для qualified-доступа создаём две RPC SECURITY DEFINER:
--        - get_qualified_offers()              — список со всеми ценами/supplier_id
--        - get_qualified_offer(p_offer_id uuid) — одна позиция
--      Внутри обе проверяют либо роль admin/supplier-владельца, либо
--      has_price_access(uid, offer_id) для buyer'ов.

-- 1. Пересоздаём offers_public (без чувствительных полей) -----------
DROP VIEW IF EXISTS public.offers_public CASCADE;

CREATE VIEW public.offers_public WITH (security_invoker = on) AS
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
  o.price_range_label,        -- только диапазон-ярлык, без точных чисел
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
  -- ИСКЛЮЧЕНО: price_min, price_max, price_currency, price_unit, supplier_id
FROM public.offers o
WHERE o.status = 'published';

GRANT SELECT ON public.offers_public TO anon, authenticated;

-- 2. Пересоздаём suppliers_public (без company_name/contacts) --------
DROP VIEW IF EXISTS public.suppliers_public CASCADE;

CREATE VIEW public.suppliers_public WITH (security_invoker = on) AS
SELECT
  s.id,
  s.country_code,
  s.country_flag,
  s.certifications,
  s.verification_status,
  s.in_business_since,
  s.response_time,
  s.profile_slug,             -- безопасный slug, без раскрытия имени
  s.verification_scope,
  s.verification_date,
  s.documents_reviewed,
  s.created_at,
  s.updated_at
  -- ИСКЛЮЧЕНО: company_name, website, description, contact_email, contact_phone, rating, owner_user_id
FROM public.suppliers s;

GRANT SELECT ON public.suppliers_public TO anon, authenticated;

-- 3. RPC для qualified-доступа --------------------------------------
-- Тип результата: расширенный offer + минимально нужные поля поставщика
CREATE OR REPLACE FUNCTION public.get_qualified_offers()
RETURNS TABLE (
  id uuid,
  product_name text,
  species text,
  latin_name text,
  category_id uuid,
  origin_country_code text,
  origin_flag text,
  format text,
  format_cut text,
  packaging_label text,
  packaging text,
  certifications text[],
  price_min numeric,
  price_max numeric,
  price_currency text,
  price_unit text,
  price_range_label text,
  moq_value numeric,
  moq_unit text,
  moq_label text,
  freshness text,
  image text,
  image_list text[],
  gallery jsonb,
  delivery_basis_options jsonb,
  volume_breaks jsonb,
  related_articles jsonb,
  specs jsonb,
  commercial_terms jsonb,
  traceability text,
  sample_available boolean,
  inspection_available boolean,
  photo_source_label text,
  description text,
  image_url text,
  status offer_status,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  supplier_id uuid,
  supplier_company_name text,
  supplier_country_code text,
  supplier_country_flag text,
  supplier_website text,
  supplier_rating numeric,
  supplier_verification_status supplier_verification_status,
  supplier_in_business_since integer,
  supplier_response_time text,
  supplier_profile_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id, o.product_name, o.species, o.latin_name, o.category_id,
    o.origin_country_code, o.origin_flag, o.format, o.format_cut,
    o.packaging_label, o.packaging, o.certifications,
    o.price_min, o.price_max, o.price_currency, o.price_unit, o.price_range_label,
    o.moq_value, o.moq_unit, o.moq_label, o.freshness,
    o.image, o.image_list, o.gallery, o.delivery_basis_options, o.volume_breaks,
    o.related_articles, o.specs, o.commercial_terms, o.traceability,
    o.sample_available, o.inspection_available, o.photo_source_label,
    o.description, o.image_url, o.status, o.published_at, o.created_at, o.updated_at,
    s.id, s.company_name, s.country_code, s.country_flag, s.website, s.rating,
    s.verification_status, s.in_business_since, s.response_time, s.profile_slug
  FROM public.offers o
  LEFT JOIN public.suppliers s ON s.id = o.supplier_id
  WHERE o.status = 'published'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR (
        public.has_role(auth.uid(), 'buyer'::app_role)
        AND public.has_price_access(auth.uid(), o.id)
      )
      OR (
        public.has_role(auth.uid(), 'supplier'::app_role)
        AND s.owner_user_id = auth.uid()
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_qualified_offers() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_qualified_offers() FROM anon, public;

-- Версия для одного оффера
CREATE OR REPLACE FUNCTION public.get_qualified_offer(p_offer_id uuid)
RETURNS TABLE (
  id uuid,
  product_name text,
  species text,
  latin_name text,
  category_id uuid,
  origin_country_code text,
  origin_flag text,
  format text,
  format_cut text,
  packaging_label text,
  packaging text,
  certifications text[],
  price_min numeric,
  price_max numeric,
  price_currency text,
  price_unit text,
  price_range_label text,
  moq_value numeric,
  moq_unit text,
  moq_label text,
  freshness text,
  image text,
  image_list text[],
  gallery jsonb,
  delivery_basis_options jsonb,
  volume_breaks jsonb,
  related_articles jsonb,
  specs jsonb,
  commercial_terms jsonb,
  traceability text,
  sample_available boolean,
  inspection_available boolean,
  photo_source_label text,
  description text,
  image_url text,
  status offer_status,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  supplier_id uuid,
  supplier_company_name text,
  supplier_country_code text,
  supplier_country_flag text,
  supplier_website text,
  supplier_rating numeric,
  supplier_verification_status supplier_verification_status,
  supplier_in_business_since integer,
  supplier_response_time text,
  supplier_profile_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id, o.product_name, o.species, o.latin_name, o.category_id,
    o.origin_country_code, o.origin_flag, o.format, o.format_cut,
    o.packaging_label, o.packaging, o.certifications,
    o.price_min, o.price_max, o.price_currency, o.price_unit, o.price_range_label,
    o.moq_value, o.moq_unit, o.moq_label, o.freshness,
    o.image, o.image_list, o.gallery, o.delivery_basis_options, o.volume_breaks,
    o.related_articles, o.specs, o.commercial_terms, o.traceability,
    o.sample_available, o.inspection_available, o.photo_source_label,
    o.description, o.image_url, o.status, o.published_at, o.created_at, o.updated_at,
    s.id, s.company_name, s.country_code, s.country_flag, s.website, s.rating,
    s.verification_status, s.in_business_since, s.response_time, s.profile_slug
  FROM public.offers o
  LEFT JOIN public.suppliers s ON s.id = o.supplier_id
  WHERE o.id = p_offer_id
    AND o.status = 'published'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR (
        public.has_role(auth.uid(), 'buyer'::app_role)
        AND public.has_price_access(auth.uid(), o.id)
      )
      OR (
        public.has_role(auth.uid(), 'supplier'::app_role)
        AND s.owner_user_id = auth.uid()
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_qualified_offer(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_qualified_offer(uuid) FROM anon, public;