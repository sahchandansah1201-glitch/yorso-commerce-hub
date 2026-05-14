-- YORSO self-hosted supplier and price access flow.
-- Batch #38: backend-owned request/status/grant/notification path.

create type yorso_supplier_access_status as enum (
  'sent',
  'pending',
  'approved',
  'rejected',
  'revoked'
);

create type yorso_supplier_access_intent as enum ('exact_price');

create type yorso_access_grant_scope as enum (
  'supplier_identity',
  'offer_price'
);

create type yorso_access_event_type as enum (
  'supplier_access_requested',
  'supplier_access_pending',
  'supplier_access_approved',
  'supplier_access_rejected',
  'supplier_access_revoked',
  'notification_created'
);

create type yorso_access_notification_type as enum ('price_access_approved');
create type yorso_access_notification_status as enum ('unread', 'read');

create table if not exists yorso_supplier_access_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references yorso_users(id) on delete cascade,
  supplier_id text not null references yorso_suppliers_directory(id) on delete cascade,
  status yorso_supplier_access_status not null default 'sent',
  intent yorso_supplier_access_intent not null default 'exact_price',
  message text not null default '' check (char_length(message) <= 1000),
  decided_at timestamptz,
  decided_by_user_id uuid references yorso_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_user_id, supplier_id)
);

create table if not exists yorso_access_grants (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references yorso_users(id) on delete cascade,
  supplier_id text not null references yorso_suppliers_directory(id) on delete cascade,
  scope yorso_access_grant_scope not null,
  offer_id text references yorso_offers_catalog(id) on delete cascade,
  offer_id_key text generated always as (coalesce(offer_id, '')) stored,
  granted_by_user_id uuid references yorso_users(id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_user_id, supplier_id, scope, offer_id_key),
  constraint yorso_access_grants_expiry_after_grant check (expires_at is null or expires_at > granted_at)
);

create table if not exists yorso_access_events (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references yorso_users(id) on delete cascade,
  supplier_id text not null references yorso_suppliers_directory(id) on delete cascade,
  request_id uuid references yorso_supplier_access_requests(id) on delete set null,
  event_type yorso_access_event_type not null,
  actor_user_id uuid references yorso_users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint yorso_access_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists yorso_access_notifications (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references yorso_users(id) on delete cascade,
  supplier_id text not null references yorso_suppliers_directory(id) on delete cascade,
  type yorso_access_notification_type not null,
  title text not null check (char_length(title) between 1 and 180),
  body text not null check (char_length(body) between 1 and 320),
  status yorso_access_notification_status not null default 'unread',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_yorso_supplier_access_requests_buyer
  on yorso_supplier_access_requests(buyer_user_id, updated_at desc);

create index if not exists idx_yorso_supplier_access_requests_supplier_status
  on yorso_supplier_access_requests(supplier_id, status, updated_at desc);

create index if not exists idx_yorso_access_grants_buyer_supplier_scope
  on yorso_access_grants(buyer_user_id, supplier_id, scope)
  where expires_at is null;

create index if not exists idx_yorso_access_grants_offer_scope
  on yorso_access_grants(offer_id, scope)
  where offer_id is not null;

create index if not exists idx_yorso_access_events_buyer_created
  on yorso_access_events(buyer_user_id, created_at desc);

create index if not exists idx_yorso_access_events_supplier_created
  on yorso_access_events(supplier_id, created_at desc);

create index if not exists idx_yorso_access_notifications_buyer_status_created
  on yorso_access_notifications(buyer_user_id, status, created_at desc);

comment on table yorso_supplier_access_requests is
  'Self-hosted one-click buyer requests for supplier identity and exact price access.';
comment on table yorso_access_grants is
  'Access grants that unlock supplier identity and exact offer prices for a buyer.';
comment on table yorso_access_events is
  'Append-only audit trail for supplier and price access decisions.';
comment on table yorso_access_notifications is
  'Buyer notifications created by access decisions, including price access approved.';
comment on index idx_yorso_supplier_access_requests_buyer is
  'Buyer request lookup path for profile and supplier pages under concurrent traffic.';
comment on index idx_yorso_supplier_access_requests_supplier_status is
  'Supplier-side review queue lookup path for pending access decisions.';
comment on index idx_yorso_access_grants_buyer_supplier_scope is
  'Hot-path access check for supplier identity and price unlock.';
comment on index idx_yorso_access_notifications_buyer_status_created is
  'Buyer notification feed lookup path after supplier approval.';
