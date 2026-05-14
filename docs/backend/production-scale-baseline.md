# YORSO Production Scale Baseline

Status: mandatory architecture gate
Batch: #36
Date: 2026-05-14

## Mandatory Target

YORSO production frontend, backend, persistence, queues, integrations and
agent-runtime decisions must be designed for stable operation with at least
10,000 concurrent web users.

This is a design and release gate. It does not claim that the current prototype
already passed a load test. A feature can stay prototype-only, but any feature
described as production-ready must include the capacity review below.

## Meaning Of 10,000 Concurrent Users

The target means 10,000 active users with overlapping sessions across catalog
search, supplier profile reads, account edits, access requests, RFQ flows,
notifications and agent-assisted workflows.

It does not mean 10,000 direct PostgreSQL connections. Browser users must go
through the web/API tier, PgBouncer, cache, queues and bounded data access.

Every production-facing feature must state:

- expected request rate and peak burst multiplier;
- expected read/write ratio;
- hot-path endpoints and cold-path endpoints;
- maximum synchronous request work;
- background job volume;
- timeout budget;
- graceful degradation behavior.

## Required Capacity Review

Every production-facing change must document these points before release
signoff:

| Area | Required answer |
|---|---|
| Read/write profile | Which operations are hot reads, hot writes, rare writes and background tasks? |
| Database strategy | Which indexes, pagination limits, bounded queries and transaction boundaries protect PostgreSQL? |
| Connection strategy | How do API workers avoid unbounded database connections through PgBouncer or equivalent pooling? |
| Cache strategy | Which reads are cacheable, what TTL is acceptable, and how is invalidation handled? |
| Queue/backpressure | Which work leaves the request path, how retries are bounded, and how idempotency is enforced? |
| Runtime scaling | Which processes are stateless, horizontally scalable and safe to restart? |
| Rate limits | Which user, IP, company or token limits prevent abuse and scraping? |
| Failure mode | What does the user see when API, search, queue, storage or analytics is degraded? |
| Observability | Which metrics, structured logs, traces and alerts prove the feature is healthy? |
| Load test | Which scenario validates the feature before production rollout? |

## Baseline Architecture Rules

For the self-hosted YORSO product:

- Frontend must not talk directly to PostgreSQL.
- Public pages and account UI must use typed API adapters.
- API workers must be stateless and horizontally scalable.
- PostgreSQL must sit behind PgBouncer or equivalent pooling.
- High-volume list/search endpoints must be indexed, paginated and bounded.
- Search-heavy marketplace discovery must not depend on unindexed table scans.
- Media and documents must live in object storage, not app container disks.
- Long-running imports, emails, notifications, reports and agent work must run
  in workers, not inside HTTP request handlers.
- Access-control-sensitive fields must be shaped by the API before reaching
  the frontend.
- Supabase may remain as prototype/reference tooling, not as production
  backend architecture.

## Current Repository Enforcement

The baseline is enforced by:

```bash
npm run check:production-scale-baseline
npm run ci:core
```

The guard verifies that backend architecture docs, validation docs, package
scripts, DB scaling migration and supplier-directory read path keep the
10,000-concurrent-user requirement visible and testable.

Batch #35 introduced the first concrete high-concurrency read-path work:

- `packages/db/migrations/0005_supplier_directory_search_scaling.sql`;
- `packages/db/migrations/0006_offer_catalog.sql`;
- `packages/db/migrations/0007_supplier_access_flow.sql`;
- trigram GIN indexes for supplier and offer search fields;
- verification-level index for supplier filters;
- supplier-access request, grant and notification indexes;
- frontend supplier directory and offer catalog API bridges with pagination.
- self-hosted offer detail smoke for the bounded `/v1/offers/:id` read path,
  locked/unlocked access shaping, not-found, method and validation guards.

Batch #36 promotes the target from a supplier-directory note to a project-level
release gate.

Batch #44 hardens the offer detail access path against prototype-only unlocks:

- `/v1/offers/:id?accessLevel=qualified_unlocked` does not reveal exact price
  or supplier identity unless the current account has a self-hosted
  supplier-access grant.
- The frontend offer catalog adapter sends account-session headers to the API
  so access shaping can be evaluated server-side.
- The supplier access frontend bridge clears stale local approvals when the
  self-hosted API is configured and reports no active request or grant.
- The self-hosted offer detail smoke now includes
  `offer_detail_requires_grant=ok`, proving that a query parameter alone cannot
  bypass the access model.

Batch #45 applies the same server-side grant gate to supplier profiles:

- `/v1/suppliers/:id?accessLevel=qualified_unlocked` downgrades to
  `registered_locked` unless the current account has an approved
  supplier-access grant.
- Supplier directory API requests carry account-session headers when the
  self-hosted API is configured.
- Runtime smoke markers `supplier_directory_requires_grant=ok` and
  `supplier_directory_unlocked=ok` prove that supplier identity unlocks only
  after approval.

Batch #46 adds the production rule for private supplier-name search at list
scale. The API must first load the buyer's active `supplier_identity` grants and
only then include private search text for those supplier IDs. This avoids a
global company-name search path while keeping approved buyer workflows fast. The
required smoke markers are `supplier_directory_private_search_requires_grant=ok`,
`supplier_directory_granted_private_search=ok` and
`supplier_directory_ungranted_private_search_guard=ok`.

Batch #47 applies the same rule to the offer catalog. `/v1/offers` must use the
active supplier grant set for both list response shaping and private supplier
search. This avoids global `qualified_unlocked` scans and keeps the 10,000
concurrent-user path bounded by PostgreSQL indexes and per-request grant sets.
The required smoke markers are `offer_catalog_private_search_requires_grant=ok`,
`offer_catalog_list_requires_grant=ok`,
`offer_catalog_granted_private_search=ok` and
`offer_catalog_ungranted_private_search_guard=ok`.

Batch #48 hardens the buyer approval-notification bridge for scale. The local
mock approval ticker may stay fast because it does not touch the network, but
self-hosted `/v1/access/notifications` polling must be bounded. The frontend
uses `BACKEND_NOTIFICATION_POLL_MS = 60_000`, prevents overlapping sync calls,
and also syncs once when a hidden tab becomes visible. This avoids creating a
2-second polling path that would generate unnecessary backend traffic at 10,000
concurrent users.

Batch #49 closes the backend acknowledgement loop for access notifications.
After the frontend applies a `price_access_approved` notification, it calls
`PATCH /v1/access/notifications` with the processed notification IDs. The API
marks those rows as `read` and writes a `notification_read` audit event. This
keeps the unread feed small, reduces repeated notification payloads at scale and
preserves an auditable buyer-side acknowledgement trail.

## Release Rule

If a change affects production frontend, backend, persistence, queues,
integrations or runtime behavior, release signoff must either:

1. reference a capacity review against this document; or
2. explicitly mark the change as prototype-only.

If neither is true, the change is not production-ready.
