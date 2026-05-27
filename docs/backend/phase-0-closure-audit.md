# Backend Phase 0 Closure Audit

Date: 2026-05-27
Repository: `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`
Audited baseline before the original documentation update: `23e13bc`
Original closure checkpoint: `51953db`
Remediation checkpoint: this remediation commit

## Scope

This audit closes Backend Phase 0 as a contract and gate checkpoint. It does not
claim that Phase 1-8 backend migrations are complete, and it does not remove the
known prototype fallback model. The goal is to verify that the project has a
stable backend contract before account, supplier, catalog and access workflows
continue moving from mock/local browser state to the self-hosted API.

## Phase 0 Exit Criteria

| Criterion | Status | Evidence |
|---|---:|---|
| `docs/backend/frontend-backend-contract.md` exists and maps active frontend pages to data sources | Closed | Route contract now includes current `src/App.tsx` public, account, dashboard, admin, redirect, dev and `*` routes. |
| Current mock/localStorage/sessionStorage dependencies are documented | Closed | `frontend-backend-contract.md` maps `mockAccount`, `mockSuppliers`, `mockOffers`, `mockIntelligence`, `supplier-access-requests`, `catalog-requests` and `buyer-session` to backend targets. |
| Existing Supabase migrations are treated as prototype references, not production backend target | Closed | Contract global rules keep production target on self-hosted YORSO API plus PostgreSQL and keep Supabase as legacy/prototype only. |
| Self-hosted API contracts and generated client type strategy are defined | Closed | `packages/contracts/src/*`, `apps/api/src/modules/*`, `api:build`, `contracts:build` and typed frontend API adapters exist. |
| Local seed/fallback strategy is defined | Closed with boundary | Mock data remains allowed as seed/fallback while self-hosted parity is incomplete; the contract forbids it as production source of truth. |
| `.env.example` exists | Closed | `.env.example` includes app/API URLs, PostgreSQL/PgBouncer, Redis, storage, auth/session secrets and Supabase prototype-only variables. |
| Production build passes | Closed | `npm run build` passed. |
| Lint passes | Closed | `npm run lint` passed. |
| Test suite passes or known failures are explicitly documented | Closed after remediation | `npm test` now passes: 184 files passed, 1268 tests passed, 2 skipped. |

## Gate Results

| Command | Result | Notes |
|---|---:|---|
| `npm run lint` | Passed | No ESLint failures. |
| `npm run build` | Passed | Non-blocking warnings remain: Supabase generated types out of sync in non-strict mode; Browserslist data stale. |
| `npm run contracts:build` | Passed | Shared TypeScript contract package builds. |
| `npm test` | Passed | 184 files passed, 1268 tests passed, 2 skipped. |

## Phase 0 Remediation Result

The original closure checkpoint documented 18 known Vitest failures. The
focused remediation pass resolved those failures and restored the full test
suite to green without changing the public Batch #110-#141 safeguards.

- Stale RU/i18n tests were aligned with the current route-owned catalog,
  homepage-card, footer-anchor, NotFound and semantic CTA contracts.
- Sign-in locale persistence tests now pin the local auth contract by stubbing
  self-hosted/Supabase auth env values during those unit renders.
- Registration funnel e2e coverage now mounts the required buyer-session
  provider.
- Catalog exact-price rendering now uses active-locale `formatPrice` for
  qualified buyers on desktop rows, desktop cards and mobile cards.
- Catalog category select/chip labels now display localized category names while
  preserving the same URL/filter values.
- Supabase-backed public access smoke tests still hard-fail on `42501`
  insufficient privilege, while transient Supabase network timeouts are bounded
  and reported as non-privilege warnings.

No known Phase 0 test failures remain after this remediation pass.

## Closure Decision

Backend Phase 0 closure audit is complete.

Status: **closed with green gates**.

The contract, route map, environment sample, self-hosted backend surface and
primary build/lint/contract/test gates are in place. Phase 1 can now start from
a green Phase 0 baseline, while the preserved non-blocking warnings remain
visible for a later housekeeping pass.

## Recommended Next Step

Start Backend Phase 1: Account Source Of Truth.
