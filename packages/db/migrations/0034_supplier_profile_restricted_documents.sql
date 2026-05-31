-- Backend Phase 4E: supplier profile restricted document payload.
-- Restricted supplier document metadata belongs to the self-hosted supplier
-- directory record and is only returned for qualified_unlocked buyers.
-- Locked buyer responses must contain null and no file names, asset ids,
-- URLs or document payloads.

alter table yorso_suppliers_directory
  add column if not exists supplier_documents jsonb not null default '[]'::jsonb;

alter table yorso_suppliers_directory
  add constraint yorso_suppliers_supplier_documents_array
    check (jsonb_typeof(supplier_documents) = 'array');

comment on column yorso_suppliers_directory.supplier_documents is
  'Restricted supplier document payload metadata rendered only after qualified_unlocked access. API-owned; locked buyer responses must contain null and no file names, asset ids, URLs or document payloads.';
