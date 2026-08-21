# Handoff

Project: `yorso-commerce-hub`

Root: `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`

## Read First

1. `AGENTS.md`
2. `docs/project-memory/CONTEXT_HEALTH.md`
3. `docs/project-memory/PROJECT_STATE.yaml`
4. `docs/project-memory/NEXT_ACTIONS.md`
5. `docs/project-memory/WORKLOG.md`
6. `docs/project-memory/ARTIFACTS.md`
7. `docs/project-memory/RISKS.md`
8. `docs/backend/twenty-crm-backoffice-integration-plan.ru.md`
9. `docs/backend/twenty-workspace-api-contract.md`

## Current Goal (Server Transfer Hardening)

As of 2026-08-21, the next concrete local step before VPS/server transfer is
closed: `infra/docker-compose.yml` defaults API, Postgres, PgBouncer, Redis and
MinIO host-published ports to `127.0.0.1` through explicit `*_BIND_HOST`
variables. The self-hosted infra and production-runtime guards reject
wildcard-style mappings and old service port mappings without explicit bind
hosts.

Next server-transfer gates are still separate: choose Linux firewall/private
network/reverse-proxy exposure, replace all `change-me` secrets, run live server
Docker smokes, and handle production dependency-audit remediation in its own
batch.

## 2026-08-21 Self-hosted API outbox lease runtime fix

- Work from `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`.
- Auth outbox lease SQL ambiguity is fixed in
  `apps/api/src/modules/auth/postgres-repository.ts`.
- Regression test:
  `npx vitest run --config apps/api/vitest.config.ts apps/api/src/modules/auth/postgres-repository.test.ts`.
- Runtime proof: after API rebuild, logs since `2026-08-21T11:38:35Z` contain
  no ambiguous id / ERROR / FATAL / PANIC entries; `/health/ready` returns ok.
- Continue preserving provider-free guard and loopback compose bindings.

## Prior Goal (Twenty CRM)

### Docker-only local onboarding (2026-08-14)

For a clean Windows machine use `scripts/setup-local.ps1`; host Node.js is no
longer required. After the human creates the first Twenty workspace and two API
tokens, `scripts/configure-local-crm.ps1` completes fields, roles, backfill and
local isolation. See `docs/backend/local-full-stack-runbook.ru.md`.

This work did not change VPS/production env, containers, flags, databases or
Twenty workspace.

Local full-stack proof completed on Windows on 2026-08-09. React, API, YORSO
PostgreSQL/PgBouncer/Redis/MinIO and Twenty are runnable together.

Local `admin@example.com` now has both the admin role and a complete YORSO
Company workspace. Live `/v1/account/workspace` and `/v1/admin/crm/status`
return 200. PostgreSQL workspace JSON timestamps are normalized to UTC ISO
before shared-contract validation.

**User-facing CRM workspace is complete locally:**

- `/crm` is a normal YORSO workspace with Companies/People and CRM-owned edits;
- desktop/mobile account menus show CRM when the auth session capability is true;
- `crm_user` grants `/v1/crm/*`; `admin` implies the same capability;
- `/v1/admin/crm/*` still requires admin and owns status/sync-events/retry;
- migration `0039_crm_user_role` is applied locally (40 total migrations);
- live proof returned 5 Company and 5 Person records through `/v1/crm/*`.

Do not grant `crm_user` to external customer accounts yet until isolation is
enabled in the target environment. Batch T0–T5 complete: memberships,
TenantContext, Twenty tenant fields, tenant-aware sync, and read-only
`/v1/crm/*` cutover via `TenantCrmRecordsService` (fail-closed when isolation
flag is false). Default env examples still keep
`CRM_TENANT_ISOLATION_ENABLED=false` / `CRM_USER_WRITES_ENABLED=false`.
Isolation plan:
`docs/backend/twenty-crm-company-isolation-implementation-plan.ru.md`.
Next batch on command: T6 tenant-aware CRM writes.

**Iteration D (CRM tables inside YORSO)** is complete:

- Backend read API for Companies/People via server Twenty API key;
- React `/admin/crm` tabs Overview / Companies / People / Sync events;
- Live local proof: React → YORSO API → Twenty, relation verified, no browser
  calls to `:3020/rest/*`;
- Cursor pagination uses verified Twenty `starting_after`.

Server/Linux cutover (Iteration C3) remains blocked until the operator provides
SSH/domains/secrets. Search/edit/SSO are **not** started.

Do **not** invent server addresses or credentials. Live
`smoke:twenty-crm:staging` and `crm:backfill:apply` require explicit staging
credentials / disposable DB.

Verified local Twenty (dev):

- URL: `http://localhost:3020`
- Image: `twentycrm/twenty:v2.6.0` + pinned digest
- API contract: `docs/backend/twenty-workspace-api-contract.md`
- Infra guard: `npm run check:twenty-infra`
- Local CRM UI proof: `node --env-file=.env.local scripts/smoke-live-admin-crm-records.mjs`

Integration credential and admin secrets live only in gitignored files under
`.data/` and `infra/twenty/.env`. Never commit or paste them.

## Prior Goal (P1I meta-regions)

P1I meta-regions defect fix is in GitHub PR #196 and must be accepted only
after GitHub checks are green.

PR: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/196`

Branch: `codex/p1i-meta-regions-country-picker-fix`

This scoped frontend UX fix keeps `/account/meta-regions` local account storage
and schema unchanged, but fixes the real user flow:

- the form requires at least 2 countries;
- after selecting Argentina, the picker remains ready for a second country;
- the next query can find Brazil and add it without closing/reopening the form;
- selected countries are excluded from results and duplicates are blocked;
- chip removal still works after another country is added;
- read mode shows country chips and avoids technical enum leakage.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| P1I defect | Fix the failed meta-region 2+ country interaction and deliver it to GitHub/Lovable. | PR #196 contains the code/test/memory fix. Local verification passed after CI blockers were fixed. | Wait for PR checks, then merge/sync if green. |
| Evidence | Prove repeated selection, not only static render. | Playwright e2e passed 17/17; meta-regions repeated 14/14 with `--repeat-each=2`; 390px screenshots saved. | Keep screenshots under `test-results/p1i-meta-regions-defect-fixed/` for review. |
| Known prior mistake | Previous P1I acceptance was overstated. | Work was local/dirty and not fully delivered/verified through GitHub/Lovable. | Do not accept future Lovable reports without local sync + real-flow verification. |
| Scope | Show product identity as `Latin (commercial)` where users scan products. | Picker, desktop table, mobile cards, detail panel and delete context use Latin-first identity. | Commit/push, then sync Lovable preview. |
| Search | Let users search by commercial/localized or Latin name. | `searchCatalog` covers Latin plus EN/RU/ES/FR/CN/DE names; e2e verifies `Atlantic mackerel` -> `Scomber scombrus`. | Later improve ranking/ARIA combobox if needed. |
| Delete copy | Keep delete confirmation short and unambiguous. | EN/RU/ES title/description shortened while context remains visible. | Preserve safe context in future refactors. |
| Provider-free | Do not reintroduce hosted BaaS/Supabase runtime. | P1A.3 adds no backend/provider dependency. | Run provider-free tests on every Lovable sync. |

## Current Status

- Repository branch: `main`.
- Active local checkpoint: P1A.3 Products Catalog Picker And Latin-First Product Identity.
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
- Backend Phase 4J is committed locally at `b5469880`; release validation passed.
- Backend Phase 4K is committed locally at `3b74b498`; release validation passed.
- Backend Phase 4L is committed locally at `ff286919`; release validation passed.
- Backend Phase 4M is committed locally at `a6765b4f`; release validation passed.
- Backend Phase 4N is committed locally at `2d5a05ba`; release validation passed.
- Backend Phase 4O is committed locally at `4a9bbc2e`; release validation passed.
- Backend Phase 4P is committed locally at `84954e9d`; release validation passed.
- Backend Phase 4Q is committed locally at `b2473ede`; release validation passed.
- Backend Phase 4R is committed locally at `474c290c`; release validation passed.
- Backend Phase 4S is committed locally at `3796bd80`; release validation passed.
- Backend Phase 4T is committed locally at `609ff7d1`; release validation passed.

## Phase 4T Files

- `docs/backend/phase-4t-supplier-document-admin-confirmation-ui.md`
- `src/pages/admin/AdminSupplierDocumentManagementEvents.tsx`
- `src/pages/admin/AdminSupplierDocumentManagementEvents.test.tsx`
- `e2e/admin-supplier-document-management-events.spec.ts`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`

## Phase 4S Files

- `docs/backend/phase-4s-supplier-document-admin-mutation-ui.md`
- `src/lib/admin-supplier-document-management-events-api.ts`
- `src/lib/admin-supplier-document-management-events-api.test.ts`
- `src/pages/admin/AdminSupplierDocumentManagementEvents.tsx`
- `src/pages/admin/AdminSupplierDocumentManagementEvents.test.tsx`
- `e2e/admin-supplier-document-management-events.spec.ts`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`

## Phase 4R Files

- `docs/backend/phase-4r-supplier-document-management-events-admin-ui.md`
- `src/lib/admin-supplier-document-management-events-api.ts`
- `src/lib/admin-supplier-document-management-events-api.test.ts`
- `src/lib/use-admin-supplier-document-management-events.ts`
- `src/lib/use-admin-supplier-document-management-events.test.tsx`
- `src/pages/admin/AdminSupplierDocumentManagementEvents.tsx`
- `src/pages/admin/AdminSupplierDocumentManagementEvents.test.tsx`
- `e2e/admin-supplier-document-management-events.spec.ts`
- `src/App.tsx`
- `src/components/admin/AdminOperatorNav.tsx`
- `src/test/app-route-code-splitting.test.ts`
- `.github/workflows/ci.yml`
- `package.json`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`

## Phase 4Q Files

- `docs/backend/phase-4q-supplier-document-management-events.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/admin-routes.ts`
- `apps/api/src/modules/suppliers/service.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `apps/api/src/server.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `src/test/supplier-document-management-contract.test.ts`
- `scripts/smoke-self-hosted-account-api.mjs`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/self-hosted-account-api-smoke.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`
- `package.json`

## Phase 4P Files

- `docs/backend/phase-4p-supplier-document-admin-lifecycle.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/admin-routes.ts`
- `apps/api/src/modules/suppliers/service.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `apps/api/src/server.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `src/test/supplier-document-management-contract.test.ts`
- `src/test/self-hosted-db-contract.test.ts`
- `scripts/smoke-self-hosted-account-api.mjs`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/self-hosted-account-api-smoke.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`
- `package.json`

## Phase 4O Files

- `docs/backend/phase-4o-supplier-document-owner-correction.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/service.ts`
- `apps/api/src/modules/suppliers/routes.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `apps/api/src/server.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `src/test/supplier-document-management-contract.test.ts`
- `src/test/self-hosted-db-contract.test.ts`
- `scripts/smoke-self-hosted-account-api.mjs`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/self-hosted-account-api-smoke.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`
- `package.json`

## Phase 4N Files

- `docs/backend/phase-4n-supplier-document-admin-decision.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/admin-routes.ts`
- `apps/api/src/modules/suppliers/service.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `apps/api/src/server.ts`
- `apps/api/src/server.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `src/test/supplier-document-management-contract.test.ts`
- `src/test/self-hosted-db-contract.test.ts`
- `scripts/smoke-self-hosted-account-api.mjs`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/self-hosted-account-api-smoke.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`
- `package.json`

## Phase 4M Files

- `docs/backend/phase-4m-supplier-document-owner-create.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/storage/service.ts`
- `apps/api/src/modules/suppliers/service.ts`
- `apps/api/src/modules/suppliers/routes.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `apps/api/src/server.ts`
- `apps/api/src/server.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `packages/db/migrations/0037_supplier_document_management_events.sql`
- `packages/db/migration-manifest.json`
- `packages/db/src/migrator.test.ts`
- `packages/db/src/cli.test.ts`
- `src/test/self-hosted-db-contract.test.ts`
- `src/test/supplier-document-management-contract.test.ts`
- `scripts/smoke-self-hosted-account-api.mjs`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/self-hosted-account-api-smoke.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`
- `package.json`

## Phase 4L Files

- `docs/backend/phase-4l-supplier-document-management-rules.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/document-management-policy.ts`
- `apps/api/src/modules/suppliers/document-management-policy.test.ts`
- `src/test/supplier-document-management-contract.test.ts`
- `package.json`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`

## Phase 4K Files

- `docs/backend/phase-4k-supplier-document-audit-admin-ui.md`
- `src/lib/admin-supplier-document-audit-api.ts`
- `src/lib/admin-supplier-document-audit-api.test.ts`
- `src/lib/use-admin-supplier-document-audit.ts`
- `src/lib/use-admin-supplier-document-audit.test.tsx`
- `src/pages/admin/AdminSupplierDocumentAudit.tsx`
- `src/pages/admin/AdminSupplierDocumentAudit.test.tsx`
- `src/components/admin/AdminOperatorNav.tsx`
- `src/App.tsx`
- `src/test/app-route-code-splitting.test.ts`
- `e2e/admin-supplier-document-audit.spec.ts`
- `.github/workflows/ci.yml`
- `package.json`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`

## Phase 4J Files

- `docs/backend/phase-4j-supplier-document-grant-audit-listing.md`
- `packages/contracts/src/supplier-directory.ts`
- `apps/api/src/modules/suppliers/admin-routes.ts`
- `apps/api/src/modules/suppliers/service.ts`
- `apps/api/src/modules/suppliers/repository.ts`
- `apps/api/src/modules/suppliers/postgres-repository.ts`
- `apps/api/src/server.test.ts`
- `apps/api/src/modules/suppliers/__tests__/repository.test.ts`
- `src/test/self-hosted-contracts.test.ts`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/self-hosted-validation.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/yorso-backend-implementation-plan.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`

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

Decision: admin UI for supplier document audit listings or supplier
owner/admin document management.

Concrete first scope:

- if admin UI is selected, build a bounded admin console view over
  `/v1/admin/supplier-documents/download-events` and
  `/v1/admin/supplier-documents/download-grants`;
- if owner/admin document management is selected, define ownership, upload,
  edit/delete validation, audit events and file lifecycle first;
- do not start both in one batch.

## 2026-08-14 Local Clean-PC Handoff

- Double-click entry point: `SETUP_LOCAL.cmd`; only running Docker Desktop is
  required on Windows. Host Node/Postgres/Redis/nginx are not required.
- PowerShell entry points remain under `scripts/*-local.ps1`; stop preserves
  all named volumes.
- First-run manual boundary: initialize the Twenty workspace and create two
  distinct tokens, then run `scripts/configure-local-crm.ps1`.
- CRM configuration creates metadata, backfills records, waits for outbox
  completion, and only then enables tenant isolation/user writes.
- This work does not alter VPS/production or its capacity baseline.

## 2026-08-19 Local Development Handoff

- Work from `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`.
  `yorso_new` is the project/product name; do not switch to the old
  `/Users/istokdmgmail.com/yorso_new` path.
- Local Docker runtime is verified: frontend `:8080`, API `:3000`, Twenty
  `:3020`. Twenty is the default self-hosted CRM/backoffice component, while
  Yorso API/PostgreSQL remains the system of record.
- Before server deployment, harden local compose exposure for Postgres, Redis,
  MinIO and PgBouncer. The current host bindings are for trusted local
  development only.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
