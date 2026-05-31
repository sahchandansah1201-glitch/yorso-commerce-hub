# Handoff

Project: `yorso-commerce-hub`

Root: `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`

## Read First

1. `AGENTS.md`
2. `docs/project-memory/CONTEXT_HEALTH.md`
3. `docs/project-memory/PROJECT_STATE.yaml`
4. `docs/project-memory/NEXT_ACTIONS.md`
5. `docs/project-memory/WORKLOG.md`
6. `docs/project-memory/ARTIFACTS.md`
7. `docs/project-memory/RISKS.md`

## Current Goal

Backend Phase 4I Supplier Document Download Audit Listing is committed locally
at `bd05bc60`; release validation passed.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Решение по scope | Выбрать owner/admin upload или admin audit listing. | Выбрано audit listing по `yorso_supplier_document_download_events`. | Owner/admin upload остается отдельной supplier operations phase. |
| Admin endpoint | Дать bounded admin read по download events. | Реализовано: `GET /v1/admin/supplier-documents/download-events`. | Phase 4J: grant audit listing. |
| Role guard | Не отдавать audit buyer-сессиям. | Реализовано: 401 без сессии, 403 `admin_role_required` для buyer. | Возможные admin-subroles позже. |
| Payload boundary | Не раскрывать backend storage identifiers. | Реализовано: в admin JSON нет `fileAssetId`, object keys, storage keys, direct file URLs и `downloadPath`. | Держать admin responses без storage identifiers. |
| Пагинация и индексы | Сделать bounded pagination и indexed filters. | Реализовано: `status`, `supplierId`, `buyerUserId`, `limit<=100`, `offset<=10000`; Postgres использует существующие recent indexes. | Cursor pagination только если объем audit этого потребует. |
| Guards | Зафиксировать docs, self-hosted guard и 10k-user review. | Реализовано: Phase 4I docs, guards и validation. | Держать в release path. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A-2J are complete and validation green.
- Backend Phase 3A is committed locally at `b5d1e9f8`; release validation passed.
- Backend Phase 3B is committed locally at `5b96f838`; release validation passed.
- Backend Phase 3C is committed locally at `6c2f5368`; release validation passed.
- Backend Phase 4A is committed locally at `9362f458`; release validation passed.
- Backend Phase 4B is committed locally at `799af493`; release validation passed.
- Backend Phase 4C is committed locally at `d8988d50`; release validation passed.
- Backend Phase 4D is committed locally at `84dd9588`; release validation passed.
- Backend Phase 4E is committed locally at `7f566ca2`; release validation passed.
- Backend Phase 4F is committed locally at `75c42a60`; release validation passed.
- Backend Phase 4G is committed locally at `37cae608`; release validation passed.
- Backend Phase 4H is committed locally at `06ef6922`; release validation passed.
- Backend Phase 4I is committed locally at `bd05bc60`; release validation passed.

## Phase 4I Files

- `docs/backend/phase-4i-supplier-document-download-audit-listing.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/admin-routes.ts`
- `apps/api/src/modules/suppliers/service.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `apps/api/src/server.ts`
- `apps/api/src/server.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`

## Phase 4H Files

- `docs/backend/phase-4h-supplier-document-download-ui.md`
- `src/lib/supplier-directory-api.ts`
- `src/lib/supplier-directory-api.test.ts`
- `src/lib/supplier-documents.ts`
- `src/lib/supplier-directory-view.ts`
- `src/lib/use-supplier-directory.ts`
- `src/pages/SupplierProfile.tsx`
- `src/pages/__tests__/SupplierProfile.access.test.tsx`
- `src/i18n/translations.ts`
- `e2e/supplier-directory-profile-api-flow.spec.ts`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`

## Phase 4G Files

- `docs/backend/phase-4g-supplier-document-download-serving.md`
- `apps/api/src/fixtures/supplier-document-assets.ts`
- `apps/api/src/modules/suppliers/routes.ts`
- `apps/api/src/modules/suppliers/service.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `apps/api/src/modules/storage/service.ts`
- `apps/api/src/modules/storage/repository.ts`
- `apps/api/src/modules/storage/postgres-repository.ts`
- `packages/db/migrations/0036_supplier_document_download_events.sql`
- `packages/db/migration-manifest.json`
- `apps/api/src/server.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `apps/api/src/modules/storage/__tests__/storage.test.ts`
- `src/test/self-hosted-db-contract.test.ts`
- `packages/db/src/migrator.test.ts`
- `packages/db/src/cli.test.ts`
- `scripts/smoke-self-hosted-account-api.mjs`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`

## Phase 4F Files

- `docs/backend/phase-4f-supplier-document-download-grants.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/routes.ts`
- `apps/api/src/modules/suppliers/service.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `packages/db/migrations/0035_supplier_document_download_grants.sql`
- `packages/db/migration-manifest.json`
- `src/lib/supplier-directory-api.ts`
- `apps/api/src/server.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `src/lib/supplier-directory-api.test.ts`
- `src/test/self-hosted-contracts.test.ts`
- `src/test/self-hosted-db-contract.test.ts`
- `packages/db/src/migrator.test.ts`
- `packages/db/src/cli.test.ts`
- `scripts/smoke-self-hosted-account-api.mjs`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`

## Phase 4E Files

- `docs/backend/phase-4e-supplier-profile-restricted-documents.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `apps/api/src/modules/suppliers/service.ts`
- `packages/db/migrations/0034_supplier_profile_restricted_documents.sql`
- `packages/db/migration-manifest.json`
- `src/lib/supplier-documents.ts`
- `src/lib/supplier-directory-api.ts`
- `src/lib/supplier-directory-view.ts`
- `src/lib/use-supplier-directory.ts`
- `src/pages/SupplierProfile.tsx`
- `src/data/mockSuppliers.ts`
- `src/i18n/translations.ts`
- `src/test/self-hosted-contracts.test.ts`
- `src/test/self-hosted-db-contract.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `src/lib/supplier-directory-api.test.ts`
- `src/lib/supplier-directory-view.test.ts`
- `src/lib/use-supplier-directory.test.tsx`
- `src/pages/Suppliers.test.tsx`
- `src/pages/__tests__/SupplierProfile.access.test.tsx`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`

## Phase 4D Files

- `docs/backend/phase-4d-supplier-profile-legal-details.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `apps/api/src/modules/suppliers/service.ts`
- `packages/db/migrations/0033_supplier_profile_legal_details.sql`
- `packages/db/migration-manifest.json`
- `src/lib/supplier-legal.ts`
- `src/lib/supplier-directory-api.ts`
- `src/lib/supplier-directory-view.ts`
- `src/lib/use-supplier-directory.ts`
- `src/pages/SupplierProfile.tsx`
- `src/data/mockSuppliers.ts`
- `src/test/self-hosted-contracts.test.ts`
- `src/test/self-hosted-db-contract.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `src/lib/supplier-directory-api.test.ts`
- `src/lib/supplier-directory-view.test.ts`
- `src/lib/use-supplier-directory.test.tsx`
- `src/pages/Suppliers.test.tsx`
- `src/pages/__tests__/SupplierProfile.access.test.tsx`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`

## Phase 4C Files

- `docs/backend/phase-4c-supplier-profile-evidence-blocks.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `packages/db/migrations/0032_supplier_profile_evidence_blocks.sql`
- `packages/db/migration-manifest.json`
- `src/lib/supplier-evidence-blocks.ts`
- `src/lib/supplier-content.ts`
- `src/lib/supplier-directory-api.ts`
- `src/lib/supplier-directory-view.ts`
- `src/lib/use-supplier-directory.ts`
- `src/pages/SupplierProfile.tsx`
- `src/data/mockSuppliers.ts`
- `src/data/mockSuppliersI18n.ts`
- `src/test/self-hosted-contracts.test.ts`
- `src/test/self-hosted-db-contract.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `src/lib/supplier-directory-api.test.ts`
- `src/lib/supplier-directory-view.test.ts`
- `src/lib/use-supplier-directory.test.tsx`
- `src/pages/Suppliers.test.tsx`
- `src/pages/__tests__/SupplierProfile.access.test.tsx`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`

## Phase 4B Files

- `docs/backend/phase-4b-supplier-profile-dossier-completeness.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `packages/db/migrations/0031_supplier_profile_dossier_facts.sql`
- `packages/db/migration-manifest.json`
- `src/lib/supplier-dossier-facts.ts`
- `src/lib/supplier-directory-api.ts`
- `src/lib/supplier-directory-view.ts`
- `src/lib/use-supplier-directory.ts`
- `src/pages/SupplierProfile.tsx`
- `src/test/self-hosted-contracts.test.ts`
- `src/test/self-hosted-db-contract.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `src/lib/supplier-directory-api.test.ts`
- `src/lib/supplier-directory-view.test.ts`
- `src/lib/use-supplier-directory.test.tsx`
- `src/pages/Suppliers.test.tsx`
- `src/pages/__tests__/SupplierProfile.access.test.tsx`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`

## Phase 4A Files

- `docs/backend/phase-4a-supplier-directory-source-of-truth-audit.md`
- `src/lib/use-supplier-directory.ts`
- `src/pages/Suppliers.tsx`
- `src/pages/SupplierProfile.tsx`
- `src/i18n/translations.ts`
- `src/lib/use-supplier-directory.test.tsx`
- `src/pages/Suppliers.test.tsx`
- `src/pages/__tests__/SupplierProfile.access.test.tsx`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/production-scale-baseline.md`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`

## Phase 3C Files

- `docs/backend/phase-3c-provider-reference-tooling-retirement.md`
- `scripts/check-provider-production-boundary.mjs`
- `scripts/smoke-frontend-provider-free-env.mjs`
- `e2e/frontend-provider-free-env.spec.ts`
- `package.json`
- `package-lock.json`
- `.env`
- `.env.example`
- `.github/workflows/ci.yml`
- `apps/api/src/config.ts`
- `packages/contracts/src/admin-runtime.ts`
- `packages/db/migration-manifest.json`
- `packages/db/src/migrator.ts`
- `docs/backend/self-hosted-production-policy.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`

Removed active provider surface:

- `supabase/`
- `src/integrations/supabase/`
- Supabase CLI/access/type scripts
- Supabase/RLS reference tests under `src/test/`
- `@supabase/supabase-js`

## Validation

Phase 4G release validation passed locally on 2026-05-31:

- TDD red: focused file-serving endpoint test initially failed with 404 before
  route implementation.
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "supplier document download grants"`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts apps/api/src/modules/storage/__tests__/storage.test.ts`
- `npm run test:db-migrations`
- `npm run test:db-contract`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npx tsc -b --noEmit`
- `npm run contracts:build`
- `npm run api:build`
- `npm run smoke:self-hosted-account-api:run`
- `npm run test:api`
- `npm run check:self-hosted-db`
- `npm test`
- `npm run lint`
- `npm run build`
- `git diff --check`

Phase 4F release validation passed locally on 2026-05-31:

- TDD red: `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "issues supplier document download grants"` initially failed with 405 before the route existed.
- `npm run contracts:build`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/server.test.ts -t "issues supplier document download grants"`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `npm test -- src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-api.test.ts`
- `npm run test:db-migrations`
- `npm run test:db-contract`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npx tsc -b --noEmit`
- `npm run api:build`
- `npm run smoke:self-hosted-account-api:run`
- `npm test`
- `npm run test:api`
- `npm run build`
- `npm run check:self-hosted-db`
- `git diff --check`

Phase 4E release validation passed locally on 2026-05-31:

- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx` initially
  failed in TDD red because the profile ignored backend-owned supplier
  documents.
- `npm run contracts:build`
- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`
- `npm test -- src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-view.test.ts src/lib/supplier-directory-api.test.ts src/lib/use-supplier-directory.test.tsx src/pages/Suppliers.test.tsx src/pages/__tests__/SupplierProfile.access.test.tsx`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `npm run test:db-migrations`
- `npm run test:db-contract`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npx tsc -b --noEmit`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run build`
- `npm run test:api`
- `npm run test:supplier-directory-frontend`
- `npm run test:backend-contract`
- `npm run check:self-hosted-db`
- `git diff --check`

Phase 4D release validation passed locally on 2026-05-31:

- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx` initially
  failed in TDD red because the profile ignored backend-owned legal details.
- `npm run contracts:build`
- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`
- `npm test -- src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-view.test.ts src/lib/supplier-directory-api.test.ts src/lib/use-supplier-directory.test.tsx src/pages/Suppliers.test.tsx src/pages/__tests__/SupplierProfile.access.test.tsx`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `npm run test:db-migrations`
- `npm run test:db-contract`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npx tsc -b --noEmit`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run build`
- `npm run test:api`
- `npm run test:supplier-directory-frontend`
- `npm run test:backend-contract`
- `npm run check:self-hosted-db`
- `git diff --check`

Phase 4C release validation passed locally on 2026-05-29:

- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx` initially
  failed in TDD red because the profile ignored API-owned backend evidence.
- `npm run contracts:build`
- `npm test -- src/pages/__tests__/SupplierProfile.access.test.tsx`
- `npm test -- src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-view.test.ts src/lib/supplier-directory-api.test.ts src/lib/use-supplier-directory.test.tsx src/pages/Suppliers.test.tsx src/pages/__tests__/SupplierProfile.access.test.tsx`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `npm run test:db-migrations`
- `npm run test:db-contract`
- `npx tsc -b --noEmit`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run build`
- `git diff --check`

Phase 4B release validation passed locally on 2026-05-29:

- `npx vitest run src/test/self-hosted-contracts.test.ts src/lib/supplier-directory-view.test.ts src/pages/__tests__/SupplierProfile.access.test.tsx`
- `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `npm run test:db-migrations`
- `npm run test:db-contract`
- `npm run test:supplier-directory-frontend`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npm run test:backend-contract`
- `npm run test:api`
- `npx tsc -b --noEmit`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run build`
- `git diff --check`

Phase 3C passed locally on 2026-05-29:

- `npx vitest run src/test/self-hosted-backend-policy.test.ts src/test/self-hosted-infra.test.ts src/test/self-hosted-contracts.test.ts src/test/provider-free-tooling-retirement.test.ts`
- `npm run check:provider-boundary`
- `npm run check:self-hosted-production-runtime`
- `npm run check:self-hosted-api`
- `npm run check:production-scale-baseline`
- `npm run check:self-hosted-db`
- `npm run check:backend-policy`
- `npm run check:self-hosted-infra`
- `npm run db:migrations:check`
- `npm run test:backend-contract`
- `npm run test:access-contract`
- `npm run test:admin-runtime-frontend`
- `npm run test:admin-operations-frontend`
- `npx tsc -b --noEmit`
- `npm run test:api`
- `npm run db:build`
- `npm run contracts:build`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run build`
- `npm run smoke:e2e:frontend-provider-free-env`
- `git diff --check`

Known non-blocking warning:

- Browserslist data stale.

## Next Recommended Workstream

Backend Phase 4J: Supplier Document Grant Audit Listing.

Concrete first scope:

- expose bounded admin reads over `yorso_supplier_document_download_grants`;
- keep response storage-id-free for browser/admin JSON while preserving
  backend-only `fileAssetId` in repository/database forensics;
- support indexed filters that already exist or add no unindexed scans;
- require admin session and audit reads;
- do not implement owner upload/editing yet.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
