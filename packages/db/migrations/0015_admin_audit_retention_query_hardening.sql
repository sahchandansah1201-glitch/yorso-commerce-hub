-- Batch #91: admin audit retention and high-volume query hardening.
-- Keeps audit read/export paths bounded for the 10,000 concurrent users baseline.

create index if not exists idx_yorso_api_audit_events_route_status_time
  on yorso_api_audit_events(route, status_code, occurred_at desc)
  where route is not null and status_code is not null;

create index if not exists idx_yorso_api_audit_events_outcome_status_time
  on yorso_api_audit_events(outcome, status_code, occurred_at desc)
  where status_code is not null;

create or replace function yorso_purge_api_audit_events(p_before timestamptz)
returns bigint
language plpgsql
as $$
declare
  deleted_count bigint;
begin
  if p_before is null then
    raise exception 'p_before is required';
  end if;

  delete from yorso_api_audit_events
  where occurred_at < p_before;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on function yorso_purge_api_audit_events(timestamptz) is
  'Deletes sanitized API audit events older than the caller-provided retention cutoff. Run from controlled maintenance jobs only.';

comment on index idx_yorso_api_audit_events_route_status_time is
  'Supports admin audit filtering by route plus status code under production-scale audit volume.';

comment on index idx_yorso_api_audit_events_outcome_status_time is
  'Supports admin audit filtering by outcome plus status code under production-scale audit volume.';
