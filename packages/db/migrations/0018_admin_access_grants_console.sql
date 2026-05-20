-- Batch #97: admin access grants console indexes.
-- The access-grants console must stay bounded at the 10,000 concurrent-user
-- production baseline: admin reads are paginated, revoke writes expire active
-- grant rows in-place, and marketplace reads continue to resolve access through
-- narrow buyer/supplier/scope indexes.

create index if not exists idx_yorso_access_grants_admin_active
  on yorso_access_grants (granted_at desc, id)
  where expires_at is null;

create index if not exists idx_yorso_access_grants_admin_expired
  on yorso_access_grants (expires_at desc, id)
  where expires_at is not null;

create index if not exists idx_yorso_access_grants_admin_buyer_active
  on yorso_access_grants (buyer_user_id, supplier_id, scope, granted_at desc)
  where expires_at is null;

create index if not exists idx_yorso_access_grants_admin_supplier_active
  on yorso_access_grants (supplier_id, buyer_user_id, scope, granted_at desc)
  where expires_at is null;

create index if not exists idx_yorso_access_events_supplier_revoked
  on yorso_access_events (supplier_id, created_at desc)
  where event_type = 'supplier_access_revoked';

comment on index idx_yorso_access_grants_admin_active is
  'Admin access-grants console active-list index for the 10,000 concurrent-user production baseline.';

comment on index idx_yorso_access_grants_admin_expired is
  'Admin access-grants console expired-list index for bounded revoke audits.';
