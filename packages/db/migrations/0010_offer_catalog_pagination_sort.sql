-- YORSO self-hosted offer catalog pagination and sort indexes.
-- Batch #54: keep /v1/offers bounded and index-backed for 10,000 concurrent users.

create index if not exists idx_yorso_offers_catalog_published_updated
  on yorso_offers_catalog(publication_status, updated_at desc, id asc);

create index if not exists idx_yorso_offers_catalog_published_category
  on yorso_offers_catalog(publication_status, category, product_name, id);

create index if not exists idx_yorso_offers_catalog_published_origin
  on yorso_offers_catalog(publication_status, origin_code, origin, product_name, id);

create index if not exists idx_yorso_offers_catalog_published_moq
  on yorso_offers_catalog(publication_status, moq_value, id);

comment on index idx_yorso_offers_catalog_published_updated is
  'Stable latest-offer pagination for /v1/offers under 10,000 concurrent users.';
comment on index idx_yorso_offers_catalog_published_category is
  'Stable category sort for bounded offer catalog pages.';
comment on index idx_yorso_offers_catalog_published_origin is
  'Stable origin sort for bounded offer catalog pages.';
comment on index idx_yorso_offers_catalog_published_moq is
  'Stable MOQ sort for bounded offer catalog pages without exposing exact locked price.';
