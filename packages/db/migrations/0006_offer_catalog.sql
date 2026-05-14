-- YORSO self-hosted offer catalog.
-- Batch #37: backend-owned offer discovery with access-shaped supplier identity and exact price fields.

create type yorso_offer_format as enum ('Frozen', 'Fresh', 'Chilled');
create type yorso_offer_stock_status as enum ('In Stock', 'Limited', 'Pre-order');
create type yorso_offer_publication_status as enum ('draft', 'published', 'blocked');

create table if not exists yorso_offers_catalog (
  id text primary key check (char_length(id) between 1 and 80),
  supplier_directory_id text references yorso_suppliers_directory(id) on delete set null,
  product_name text not null check (char_length(product_name) between 2 and 220),
  species text not null check (char_length(species) between 1 and 140),
  latin_name text not null default '' check (char_length(latin_name) <= 140),
  category text not null check (char_length(category) between 1 and 120),
  origin text not null check (char_length(origin) between 2 and 120),
  origin_code char(2) not null,
  origin_flag text not null default '' check (char_length(origin_flag) <= 16),
  format yorso_offer_format not null,
  cut_type text not null default '' check (char_length(cut_type) <= 180),
  packaging text not null default '' check (char_length(packaging) <= 180),
  certifications text[] not null default '{}'::text[] check (array_length(certifications, 1) is null or array_length(certifications, 1) <= 30),
  image text not null check (char_length(image) between 1 and 320),
  images text[] not null default '{}'::text[] check (array_length(images, 1) is null or array_length(images, 1) <= 20),
  gallery jsonb not null default '[]'::jsonb,
  photo_source_label text not null default '' check (char_length(photo_source_label) <= 160),
  sample_available boolean not null default false,
  inspection_available boolean not null default false,
  traceability text check (traceability is null or char_length(traceability) <= 1600),
  freshness text not null default '' check (char_length(freshness) <= 120),
  moq_label text not null default '' check (char_length(moq_label) <= 120),
  moq_value numeric(14, 3) check (moq_value is null or moq_value >= 0),
  moq_unit text check (moq_unit is null or char_length(moq_unit) <= 30),
  price_range_label text not null default '' check (char_length(price_range_label) <= 120),
  price_unit text not null default '' check (char_length(price_unit) <= 80),
  price_min numeric(14, 4) check (price_min is null or price_min >= 0),
  price_max numeric(14, 4) check (price_max is null or price_max >= 0),
  currency char(3),
  supplier jsonb not null,
  supplier_name text not null check (char_length(supplier_name) between 2 and 180),
  supplier_country_code char(2) not null,
  supplier_country text not null check (char_length(supplier_country) between 2 and 120),
  supplier_profile_slug text check (supplier_profile_slug is null or char_length(supplier_profile_slug) <= 120),
  specs jsonb not null,
  commercial jsonb not null,
  delivery_basis_options jsonb not null default '[]'::jsonb,
  related_articles jsonb not null default '[]'::jsonb,
  volume_breaks jsonb not null default '[]'::jsonb,
  publication_status yorso_offer_publication_status not null default 'draft',
  certifications_search text generated always as (lower(array_to_string(certifications, ' '))) stored,
  public_search_text text generated always as (
    lower(product_name || ' ' || species || ' ' || latin_name || ' ' || category || ' ' || origin || ' ' || cut_type || ' ' || packaging || ' ' || commercial::text || ' ' || array_to_string(certifications, ' '))
  ) stored,
  private_search_text text generated always as (
    lower(product_name || ' ' || species || ' ' || latin_name || ' ' || category || ' ' || origin || ' ' || supplier_name || ' ' || supplier_country || ' ' || cut_type || ' ' || packaging || ' ' || commercial::text || ' ' || array_to_string(certifications, ' '))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint yorso_offers_origin_code_uppercase check (origin_code = upper(origin_code)),
  constraint yorso_offers_supplier_country_code_uppercase check (supplier_country_code = upper(supplier_country_code)),
  constraint yorso_offers_currency_uppercase check (currency is null or currency = upper(currency)),
  constraint yorso_offers_price_order check (price_min is null or price_max is null or price_min <= price_max),
  constraint yorso_offers_gallery_array check (jsonb_typeof(gallery) = 'array'),
  constraint yorso_offers_supplier_object check (jsonb_typeof(supplier) = 'object'),
  constraint yorso_offers_specs_object check (jsonb_typeof(specs) = 'object'),
  constraint yorso_offers_commercial_object check (jsonb_typeof(commercial) = 'object'),
  constraint yorso_offers_delivery_basis_array check (jsonb_typeof(delivery_basis_options) = 'array'),
  constraint yorso_offers_related_articles_array check (jsonb_typeof(related_articles) = 'array'),
  constraint yorso_offers_volume_breaks_array check (jsonb_typeof(volume_breaks) = 'array')
);

create index if not exists idx_yorso_offers_catalog_publication_status on yorso_offers_catalog(publication_status);
create index if not exists idx_yorso_offers_catalog_category on yorso_offers_catalog(category);
create index if not exists idx_yorso_offers_catalog_species on yorso_offers_catalog(species);
create index if not exists idx_yorso_offers_catalog_origin_code on yorso_offers_catalog(origin_code);
create index if not exists idx_yorso_offers_catalog_supplier_country_code on yorso_offers_catalog(supplier_country_code);
create index if not exists idx_yorso_offers_catalog_format on yorso_offers_catalog(format);
create index if not exists idx_yorso_offers_catalog_supplier_directory_id on yorso_offers_catalog(supplier_directory_id);

create index if not exists idx_yorso_offers_catalog_public_search_text
  on yorso_offers_catalog using gin (public_search_text gin_trgm_ops);

create index if not exists idx_yorso_offers_catalog_private_search_text
  on yorso_offers_catalog using gin (private_search_text gin_trgm_ops);

create index if not exists idx_yorso_offers_catalog_certifications_search
  on yorso_offers_catalog using gin (certifications_search gin_trgm_ops);

comment on table yorso_offers_catalog is
  'Self-hosted offer catalog records for marketplace discovery. API access-shapes exact price and supplier identity before data leaves the backend.';
comment on column yorso_offers_catalog.price_min is
  'Exact offer price. API returns this only for qualified_unlocked access.';
comment on column yorso_offers_catalog.price_max is
  'Exact offer price. API returns this only for qualified_unlocked access.';
comment on column yorso_offers_catalog.supplier is
  'Supplier identity envelope. API masks supplier id/name/contact-sensitive fields for locked users.';
comment on column yorso_offers_catalog.public_search_text is
  'Search text safe for locked users. It intentionally excludes private supplier identity.';
comment on column yorso_offers_catalog.private_search_text is
  'Search text for qualified access. It may include private supplier identity.';
comment on index idx_yorso_offers_catalog_public_search_text is
  'Trigram index for locked offer catalog search under high-concurrency catalog traffic.';
comment on index idx_yorso_offers_catalog_private_search_text is
  'Trigram index for qualified offer catalog search that may match supplier identity after access unlock.';
