# Backend Phase 0 Closure Audit

Date: 2026-05-27
Repository: `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`
Audited baseline before this documentation update: `23e13bc`

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
| Test suite passes or known failures are explicitly documented | Closed with documented failures | `npm test` currently fails; known failures are listed below. |

## Gate Results

| Command | Result | Notes |
|---|---:|---|
| `npm run lint` | Passed | No ESLint failures. |
| `npm run build` | Passed | Non-blocking warnings remain: Supabase generated types out of sync in non-strict mode; Browserslist data stale. |
| `npm run contracts:build` | Passed | Shared TypeScript contract package builds. |
| `npm test` | Failed | Vitest JSON summary: 18 failed tests, 1250 passed, 2 skipped. |

## Known Test Failures

The current full test-suite failures are documented here to satisfy the Phase 0
exit rule. They must not be treated as green validation.

- `src/i18n/homepage-cards-faq-ru.test.tsx`: expects visible `Смотреть` copy on
  live offer cards; current card contract renders clickable cards without that
  visible CTA text.
- `src/i18n/locale-all-routes-ru.test.tsx`,
  `src/i18n/locale-persists-across-routes.test.tsx` and
  `src/i18n/no-english-leak.ru.test.tsx`: expect older `/offers` title copy
  (`Все оптовые предложения`) that is not present in the current route output.
- `src/i18n/locale-footer-links-ru.test.tsx`: footer anchor section-title
  expectation no longer matches the current homepage section markup.
- `src/i18n/locale-notfound-testid-ru.test.tsx`: expects `[data-testid=page-title]`
  to equal `404`; current localized NotFound title is `Не нашли такую страницу`.
- `src/i18n/locale-persists-e2e-clicks.test.tsx`: click-driven locale test looks
  for old visible navigation text `Регистрация`.
- `src/i18n/locale-post-signin-account-screens-ru.test.tsx` and
  `src/i18n/locale-survives-signin.test.tsx`: sign-in locale persistence tests
  currently fail with stack-trace-only Vitest failures and need focused
  reproduction.
- `src/i18n/offers-numeric-format-ru.test.tsx`: expects numeric price cards on
  `/offers`; current locked-buyer catalog contract can render locked price copy
  instead of numeric prices.
- `src/components/catalog/CatalogOfferRow.analyticsLiveRegion.test.tsx`: expects
  RU live-region heading copy (`Аналитика по офферу`); current test render emits
  English `Offer analytics: ...`.
- Vitest also reports an unhandled rejection from `RegisterReady` through
  `BuyerSessionContext not mounted` during `src/lib/registration-funnel.e2e.test.tsx`.

## Closure Decision

Backend Phase 0 closure audit is complete.

Status: **closed with documented exceptions**.

This means the contract, route map, environment sample, self-hosted backend
surface and primary build/lint/contract gates are in place. It does not mean the
repository is fully green. Before Phase 1 is treated as production-ready, the
known test failures above should be resolved or intentionally replaced with
updated test contracts that match the current UI/access behavior.

## Recommended Next Step

Run a focused Phase 0 remediation pass for the documented test failures, then
start Backend Phase 1: Account Source Of Truth.
