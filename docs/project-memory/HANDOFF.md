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

Backend Phase 4D Supplier Profile Legal/Compliance Details Source Boundary is
committed locally at `84dd9588`; release validation passed.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Legal contract | Перенести legal/compliance details в supplier API contract. | Реализовано: `supplierLegalDetailsSchema` / `legalDetails` добавлены в contract, API repositories and frontend adapter. | Owner/admin write validation later. |
| Persistence | Добавить self-hosted storage для legal details. | Реализовано: migration `0033_supplier_profile_legal_details` добавляет JSONB `legal_details`. | Backfill verified supplier legal details later. |
| Access boundary | Не раскрывать legal identifiers locked buyers. | Реализовано: `shapeSupplierForAccess` отдаёт `legalDetails: null` для `anonymous_locked` и `registered_locked`. | Restricted documents require separate qualified-only payload/API. |
| Supplier profile | Убрать frontend legal hash synthesis из production profile. | Реализовано: `SupplierProfile.tsx` читает `supplier?.legalDetails`; helper оставлен только как `localPreviewSupplierLegalDetails`. | Phase 4E: restricted document payload boundary. |
| Guards | Зафиксировать qualified-only legalDetails contract. | Реализовано: tests, DB guards, `check:self-hosted-api`, `check:production-scale-baseline` проходят. | Держать guards в `ci:core`. |

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

Backend Phase 4E: Supplier Profile Restricted Document Payload Boundary.

Concrete first scope:

- audit supplier profile document-readiness UI and any document/download paths
  still represented as frontend/local/prototype data;
- define a qualified-only supplier document payload contract/API boundary;
- keep `anonymous_locked` and `registered_locked` responses free of file URLs,
  document payloads and supplier identity.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
