-- Backend Phase 4M: supplier document owner management audit.
-- Records supplier owner document create mutations while keeping backend file
-- asset identifiers out of browser-visible mutation responses.

create type yorso_supplier_document_management_action as enum (
  'supplier_document.create',
  'supplier_document.update_metadata',
  'supplier_document.submit_for_review',
  'supplier_document.approve',
  'supplier_document.reject',
  'supplier_document.expire',
  'supplier_document.delete'
);

create type yorso_supplier_document_management_actor_role as enum (
  'supplier_owner',
  'admin'
);

create type yorso_supplier_document_management_status as enum (
  'approved',
  'review',
  'expired',
  'on_request'
);

create table if not exists yorso_supplier_document_management_events (
  id bigserial primary key,
  action yorso_supplier_document_management_action not null,
  actor_role yorso_supplier_document_management_actor_role not null,
  actor_user_id uuid not null references yorso_users(id) on delete restrict,
  supplier_id text not null references yorso_suppliers_directory(id) on delete restrict,
  document_id text not null check (char_length(document_id) between 1 and 80),
  previous_status yorso_supplier_document_management_status,
  next_status yorso_supplier_document_management_status,
  reason text not null check (char_length(reason) between 1 and 160),
  request_id text not null check (char_length(request_id) between 1 and 120),
  created_at timestamptz not null default now(),
  constraint yorso_supplier_document_management_events_create_shape
    check (
      action <> 'supplier_document.create'
      or (actor_role = 'supplier_owner' and previous_status is null and next_status = 'review')
    )
);

create index if not exists idx_yorso_supplier_document_management_events_supplier_recent
  on yorso_supplier_document_management_events (supplier_id, created_at desc, id desc);

create index if not exists idx_yorso_supplier_document_management_events_actor_recent
  on yorso_supplier_document_management_events (actor_user_id, created_at desc, id desc);

create index if not exists idx_yorso_supplier_document_management_events_action_recent
  on yorso_supplier_document_management_events (action, created_at desc, id desc);

create index if not exists idx_yorso_supplier_document_management_events_document_recent
  on yorso_supplier_document_management_events (supplier_id, document_id, created_at desc, id desc);

comment on table yorso_supplier_document_management_events is
  'Self-hosted audit table for supplier document management mutations. Browser responses expose sanitized metadata only, never file asset ids, object keys or storage URLs.';

comment on column yorso_supplier_document_management_events.actor_user_id is
  'Authenticated self-hosted account user that performed the management action.';
