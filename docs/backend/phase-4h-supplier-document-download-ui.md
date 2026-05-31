# Backend Phase 4H - Supplier Document Download UI Integration

Status: implemented.

Phase 4H connects the qualified supplier profile UI to the self-hosted
supplier document grant and serving flow implemented in Phase 4F and Phase 4G.
Qualified buyers can download approved supplier documents from the production
passport without receiving backend-only storage identifiers.

Frontend entry point:

- `/suppliers/:supplierId`, production passport tab, supplier documents block.

Runtime flow:

1. Render document metadata from `supplier.supplierDocuments` only for
   `qualified_unlocked` profiles.
2. Render locked/readiness copy for anonymous and registered locked buyers.
3. On download click, call `downloadSupplierDocument(supplierId, documentId)`.
4. The frontend requests a self-hosted grant through
   `/v1/suppliers/:supplierId/documents/:documentId/grant`.
5. The frontend then fetches the returned relative API `downloadPath` with
   the current self-hosted buyer session headers.
6. The browser receives a Blob and starts a local attachment download.

The React state, DOM, analytics, test fixtures and visible error copy must not
contain:

- `fileAssetId`;
- object storage keys;
- direct filesystem paths;
- direct storage URLs;
- provider-specific storage identifiers.

## Plan / Fact

| План реализации | Сделано | Будет реализовано |
|---|---|---|
| Подключить UI к self-hosted grant/download API. | `src/lib/supplier-directory-api.ts` добавляет `downloadSupplierDocument`, который сначала получает grant, затем скачивает `downloadPath` через API. | Range requests and large file progress remain separate serving/performance scope. |
| Добавить download CTA только для qualified buyer. | `SupplierProfile.tsx` рендерит `data-testid="supplier-document-download"` only for approved documents with file names and configured self-hosted API. | Owner/admin upload/editing remains later supplier operations scope. |
| Не раскрывать backend storage identifiers. | `redactSupplierDocumentFileAssets` strips `fileAssetId`; tests/e2e assert the DOM/body does not contain backend asset ids or object keys. | Backend payload hardening remains guarded by Phase 4E/4G contract tests. |
| Обработать истекший grant и ошибки скачивания. | UI shows localized "Document access expired. Try again." for expired grants and generic retry copy for failed downloads. | Dedicated retry button and telemetry taxonomy can be added later if needed. |
| Сохранить locked buyer behavior. | Locked profiles keep document readiness metadata/copy and no download action. | No direct document request workflow is added in this phase. |
| Сохранить production passport сканируемость. | Document block now remains visible even if the API omits optional logistics facts. | Backend should still return complete dossier facts for production-quality supplier profiles. |

## Access Decision

Download UI is qualified-only and API-only.

- API-disabled local preview can show document metadata for qualified mock
  profiles but cannot fabricate grants or local file downloads.
- Anonymous and registered locked buyers do not receive download buttons.
- The UI never uses `fileAssetId` as a click target or request parameter.
- The backend remains responsible for all access checks, grant expiry checks
  and file reads.

## Runtime Contract

`downloadSupplierDocument`:

- requires `VITE_YORSO_API_URL`;
- throws `supplier_document_grant_requires_api` when API is disabled;
- requests a grant through the self-hosted supplier directory API;
- fetches only the returned relative API download path;
- includes `x-yorso-user-id` and `x-yorso-session-id` through
  `supplierDirectoryHeaders`;
- parses `content-disposition` for the final filename and falls back to the
  grant filename;
- returns `{ blob, fileName }` only.

`SupplierProfile.tsx`:

- creates a Blob URL only after a successful API response;
- clicks a temporary local `<a download>` element;
- revokes the Blob URL after the click;
- keeps pending state on the clicked document only;
- exposes localized status/error copy through `role="status"` or `role="alert"`;
- avoids nested interactive controls and preserves 44px mobile target sizing.

## 10,000 Concurrent-User Review

Expected read/write profile:

- One user click creates one grant POST and one file GET.
- Reads:
  - supplier profile read already performed by the page;
  - account session headers read from local browser session state;
  - backend grant lookup and supplier access re-check in Phase 4G.
- Writes:
  - grant audit row from Phase 4F;
  - download event row from Phase 4G.
- No frontend polling, realtime subscription, scheduler or background worker is
  introduced.

Cache, queue and backpressure strategy:

- The UI does not cache document bytes.
- Backend response stays `cache-control: private, no-store`.
- Grant TTL remains the replay boundary.
- The browser performs one bounded download fetch per click; duplicate clicks
  on the same row are disabled while the request is pending.
- API request timeout, lifecycle drain and document-serving backpressure remain
  backend-owned.

Database indexing and pagination strategy:

- No new database table or index is introduced by Phase 4H.
- Existing Phase 4F grant indexes and Phase 4G download-event indexes remain
  the persistence boundary.
- Supplier profile document rows are already bounded by supplier profile
  payload shape; no document list pagination is introduced in this UI phase.

Failure mode and graceful degradation:

- API-disabled preview: no download button is rendered.
- Expired grant: localized retry copy is shown without exposing backend ids.
- Network/download failure: localized generic retry copy is shown.
- Missing optional logistics facts: document block still renders inside the
  production passport instead of disappearing.
- Locked buyer: document download action remains absent.

Observability and load-test plan:

- Browser e2e covers the API-backed supplier directory/profile flow, grant
  request, download request, session headers, DOM redaction and success copy.
- Unit tests cover the API client grant+download sequence and SupplierProfile
  download behavior.
- Load tests for 10,000 concurrent users should reuse the Phase 4F/4G backend
  grant/download scenarios and add browser-click concurrency for:
  - approved document download;
  - expired grant retry;
  - API failure copy;
  - duplicate clicks while pending.

## Remaining Supplier Document Debt After Phase 4H

| Debt | Status после Phase 4H | Следующий scoped шаг |
|---|---|---|
| Restricted document metadata | Backend-owned and redacted for browser state. | Keep guarded. |
| Grant issuance | Implemented in Phase 4F and consumed by UI. | Keep guarded. |
| File serving | Implemented in Phase 4G and used by UI. | Add large-file/range support only if required. |
| UI download action | Implemented for qualified supplier profile documents. | Add owner/admin document management later. |
| Owner/admin upload/editing | Not implemented. | Later supplier operations/admin phase. |
| Admin grant/download audit listing | Not implemented. | Later admin route with bounded pagination. |

## Validation

Completed validation:

- TDD red: `npm test -- src/lib/supplier-directory-api.test.ts -t "downloads supplier documents"` failed before `downloadSupplierDocument` existed.
- TDD green: same focused test passed after API client implementation.
- TDD red: `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx -t "downloads supplier document"` failed before the UI download action existed.
- TDD green: same focused test passed after SupplierProfile integration.
- Browser red/green: API-backed supplier profile e2e initially failed because
  backend documents were hidden when optional logistics facts were absent; the
  production passport now keeps the document block visible.

Release validation covers:

- `npm test -- src/lib/supplier-directory-api.test.ts`.
- `npm run test:supplier-directory-frontend`.
- `npm run smoke:e2e:supplier-directory-profile-api-flow`.
- `npm run check:self-hosted-api`.
- `npm run check:production-scale-baseline`.
- TypeScript, lint, production build and full test gates before commit.

Marker: Backend Phase 4H.
Marker: Supplier Document Download UI Integration.
Marker: downloadSupplierDocument.
Marker: supplier-document-download.
Marker: fileAssetId.
Marker: self-hosted backend.
Marker: 10,000 concurrent users.
