-- YORSO self-hosted supplier directory.
-- Public marketplace discovery records with explicit private identity/contact fields.

create type yorso_supplier_type as enum (
  'producer',
  'processor',
  'exporter',
  'distributor',
  'trader'
);

create type yorso_supplier_response_signal as enum ('fast', 'normal', 'slow');
create type yorso_supplier_document_readiness as enum ('ready', 'partial', 'on_request');
create type yorso_supplier_verification_level as enum ('documents_reviewed', 'basic', 'unverified');
create type yorso_supplier_publication_status as enum ('draft', 'published', 'blocked');

create table if not exists yorso_suppliers_directory (
  id text primary key check (char_length(id) between 1 and 80),
  company_id uuid references yorso_companies(id) on delete set null,
  company_name text not null check (char_length(company_name) between 2 and 180),
  masked_name text not null check (char_length(masked_name) between 2 and 180),
  country text not null check (char_length(country) between 2 and 120),
  country_code char(2) not null,
  city text not null check (char_length(city) between 1 and 120),
  supplier_type yorso_supplier_type not null,
  in_business_since_year integer not null check (in_business_since_year between 1800 and 2100),
  product_focus jsonb not null default '[]'::jsonb,
  certifications text[] not null default '{}'::text[] check (array_length(certifications, 1) is null or array_length(certifications, 1) <= 30),
  certification_badges jsonb not null default '[]'::jsonb,
  active_offers_count integer not null default 0 check (active_offers_count >= 0),
  short_description text not null check (char_length(short_description) between 1 and 600),
  about text not null check (char_length(about) between 1 and 1600),
  response_signal yorso_supplier_response_signal not null default 'normal',
  document_readiness yorso_supplier_document_readiness not null default 'on_request',
  verification_level yorso_supplier_verification_level not null default 'basic',
  hero_image text not null check (char_length(hero_image) between 1 and 260),
  logo_image text check (logo_image is null or char_length(logo_image) <= 260),
  delivery_countries jsonb not null default '[]'::jsonb,
  delivery_countries_total integer not null default 0 check (delivery_countries_total >= 0),
  total_products_count integer not null default 0 check (total_products_count >= 0),
  product_catalog_preview jsonb not null default '[]'::jsonb,
  website text,
  whatsapp text check (whatsapp is null or char_length(whatsapp) between 5 and 80),
  publication_status yorso_supplier_publication_status not null default 'draft',
  product_focus_search text generated always as (lower(product_focus::text)) stored,
  certifications_search text generated always as (lower(array_to_string(certifications, ' '))) stored,
  public_search_text text generated always as (
    lower(masked_name || ' ' || country || ' ' || city || ' ' || supplier_type::text || ' ' || short_description || ' ' || product_focus::text || ' ' || array_to_string(certifications, ' '))
  ) stored,
  private_search_text text generated always as (
    lower(masked_name || ' ' || company_name || ' ' || country || ' ' || city || ' ' || supplier_type::text || ' ' || short_description || ' ' || about || ' ' || product_focus::text || ' ' || array_to_string(certifications, ' '))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint yorso_suppliers_directory_country_code_uppercase check (country_code = upper(country_code)),
  constraint yorso_suppliers_product_focus_array check (jsonb_typeof(product_focus) = 'array'),
  constraint yorso_suppliers_certification_badges_array check (jsonb_typeof(certification_badges) = 'array'),
  constraint yorso_suppliers_delivery_countries_array check (jsonb_typeof(delivery_countries) = 'array'),
  constraint yorso_suppliers_catalog_preview_array check (jsonb_typeof(product_catalog_preview) = 'array')
);

create index if not exists idx_yorso_suppliers_directory_publication_status on yorso_suppliers_directory(publication_status);
create index if not exists idx_yorso_suppliers_directory_country_code on yorso_suppliers_directory(country_code);
create index if not exists idx_yorso_suppliers_directory_supplier_type on yorso_suppliers_directory(supplier_type);
create index if not exists idx_yorso_suppliers_directory_public_search_text on yorso_suppliers_directory using gin (to_tsvector('simple', public_search_text));
create index if not exists idx_yorso_suppliers_directory_private_search_text on yorso_suppliers_directory using gin (to_tsvector('simple', private_search_text));
create index if not exists idx_yorso_suppliers_directory_product_focus_search on yorso_suppliers_directory using gin (to_tsvector('simple', product_focus_search));

comment on table yorso_suppliers_directory is 'Self-hosted supplier directory records for public marketplace discovery. Private identity/contact fields are shaped by API access level before leaving the backend.';
comment on column yorso_suppliers_directory.company_name is 'Private supplier identity. API returns this only for qualified_unlocked access.';
comment on column yorso_suppliers_directory.website is 'Private supplier contact channel. API returns this only for qualified_unlocked access.';
comment on column yorso_suppliers_directory.whatsapp is 'Private supplier contact channel. API returns this only for qualified_unlocked access.';
comment on column yorso_suppliers_directory.public_search_text is 'Search text safe for locked users. It intentionally excludes private supplier identity and contacts.';
comment on column yorso_suppliers_directory.private_search_text is 'Search text for qualified access. It may include private supplier identity and about text.';
