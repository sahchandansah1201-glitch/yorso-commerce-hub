-- YORSO supplier directory search scaling.
-- Batch #35: keep directory reads index-backed for high-concurrency catalog traffic.

create extension if not exists pg_trgm;

drop index if exists idx_yorso_suppliers_directory_public_search_text;
drop index if exists idx_yorso_suppliers_directory_private_search_text;
drop index if exists idx_yorso_suppliers_directory_product_focus_search;

create index if not exists idx_yorso_suppliers_directory_public_search_text
  on yorso_suppliers_directory using gin (public_search_text gin_trgm_ops);

create index if not exists idx_yorso_suppliers_directory_private_search_text
  on yorso_suppliers_directory using gin (private_search_text gin_trgm_ops);

create index if not exists idx_yorso_suppliers_directory_product_focus_search
  on yorso_suppliers_directory using gin (product_focus_search gin_trgm_ops);

create index if not exists idx_yorso_suppliers_directory_certifications_search
  on yorso_suppliers_directory using gin (certifications_search gin_trgm_ops);

create index if not exists idx_yorso_suppliers_directory_verification_level
  on yorso_suppliers_directory(verification_level);

comment on index idx_yorso_suppliers_directory_public_search_text is
  'Trigram index for locked supplier directory search. Supports debounced frontend search without exposing private identity.';
comment on index idx_yorso_suppliers_directory_private_search_text is
  'Trigram index for qualified supplier directory search. May match private identity only after backend access shaping.';
comment on index idx_yorso_suppliers_directory_verification_level is
  'Supports fast certified supplier filtering without scanning the supplier directory.';
