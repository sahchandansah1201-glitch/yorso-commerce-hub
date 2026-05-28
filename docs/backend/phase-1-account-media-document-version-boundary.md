# Backend Phase 1E: Account Media/Document Version Boundary

Status: implemented locally, validation passed.

Date: 2026-05-28

## Scope

Phase 1E closes the account storage boundary left explicit after Phase 1D.

Phase 1A made API-enabled `/account/*` wait for backend session authority.
Phase 1B made normal account edits section-scoped. Phase 1C added account
snapshot versions. Phase 1D made production strict mode reject account writes
without `x-yorso-account-version`.

Phase 1E extends that same account-version contract to account-owned storage
mutations:

- `POST /v1/account/company/media/logo`;
- `POST /v1/account/company/media/cover`;
- `GET /v1/account/documents`;
- `POST /v1/account/documents`.

This is not a public UX batch, not a new media pipeline and not a supplier
access change.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Shared precondition helper | Account and storage routes must use one header/precondition contract. | Added `apps/api/src/modules/account/version-precondition.ts`; account routes and storage routes use the same `x-yorso-account-version` reader and strict-mode check. | Keep future account write routes on the same helper. | API server tests and typecheck. |
| Storage strict mode | Media/document POST routes must reject missing version headers when strict mode is required. | `handleStorageRoute` accepts `versionPreconditionMode`; strict POST without header returns `428 account_version_required`. | Future document update/delete routes must use the same guard. | `requires account version headers for media and document mutations in strict precondition mode`. |
| Storage stale protection | Media/document POST routes must reject stale headers instead of writing over newer account state. | Storage POST routes call `accountService.assertAccountVersion`; stale media upload after a document mutation returns `409 account_snapshot_conflict`. | Add the same behavior to future document status/visibility updates. | API server test covers stale media upload after document create. |
| Account version propagation | Storage JSON responses should carry the refreshed account version. | Document list/create and media upload responses now include `accountVersion`; frontend account API already remembers it through the shared request helper. | Future account storage responses should keep returning `accountVersion`. | `src/lib/account-api.test.ts` checks document create sends the version learned from document list. |
| Snapshot source | Document/file metadata must participate in backend account snapshot version. | PostgreSQL version query includes `yorso_file_assets.created_at` and `yorso_company_documents.updated_at`; memory repository exposes `touchAccountVersion` for storage mutations. | If storage becomes multi-step/async, move this into a transaction/outbox boundary. | Account repository/server tests. |
| Safeguards | Phase 1A-1D and public safeguards #110-#141 must stay intact. | Public routes, access gating, supplier identity redaction, exact-price locks, Batch #112 code splitting and Batch #113 route boundary were not changed. | Lovable sync can happen as one backend Phase 1 package if requested. | Full validation gates before commit. |

## Implementation Notes

- Header name remains `x-yorso-account-version`.
- Missing strict precondition:
  - HTTP status: `428`;
  - error code: `account_version_required`.
- Stale precondition:
  - HTTP status: `409`;
  - error code: `account_snapshot_conflict`.
- Read-only file streaming routes remain outside JSON account version payloads:
  - `/v1/account/files/:assetId`;
  - `/v1/account/files/by-object-key`.
- Document list is read-only but now returns `accountVersion` so the frontend
  can learn the current account snapshot before creating a document.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No public catalog or supplier access traffic is added.
- `GET /v1/account/documents` adds one account-version lookup to its bounded
  company document list.
- `POST /v1/account/documents` adds one version precondition lookup before
  upload metadata creation and one response version lookup after success.
- `POST /v1/account/company/media/:slot` adds the same precondition/response
  version lookups around the existing file asset + company media update path.
- Missing-header strict requests fail before body parsing and do not create
  storage metadata.

Cache, queue and backpressure strategy:

- No new queue, polling or retry loop is introduced.
- Existing JSON body/upload size limits remain the upload backpressure
  boundary.
- Existing auth/session cache remains the account authority boundary.
- Object storage writes remain synchronous for this phase.

Database indexing and pagination strategy:

- No new pagination surface is introduced.
- Existing document listing remains company-scoped.
- Version query now includes:
  - `yorso_file_assets.created_at`;
  - `yorso_company_documents.updated_at`.
- Existing indexes required for 10,000 concurrent users:
  - `idx_yorso_file_assets_company_id`;
  - `idx_yorso_company_documents_company_id`;
  - Phase 1C ownership indexes on company/workspace/notification tables.

Failure mode and graceful degradation:

- Strict production clients without version headers receive
  `428 account_version_required`.
- Stale media/document mutations receive `409 account_snapshot_conflict`.
- Current frontend already sends the version learned from account/document
  responses through the shared account API request helper.
- If file metadata creation succeeds but a later company/media touch fails, the
  current synchronous route still returns an error. A future media pipeline can
  move this into a transactional metadata boundary or outbox.

Observability and load-test plan:

- Track `428 account_version_required` and `409 account_snapshot_conflict` on
  storage account routes separately from normal account profile routes.
- Track upload route p95/p99 latency, body-size distribution, version lookup
  latency and object storage write latency.
- Load-test 10,000 concurrent users with:
  - document list;
  - document upload with valid precondition;
  - media upload with valid precondition;
  - missing-header upload;
  - stale-header upload after another account mutation.

## Validation

Validated locally on 2026-05-28:

- `npm run contracts:build`;
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts`
  - 2 files passed;
  - 80 tests passed;
- `npx vitest run src/lib/account-api.test.ts src/pages/account/Account.editable.test.tsx`;
  - 2 files passed;
  - 37 tests passed;
- `npx tsc -b --noEmit`;
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Focused account API adapter check:

- `npx vitest run src/lib/account-api.test.ts`
  - 1 file passed;
  - 16 tests passed.

Production build metric:

- Account route chunk `Account-qLSbC0qo.js` 112.83 kB / 25.65 kB gzip.

Known non-blocking warnings to preserve:

- Supabase generated types out of sync in non-strict mode;
- Browserslist data stale;
- existing React Router / `act(...)` warnings in legacy frontend tests.
