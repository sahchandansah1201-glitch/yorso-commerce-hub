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

Backend Phase 2J Auth Surface Closure is committed locally at `f753224f`;
release validation passed.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Auth runtime | Убрать Supabase auth fallback из `/signin` и `/reset-password`. | Реализовано: `auth-runtime.ts` не содержит `legacy-auth-supabase-adapter`, `supabase_prototype`, `VITE_SUPABASE` branching или direct Supabase import. | Не возвращать hosted auth provider. |
| Adapter file | Удалить код вызова Supabase Auth. | Реализовано: `src/lib/legacy-auth-supabase-adapter.ts` удалён. | Boundary test проверяет отсутствие файла. |
| Session source | Убрать Supabase как источник browser session. | Реализовано: `AuthRuntimeSource`, `BuyerSessionSource` и analytics source = `self_hosted` / `local_contract`. | Старые optional source значения больше не эмитятся runtime'ом. |
| Guards | Запретить возврат auth Supabase fallback. | Реализовано: `test:auth-runtime`, `check:self-hosted-api`, `check:production-scale-baseline`. | Держать в CI. |
| Debt list | Точно выделить оставшийся Supabase/prototype debt вне auth. | Реализовано: catalog fallback, supplier-access fallback, reference tooling/tests, empty env keys и dependency listed. | Phase 3A начнёт removal. |

## Current Status

- Repository branch: `main`.
- Latest public UX/a11y safeguard batch synced: Batch #141.
- Backend Phase 0 closure audit and remediation are complete.
- Backend Phase 1 discovery/audit and Phases 1A-1J are complete.
- Backend Phase 2A-2I are committed locally and validation green.
- Backend Phase 2J is committed locally at `f753224f`; release validation passed.

## Phase 2J Files

- `docs/backend/phase-2j-auth-surface-closure-audit.md`
- `src/lib/auth-runtime.ts`
- `src/lib/auth-runtime.test.ts`
- `src/lib/auth-runtime.boundary.test.ts`
- `src/lib/buyer-session.ts`
- `src/lib/analytics.ts`
- `src/pages/ResetPassword.tsx`
- deleted: `src/lib/legacy-auth-supabase-adapter.ts`
- `scripts/check-self-hosted-api.mjs`
- `scripts/check-production-scale-baseline.mjs`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/production-scale-baseline.md`
- `docs/backend/self-hosted-backend-architecture.md`
- `docs/backend/self-hosted-validation.md`

## Validation

Passed locally on 2026-05-29:

- `npx vitest run src/lib/auth-runtime.test.ts src/lib/auth-runtime.boundary.test.ts src/lib/buyer-session.test.ts`
- `npm run test:auth-runtime`
- `npm run check:supabase-boundary`
- `npm run check:self-hosted-api`
- `npm run check:self-hosted-production-runtime`
- `npm run check:production-scale-baseline`
- `npx tsc -b --noEmit`
- `npm run test:api`
- `npm test`
- `npm run lint`
- `npm run api:build`
- `npm run smoke:self-hosted-auth-api:run`
- `git diff --check`
- `npm run build`

Known non-blocking warnings:

- Supabase generated types out of sync in non-strict preview/build mode.
- Browserslist data stale.

## Next Recommended Workstream

Backend Phase 3A: catalog Supabase fallback removal.

Concrete next function:

- remove `src/lib/legacy-catalog-supabase-adapter.ts`;
- make `src/lib/catalog-api.ts` self-hosted API first plus local fixture
  preview only, without Supabase fallback;
- update catalog boundary tests, guards and docs;
- keep supplier-access Supabase fallback as a separate Phase 3B debt;
- preserve no hosted BaaS/Supabase production dependency.

## Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Access gating, supplier identity redaction and exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
