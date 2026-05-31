-- Backend Phase 4D: supplier profile legal/compliance details.
-- Restricted legal/compliance facts belong to the self-hosted supplier
-- directory record and are only returned for qualified_unlocked buyers.

alter table yorso_suppliers_directory
  add column if not exists legal_details jsonb;

alter table yorso_suppliers_directory
  add constraint yorso_suppliers_legal_details_object_or_null
    check (legal_details is null or jsonb_typeof(legal_details) = 'object');

comment on column yorso_suppliers_directory.legal_details is
  'Restricted supplier legal/compliance details rendered only after qualified_unlocked access. API-owned; not safe for locked buyer views.';
