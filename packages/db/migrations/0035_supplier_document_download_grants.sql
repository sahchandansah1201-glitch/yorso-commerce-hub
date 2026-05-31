-- Backend Phase 4F: supplier document download grant audit.
-- Supplier document download grants are issued only after qualified supplier
-- access is re-checked by the self-hosted API. The supplier profile payload
-- remains metadata-only and must not expose direct file URLs, storage keys or
-- raw asset identifiers.

create type yorso_supplier_document_grant_status as enum (
  'granted',
  'access_denied',
  'document_not_found',
  'document_unavailable'
);

create table if not exists yorso_supplier_document_download_grants (
  id text primary key,
  buyer_user_id uuid not null references yorso_users(id) on delete cascade,
  supplier_id text not null references yorso_suppliers_directory(id) on delete cascade,
  document_id text not null,
  file_asset_id text,
  status yorso_supplier_document_grant_status not null,
  reason text not null default '',
  request_id text not null,
  download_path text,
  granted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint yorso_supplier_document_grants_granted_shape
    check (
      (
        status = 'granted'
        and file_asset_id is not null
        and download_path is not null
        and granted_at is not null
        and expires_at is not null
      )
      or (
        status <> 'granted'
        and download_path is null
        and granted_at is null
        and expires_at is null
      )
    )
);

create index if not exists idx_yorso_supplier_document_grants_buyer_recent
  on yorso_supplier_document_download_grants (buyer_user_id, created_at desc, id asc);

create index if not exists idx_yorso_supplier_document_grants_supplier_recent
  on yorso_supplier_document_download_grants (supplier_id, created_at desc, id asc);

create index if not exists idx_yorso_supplier_document_grants_status_recent
  on yorso_supplier_document_download_grants (status, created_at desc, id asc);

create index if not exists idx_yorso_supplier_document_grants_expires
  on yorso_supplier_document_download_grants (expires_at)
  where status = 'granted';

comment on table yorso_supplier_document_download_grants is
  'Self-hosted audit table for qualified-only supplier document download grant attempts. Stores backend-only file asset references for granted attempts; browser responses must never expose file_asset_id, storage keys or direct file URLs.';

comment on column yorso_supplier_document_download_grants.file_asset_id is
  'Backend-only supplier document file asset reference used after access re-check. It is not returned in supplier profile or grant responses.';
