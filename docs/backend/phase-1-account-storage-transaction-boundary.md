# Backend Phase 1G: Account Storage Transaction Boundary

Status: implemented locally, full validation passed.

Date: 2026-05-28

## Scope

Phase 1G closes the storage consistency decision left explicit after Phase 1E.

Phase 1E made account-owned media/document routes participate in
`accountVersion`. Phase 1F made the frontend storage client session-bound.
Phase 1G keeps the storage pipeline synchronous and adds a transactional
metadata boundary for document uploads instead of introducing an outbox queue.

This is not a public UX batch, not a document review/scanning pipeline and not
a new object-storage driver.

## Plan / Fact

| Пункт плана | Что должно быть реализовано | Факт реализации | Что дальше | Проверка |
|---|---|---|---|---|
| Transactional document metadata | `yorso_file_assets` and `yorso_company_documents` for document uploads must not be written as two independent PostgreSQL operations. | `PostgresFileRepository.createCompanyDocumentWithFileAsset` writes both rows with one CTE statement: `inserted_asset` + `inserted_document`. | If document scanning/review becomes async, add an explicit outbox table for processing jobs. | `storage.test.ts` asserts one SQL statement contains both inserts. |
| Object cleanup on metadata failure | If object bytes are written but metadata creation fails, local object bytes must not be left behind silently. | `FileService.storeAccountFile` and `createCompanyDocument` delete the object key when metadata persistence fails. | Add durable cleanup observability if a non-local storage driver is introduced. | `storage.test.ts` asserts `deleteObject` is called after document metadata failure. |
| Media upload compensation | If company media metadata is written but company profile update fails, the uploaded asset should be cleaned up. | Media upload route catches `updateCompanyProfile` failure and calls `deleteAccountFile` for the newly created asset before returning the original error. | A future cross-repository transaction can replace compensation if account and storage repositories share a unit of work. | API storage/server targeted tests pass. |
| Outbox decision | Do not add a runtime queue without an async processing worker, retry policy and operator surface. | Phase 1G records the decision: synchronous uploads use transaction/compensation now; outbox is deferred until virus scanning, document review or external object storage retry semantics exist. | Revisit when storage processing becomes asynchronous. | This document and production-scale baseline. |
| Safeguards | Phase 1A-1F and public safeguards #110-#141 must stay intact. | No public route, supplier redaction, exact-price lock, Batch #112 code-splitting or Batch #113 route boundary code changed. | Keep validation gates before checkpoint commit. | Targeted API/storage tests and typecheck passed. |

## Implementation Notes

- `ObjectStorage` now exposes `deleteObject`.
- `LocalObjectStorage.deleteObject` removes both the file and metadata sidecar.
- `FileRepository` now exposes:
  - `createCompanyDocumentWithFileAsset`;
  - `deleteFileAssetForUser`.
- PostgreSQL document upload metadata uses one atomic SQL statement instead of
  two separate repository calls.
- Memory repository mirrors the same contract for local/test runtime.
- No outbox table is added in Phase 1G because current uploads do not create an
  async processing job. Adding an outbox before a worker/consumer exists would
  create durable state with no owner.

## 10,000 Concurrent-User Review

Expected read/write profile:

- No public traffic is added.
- Document upload keeps one object write and one metadata write path.
- PostgreSQL document metadata changes from two sequential insert calls to one
  atomic CTE statement.
- Media upload adds a cleanup call only on failure after file asset creation.
- Normal successful media/document request volume is unchanged.

Cache, queue and backpressure strategy:

- No queue, polling or retry loop is introduced.
- Upload body-size limits remain the first backpressure boundary.
- Existing auth/session cache and account-version precondition remain the
  account authority boundary.
- Outbox is intentionally deferred until there is an async worker, retry budget
  and operator status surface.

Database indexing and pagination strategy:

- No migration, index or pagination surface is introduced.
- Document list remains company-scoped.
- The atomic document metadata write uses existing primary/foreign keys and
  existing indexes:
  - `idx_yorso_file_assets_owner_user_id`;
  - `idx_yorso_file_assets_company_id`;
  - `idx_yorso_company_documents_company_id`.

Failure mode and graceful degradation:

- If metadata persistence fails after object write, the object key is deleted.
- If company media profile update fails after asset creation, the asset and
  object are cleaned up best-effort and the original route error is preserved.
- If cleanup itself fails, the route still fails closed; a future non-local
  storage driver should add cleanup-failure metrics and a durable cleanup queue.
- Account version strict/stale behavior from Phase 1E is unchanged.

Observability and load-test plan:

- Track storage metadata failure count by route and purpose.
- Track cleanup attempts/failures when non-local storage is introduced.
- Load-test 10,000 concurrent users with:
  - successful document upload;
  - metadata failure after object write;
  - successful media upload;
  - media profile update failure after asset creation;
  - strict missing-header and stale-header storage writes from Phase 1E.

## Validation

Validated locally on 2026-05-28:

- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/storage/__tests__/storage.test.ts`
  - 1 file passed;
  - 6 tests passed.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts apps/api/src/modules/account/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`
  - 3 files passed;
  - 86 tests passed.
- `npx tsc -b --noEmit`.
- `npm run lint`;
- `npm run check:production-scale-baseline`;
- `git diff --check`;
- `npm run api:build`;
- `npm run build`.

Production build metric:

- Account route chunk `Account-BesZRqle.js` 112.88 kB / 25.69 kB gzip.

Known non-blocking warnings to preserve:

- Supabase generated types out of sync in non-strict mode;
- Browserslist data stale.
