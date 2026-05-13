-- YORSO self-hosted PostgreSQL migration registry.
-- Tracks schema files applied by the YORSO-owned backend deployment.

create table if not exists _yorso_migrations (
  id text primary key,
  checksum text not null check (char_length(checksum) = 64),
  applied_at timestamptz not null default now(),
  execution_ms integer check (execution_ms is null or execution_ms >= 0),
  applied_by text not null default 'yorso-migrator' check (char_length(applied_by) between 1 and 120)
);

create index if not exists idx_yorso_migrations_applied_at on _yorso_migrations(applied_at);

comment on table _yorso_migrations is 'Self-hosted YORSO schema migration registry.';
comment on column _yorso_migrations.checksum is 'SHA-256 checksum of the SQL file applied for this migration.';
