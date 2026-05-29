-- Backend Phase 4B: supplier profile dossier facts.
-- Published production/logistics capability facts belong to the self-hosted
-- supplier directory record, not to frontend hash-based synthesis.

alter table yorso_suppliers_directory
  add column if not exists production_facts jsonb not null default jsonb_build_object(
    'dailyTons', 0,
    'lines', 0,
    'coldStorageT', 0,
    'blastFreezerT', 0,
    'staff', 0
  ),
  add column if not exists logistics_facts jsonb not null default jsonb_build_object(
    'incoterms', jsonb_build_array('FCA'),
    'transitDaysMin', 0,
    'transitDaysMax', 0,
    'minBatchTons', 0,
    'containers', jsonb_build_array('TBC'),
    'tempRange', 'TBC'
  );

alter table yorso_suppliers_directory
  add constraint yorso_suppliers_production_facts_object
    check (jsonb_typeof(production_facts) = 'object'),
  add constraint yorso_suppliers_logistics_facts_object
    check (jsonb_typeof(logistics_facts) = 'object'),
  add constraint yorso_suppliers_logistics_incoterms_array
    check (jsonb_typeof(logistics_facts -> 'incoterms') = 'array'),
  add constraint yorso_suppliers_logistics_containers_array
    check (jsonb_typeof(logistics_facts -> 'containers') = 'array');

comment on column yorso_suppliers_directory.production_facts is
  'Published supplier production capability facts rendered on supplier profiles. API-owned and safe for locked buyer views.';

comment on column yorso_suppliers_directory.logistics_facts is
  'Published supplier logistics and delivery facts rendered on supplier profiles. API-owned and safe for locked buyer views.';
