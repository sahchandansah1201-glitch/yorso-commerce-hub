-- YORSO supplier directory pagination and sorting indexes.
-- Batch #53: keep server-side supplier pagination stable for 10,000 concurrent users.

create index if not exists idx_yorso_suppliers_directory_published_updated
  on yorso_suppliers_directory(publication_status, updated_at desc, id asc);

create index if not exists idx_yorso_suppliers_directory_published_country
  on yorso_suppliers_directory(publication_status, country_code, city, id);

create index if not exists idx_yorso_suppliers_directory_published_verification_updated
  on yorso_suppliers_directory(publication_status, verification_level, updated_at desc, id asc);

create index if not exists idx_yorso_suppliers_directory_published_response_updated
  on yorso_suppliers_directory(publication_status, response_signal, updated_at desc, id asc);

comment on index idx_yorso_suppliers_directory_published_updated is
  'Supports default supplier directory pagination by newest published suppliers.';
comment on index idx_yorso_suppliers_directory_published_country is
  'Supports country/city supplier directory sorting without full scans.';
comment on index idx_yorso_suppliers_directory_published_verification_updated is
  'Supports verification-level supplier sorting while preserving stable pagination.';
comment on index idx_yorso_suppliers_directory_published_response_updated is
  'Supports response-signal supplier sorting while preserving stable pagination.';
