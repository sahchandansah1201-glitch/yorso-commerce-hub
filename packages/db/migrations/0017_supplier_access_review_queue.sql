-- Batch #96: supplier access review queue indexes.
-- Supports low-latency operator review of buyer access requests under the
-- 10,000 concurrent-user production baseline without scanning the request log.

create index if not exists idx_yorso_supplier_access_requests_review_open
  on yorso_supplier_access_requests(status, updated_at desc, id)
  where status in ('sent', 'pending');

create index if not exists idx_yorso_supplier_access_requests_review_all
  on yorso_supplier_access_requests(updated_at desc, id);

create index if not exists idx_yorso_supplier_access_requests_review_buyer
  on yorso_supplier_access_requests(buyer_user_id, status, updated_at desc);

comment on index idx_yorso_supplier_access_requests_review_open is
  'Hot-path operator queue for sent/pending supplier access requests.';
comment on index idx_yorso_supplier_access_requests_review_all is
  'Stable pagination path for the access review console history view.';
comment on index idx_yorso_supplier_access_requests_review_buyer is
  'Buyer-scoped request lookup path for operator review and support flows.';
