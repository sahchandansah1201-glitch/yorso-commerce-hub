-- Batch #90: self-hosted admin role boundary and audit read/export indexes.
-- Admin audit access is owned by YORSO backend sessions, not by hosted BaaS roles.

create table if not exists yorso_user_roles (
  user_id uuid not null references yorso_users(id) on delete cascade,
  role text not null check (role in ('admin', 'support', 'company_admin', 'buyer', 'supplier')),
  granted_at timestamptz not null default now(),
  granted_by uuid references yorso_users(id) on delete set null,
  primary key (user_id, role)
);

create index if not exists idx_yorso_user_roles_role_user
  on yorso_user_roles(role, user_id);

create index if not exists idx_yorso_api_audit_events_status_time
  on yorso_api_audit_events(status_code, occurred_at desc)
  where status_code is not null;

create index if not exists idx_yorso_api_audit_events_route_time
  on yorso_api_audit_events(route, occurred_at desc)
  where route is not null;

comment on table yorso_user_roles is
  'Self-hosted API role assignments. Admin audit endpoints require the admin role.';

comment on index idx_yorso_api_audit_events_status_time is
  'Supports admin audit filtering by HTTP status at production-scale event volume.';

comment on index idx_yorso_api_audit_events_route_time is
  'Supports admin audit filtering and export by route at production-scale event volume.';
