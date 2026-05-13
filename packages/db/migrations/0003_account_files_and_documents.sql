-- YORSO self-hosted file assets and company documents.
-- Stores file metadata in PostgreSQL while binary content lives in self-hosted object storage.

create type yorso_account_file_purpose as enum (
  'company_logo',
  'company_cover',
  'company_document',
  'supplier_certificate',
  'supplier_trade_document'
);

create type yorso_company_document_type as enum (
  'business_license',
  'facility_approval',
  'haccp',
  'msc',
  'asc',
  'brc',
  'ifs',
  'health_certificate',
  'origin_certificate',
  'packing_list',
  'other'
);

create type yorso_company_document_visibility as enum (
  'private',
  'buyer_qualified',
  'public_teaser'
);

create type yorso_company_document_status as enum (
  'draft',
  'uploaded',
  'review',
  'approved',
  'rejected',
  'expired'
);

create table if not exists yorso_file_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references yorso_users(id) on delete restrict,
  company_id uuid references yorso_companies(id) on delete cascade,
  purpose yorso_account_file_purpose not null,
  object_key text not null unique check (char_length(object_key) between 1 and 500),
  original_file_name text not null check (char_length(original_file_name) between 1 and 180),
  content_type text not null check (char_length(content_type) between 3 and 120),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 8388608),
  checksum_sha256 char(64) not null check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  storage_driver text not null default 'local' check (storage_driver in ('local', 's3')),
  created_at timestamptz not null default now()
);

create table if not exists yorso_company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references yorso_companies(id) on delete cascade,
  file_asset_id uuid not null unique references yorso_file_assets(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 180),
  document_type yorso_company_document_type not null,
  visibility yorso_company_document_visibility not null default 'private',
  status yorso_company_document_status not null default 'uploaded',
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_yorso_file_assets_owner_user_id on yorso_file_assets(owner_user_id);
create index if not exists idx_yorso_file_assets_company_id on yorso_file_assets(company_id);
create index if not exists idx_yorso_file_assets_purpose on yorso_file_assets(purpose);
create index if not exists idx_yorso_company_documents_company_id on yorso_company_documents(company_id);
create index if not exists idx_yorso_company_documents_document_type on yorso_company_documents(document_type);
create index if not exists idx_yorso_company_documents_visibility on yorso_company_documents(visibility);
create index if not exists idx_yorso_company_documents_status on yorso_company_documents(status);

comment on table yorso_file_assets is 'Self-hosted file metadata for account media, supplier documents and future offer files.';
comment on table yorso_company_documents is 'Self-hosted company document records linked to file assets and supplier profile access rules.';
