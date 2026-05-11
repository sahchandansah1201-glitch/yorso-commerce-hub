# Lovable Suggestions Backlog

Status: active triage log
Primary audience: Codex, Lovable, backend implementers
Related documents:

- `docs/backend/access-control-matrix.md`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/yorso-backend-implementation-plan.md`

## Purpose

Lovable often suggests follow-up implementation work after a sync or test run.
Those suggestions are useful, but they must be triaged before implementation.

Default rule:

- implement immediately only when the suggestion is small, testable and supports
  the current access/security contract;
- add to backlog when it is useful but not blocking;
- defer to backend phase when it requires real database, RLS, API or storage;
- reject when it expands scope without improving YORSO's core buyer/supplier
  workflow.

## Current Suggestions

| ID | Suggestion | Decision | Status | Why |
|---|---|---|---|---|
| LVB-001 | Check SupplierProfile SSR leaks | Implemented | Done in PR #8 | Prevents server/head/HTML leakage of locked supplier data. |
| LVB-002 | Expand locked DOM tests | Implemented | Done in PR #8 | Strengthens the frontend access contract before backend exists. |
| LVB-003 | Add e2e access check | Implemented | Done in current PR | Browser-level tests verify anonymous, registered, qualified and downgrade flows in the real app shell. |
| LVB-004 | Protect access at API level | Backend foundation started | Backend P0 in progress | Access grant/request/event tables and helper functions are scaffolded, but frontend adapters still need migration to backend APIs. |

## Done: E2E Access Check

Goal:

- verify access behavior in the running application, not only in jsdom tests.

Implemented scope:

- route: `/suppliers/:supplierId`;
- states: `anonymous_locked`, `registered_locked`, `qualified_unlocked`;
- transition: `qualified_unlocked` back to `registered_locked`;
- assertions:
  - locked states do not show real company name, website, WhatsApp, legal data,
    exact active offer count or ItemList JSON-LD;
  - locked states do show public production capability facts and public
    trade/logistics terms;
  - qualified state shows real supplier identity and contact actions;
  - downgrade removes stale real identity and ItemList JSON-LD from `<head>`.

Implementation:

- Playwright test: `e2e/supplier-profile-access.spec.ts`;
- Playwright config now uses `/bin/chromium` only when it exists, otherwise it
  falls back to the bundled Playwright browser.

Acceptance:

- test can run locally without Lovable rewriting code;
- test fails if locked data appears in visible DOM, head metadata or JSON-LD;
- test is documented in the PR body.

## Backend P0: API-Level Access Protection

Goal:

- move access enforcement from frontend mock behavior to backend source of
  truth.

Required backend pieces:

- `suppliers_public`, `suppliers_registered`, `suppliers_qualified`,
  `suppliers_owner`;
- `offers_public`, `offers_registered`, `offers_qualified`, `offers_owner`;
- `supplier_access_requests`, `price_access_requests`, `access_grants`,
  `access_events`;
- helper functions:
  - `has_supplier_access(user_id, supplier_id)`;
  - `has_offer_price_access(user_id, offer_id)`;
  - `has_document_access(user_id, document_id)`.

Acceptance:

- locked API responses do not contain restricted supplier values;
- qualified API responses include only grant-scoped data;
- RLS tests cover public, registered, qualified, supplier owner and admin cases;
- frontend no longer receives raw restricted data for locked states.

Current foundation:

- migration: `supabase/migrations/20260511130000_backend_access_foundation.sql`;
- tables: `supplier_access_requests`, `access_grants`, `access_events`;
- helpers: `has_supplier_access(user_id, supplier_id)`,
  `has_offer_price_access(user_id, offer_id)`;
- direct anonymous reads from base `offers` and `suppliers` are revoked, while
  safe public views remain readable.

Remaining work:

- continue expanding backend-facing adapters beyond the Supplier Access Flow;
- add RLS regression tests against a real Supabase test database;
- migrate remaining frontend access state from localStorage/sessionStorage to
  backend request/grant status.

Adapter progress:

- `src/lib/supplier-access-api.ts` now bridges Supplier Access Flow to
  `supplier_access_requests` when a Supabase auth user exists;
- the same adapter falls back to the existing local mock flow when backend auth
  is unavailable, preserving the Lovable preview/prototype behavior.

## Triage Rule For Future Lovable Suggestions

Every future suggestion should be classified as one of:

- `Done`: already implemented and verified;
- `P1`: implement soon because it guards trust, access or conversion flow;
- `P2`: useful improvement, not blocking;
- `Backend P0`: required when backend implementation starts;
- `Rejected`: scope creep, duplicate or conflicts with Project Knowledge.
