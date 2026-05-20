-- Batch #92: bounded admin audit retention runtime.
-- Adds a batch purge helper for safe maintenance under the 10,000 concurrent users baseline.

create index if not exists idx_yorso_api_audit_events_retention_scan
  on yorso_api_audit_events(occurred_at asc, audit_id asc);

create or replace function yorso_purge_api_audit_events_batch(
  p_before timestamptz,
  p_limit integer default 1000
)
returns bigint
language plpgsql
as $$
declare
  deleted_count bigint;
begin
  if p_before is null then
    raise exception 'p_before is required';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 5000 then
    raise exception 'p_limit must be between 1 and 5000';
  end if;

  with victims as (
    select audit_id
    from yorso_api_audit_events
    where occurred_at < p_before
    order by occurred_at asc, audit_id asc
    limit p_limit
  )
  delete from yorso_api_audit_events events
  using victims
  where events.audit_id = victims.audit_id;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on function yorso_purge_api_audit_events_batch(timestamptz, integer) is
  'Deletes sanitized API audit events in bounded batches so retention jobs do not monopolize PostgreSQL during high-concurrency traffic.';

comment on index idx_yorso_api_audit_events_retention_scan is
  'Supports ordered batch retention scans for sanitized API audit events.';
