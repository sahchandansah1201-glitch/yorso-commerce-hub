-- Backend Phase 4C: supplier profile evidence blocks.
-- Published shipment evidence and profile FAQ blocks belong to the
-- self-hosted supplier directory record, not to frontend hash-based synthesis.

alter table yorso_suppliers_directory
  add column if not exists shipment_cases jsonb not null default '[]'::jsonb,
  add column if not exists profile_faq_items jsonb not null default '[]'::jsonb;

alter table yorso_suppliers_directory
  add constraint yorso_suppliers_shipment_cases_array
    check (jsonb_typeof(shipment_cases) = 'array'),
  add constraint yorso_suppliers_profile_faq_items_array
    check (jsonb_typeof(profile_faq_items) = 'array');

comment on column yorso_suppliers_directory.shipment_cases is
  'Published supplier shipment evidence blocks rendered on supplier profiles. API-owned and safe for locked buyer views.';

comment on column yorso_suppliers_directory.profile_faq_items is
  'Published supplier profile FAQ blocks rendered on supplier profiles. API-owned and safe for locked buyer views.';
