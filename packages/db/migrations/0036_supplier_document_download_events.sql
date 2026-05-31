-- Backend Phase 4G: supplier document download consumption audit.
-- Records file-serving attempts after a short-lived supplier document grant is
-- presented. Browser responses must never expose file_asset_id, object keys or
-- direct storage URLs.

create type yorso_supplier_document_download_status as enum (
  'downloaded',
  'grant_not_found',
  'grant_denied',
  'grant_expired',
  'access_denied',
  'document_unavailable',
  'file_unavailable'
);

create table if not exists yorso_supplier_document_download_events (
  id text primary key,
  buyer_user_id uuid not null references yorso_users(id) on delete restrict,
  supplier_id text not null references yorso_suppliers_directory(id) on delete restrict,
  document_id text not null check (char_length(document_id) between 1 and 80),
  grant_id text,
  file_asset_id text,
  status yorso_supplier_document_download_status not null,
  reason text not null check (char_length(reason) between 1 and 120),
  request_id text not null check (char_length(request_id) between 1 and 120),
  created_at timestamptz not null default now(),
  constraint yorso_supplier_document_download_events_success_shape
    check (
      status <> 'downloaded'
      or (grant_id is not null and file_asset_id is not null)
    )
);

create index if not exists idx_yorso_supplier_document_download_events_buyer_recent
  on yorso_supplier_document_download_events (buyer_user_id, created_at desc, id asc);

create index if not exists idx_yorso_supplier_document_download_events_supplier_recent
  on yorso_supplier_document_download_events (supplier_id, created_at desc, id asc);

create index if not exists idx_yorso_supplier_document_download_events_grant_recent
  on yorso_supplier_document_download_events (grant_id, created_at desc, id asc)
  where grant_id is not null;

create index if not exists idx_yorso_supplier_document_download_events_status_recent
  on yorso_supplier_document_download_events (status, created_at desc, id asc);

comment on table yorso_supplier_document_download_events is
  'Self-hosted audit table for supplier document download serving attempts. Records consumption status without exposing file_asset_id, object keys or direct storage URLs to browser responses.';

comment on column yorso_supplier_document_download_events.file_asset_id is
  'Backend-only file asset reference copied from the validated grant for audit and operator forensics; never returned to browser clients.';
