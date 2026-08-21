# Next Actions

## Local clean-PC onboarding complete (2026-08-14)

Run `.\scripts\setup-local.ps1 -Pull`, create the first Twenty workspace and
two tokens, then run `.\scripts\configure-local-crm.ps1`. Normal lifecycle is
`start-local.ps1` / `status-local.ps1` / `stop-local.ps1`.

## 2026-08-21 Next Actions After Auth Outbox Runtime Fix

1. Keep local runtime work in
   `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`; `yorso_new` is
   the product name, not the active folder.
2. If auth delivery worker SQL changes again, rerun the targeted SQL test,
   rebuild/recreate the API container, and scan logs over at least two worker
   ticks.
3. Do not start `npm audit fix` without a separate dependency-remediation plan.

Optional future hardening: automate creation of least-privilege Twenty roles.
The simple clean-PC path currently allows both local tokens to use the local
workspace administrator role; production must keep distinct restricted roles.

## Local runtime checkpoint (2026-08-09)

User `/crm` now includes a production-capable **Open full Twenty CRM** button.
Its destination comes from authenticated `GET /v1/crm/full-ui`, not a Vite
URL. This is not SSO: full Twenty still requires its own authorized account.

Local stack is proven. For local work, use
`docs/backend/local-full-stack-runbook.ru.md`, verify `/v1/health/ready`, sign
in as the documented local-only admin, and open `/admin/crm`.

For the user-facing flow, sign out and sign in again so the browser receives
the new `capabilities.crm` field, open the account menu, then choose `CRM`.
Direct route: `http://127.0.0.1:8080/crm`.

The same local admin now also has a full `/account` workspace. A focused
repository guard covers PostgreSQL offset timestamp normalization.

Before production, replace all local-only secrets/admin credentials and run
the Linux-only cutover gates listed below.

## Current Next Action (Twenty CRM)

**Batch T9B1 complete — live PostgreSQL/Twenty adapters + local rehearsal.**
CLI `crm:t9:live:*`, outage/resume, Alice/Bob proof; flags restored false.

**Next (only on explicit command):** Batch T9B2 — VPS/production cutover
(preflight/backup/apply/verify/flag rollout). Do not connect to VPS without
operator cutover inputs.

Plan: `docs/backend/twenty-crm-company-isolation-implementation-plan.ru.md`
Runbook: `docs/backend/twenty-crm-tenant-isolation-t9-rollout.runbook.ru.md`

**Batch T9A complete — backfill/rollout artifacts prepared.**

**Batch T8 complete — adversarial security suite.** Header/UUID/cursor/role/
provider mixed-response/membership-revoke/frontend race/e2e Alice-Bob-Alex-
Admin covered. Mixed-list and multi-header fail-closed fixes landed.
Live proof: `npm run crm:t8:live-proof`.

**Batch T7 complete — frontend active company UX for `/crm`.**

**Batch T5 complete — tenant-isolated read `/v1/crm/*`.** Fail-closed when
`CRM_TENANT_ISOLATION_ENABLED=false` (503).

**Batch T4 complete — tenant-aware links/outbox/mapper/worker.** Migration
`0041_twenty_crm_tenant_scope` adds `tenant_company_id` with quarantine for
orphan/ambiguous rows.

**Batch T3 complete — Twenty tenant fields + verified filters.** Local Twenty
has `yorsoTenantId` / `yorsoRecordKey`; client `*ByTenant` / `*ForTenant`.

**Batch T0 complete — security freeze.** Isolation flags exist and default off;
production forbids user writes without isolation. `/v1/crm/*` runtime unchanged
and still not company-scoped.

**E2B2 complete (2026-08-09):** React detail Sheet Edit/Save/Cancel for Person
`leadStatus`/`crmTags` and Company `crmTags`/`accountOwnerId` (lazy `/owners`);
EN/RU/ES; no Person owner; YORSO API only.

**E2B1 complete (2026-08-09):** `GET /v1/admin/crm/owners`,
`PATCH .../companies/:id`, `PATCH .../people/:id` with Admin CRM key allowlist,
audit without field values; backend gates green.

**E2A.1 complete (2026-08-09):** role `YORSO Admin CRM`, gitignored
`.data/twenty-local-admin-crm-api-key`, env `TWENTY_ADMIN_CRM_API_KEY`,
live workspaceMembers + `accountOwnerId` PATCH verified; frontend/log guards.

**E2A complete (2026-08-09):** Twenty metadata + verified GET/PATCH for
CRM-owned fields; contract/allowlist documented.

**C3 Linux deployment — still blocked on operator inputs**

Needed before cutover:

- SSH host/user
- App / API / CRM domains
- Method to deliver server secrets (no paste into chat/git)

Then: Linux graceful-shutdown smoke, account-postgres smoke with
`MIGRATION_DATABASE_URL`, enable sync, backfill plan/apply on staging DB,
`smoke:twenty-crm:staging`.

## Prior Next Action (Iteration D — complete)

CRM tables inside `/admin/crm`: backend read API, React tabs Companies/People,
detail Sheet, cursor pagination (`starting_after`), e2e + live local proof.
`companyName` remains null (no N+1). No search/edit/SSO.

## Prior Next Action (Iteration C1/C2 — local artifacts complete)

Backfill service/CLI, opt-in staging smoke script, deploy runbook, reverse-proxy
example, and Twenty production guards are in-repo. Live apply/smoke not run
without staging credentials.

## Prior Next Action (Iteration B — complete)

Admin CRM API (`/v1/admin/crm/*`) and React `/admin/crm` with feature flag,
EN/RU/ES copy, retry confirmation, and Playwright smoke are done.

## Prior Next Action (Iteration A — complete)

Worker, scheduler/runtime, metrics, atomic registration/account enqueue, and
`TWENTY_*` config wiring are done. Sync remains disabled by default.

## Prior Next Action (Batch 4.1 — complete)

Streaming bounded body reader and verified equality lookup
(`yorsoId[eq]:"..."`, `yorsoUserId[eq]:"..."`) are available. Person phones
remain omitted.

## Prior Next Action (Batch 4 — complete)

Mapper and HTTP client are done. Person `phones` intentionally omitted until
freeform phone → Twenty PHONES mapping is confirmed. No live Twenty calls in
unit suite.

## Prior Next Action (Batch 3 — complete)

Migration 0038, memory/postgres repositories and focused storage tests are done.
No Twenty HTTP calls exist yet.

## Prior Next Action (P1I)

P1I meta-regions defect fix is the active GitHub handoff.

Open PR: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/196`

Branch: `codex/p1i-meta-regions-country-picker-fix`

This is a frontend-only account workspace fix over `/account/meta-regions`:

- meta-regions require at least 2 countries;
- after selecting one country, the country picker remains ready for the next
  country instead of leaving the user in a dead input state;
- selected countries are excluded from the next result list;
- duplicate countries are blocked;
- removing a selected country still works after adding another country;
- read mode shows country chips and does not expose technical reason/currency
  or `usedFor` enum values;
- no backend, storage, auth, supplier access, catalog source or hosted provider
  behavior was added.

Next operational step: wait for PR #196 GitHub checks, then merge/sync Lovable
only if CI is green. Do not mark P1I accepted from chat or Lovable text alone.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| P1I defect delivery | Deliver the actual meta-region country-picker fix to GitHub/Lovable. | PR #196 opened and locally re-verified after CI blockers were fixed. | Wait for GitHub checks, then merge/sync only if green. |
| Country picker repeated selection | User can add Argentina, immediately search/select Brazil, then save 2+ countries. | Playwright e2e 17/17 plus repeat 14/14; screenshots show Argentina -> Brazil at 390px. | Keep this scenario as required acceptance for future picker changes. |
| Flaky e2e hardening | Avoid `networkidle` waits that can hang on this app. | Meta-regions e2e now waits on account-section UI readiness and persisted text. | Avoid `networkidle` in new account workspace tests unless there is a clear reason. |
| Catalog picker | Дать пользователю выбор продукта из workbook-backed справочника. | Picker подключён к add/edit form; e2e проверяет `Scomber scombrus (Atlantic mackerel)` и заполнение полей. | После commit/push подтянуть GitHub `main` в Lovable. |
| Product identity | Показывать продукт как `Latin (commercial)`, а не заставлять пользователя связывать две разные колонки. | Desktop table, mobile card, detail panel и delete context используют Latin-first product identity; отдельные storage/edit fields сохранены. | После Lovable sync визуально проверить desktop/mobile. |
| Commercial search | Поиск по коммерческому/локализованному названию должен находить Latin name. | `searchCatalog` ищет по `latin`, `en`, `es`, `ru`, `fr`, `cn`, `de`; unit test покрывает EN и RU. | Позже улучшить ranking/keyboard combobox, если понадобится. |
| Delete copy | Уменьшить поясняющий текст в delete dialog. | Title/description сокращены в EN/RU/ES; e2e проверяет отсутствие старого длинного RU текста. | Сохранять structured context: product identity, role, state. |
| Provider-free guard | Не возвращать Supabase scaffold. | Изменения не добавляют backend/provider runtime. | В каждом Lovable sync проверять provider-free tests. |
| Visual QA | Проверять реальный UI без Browser MCP, так как transport нестабилен. | Browser MCP исключён из обязательного процесса; основной путь — Playwright tests/scripts/screenshots. | Сохранять screenshots в `output/playwright/` и указывать overflow result. |

## Next Implementation After Series Closure

Recommended next scoped implementation after closing Prompt 0-6 / P1B:

1. P1C Products Picker Keyboard/A11y & Ranking:
   - make the picker behave as a proper keyboard-accessible combobox/listbox;
   - support ArrowDown, ArrowUp, Enter and Escape;
   - add/verify `aria-expanded`, `aria-activedescendant`, option ids and active
     option state;
   - improve ranking so exact Latin matches come first, then exact commercial
     matches, then localized partial matches;
   - keep the current `Latin (commercial)` identity and selected summary.
2. Later optional scope: product delete undo/toast feedback.

## Local clean-PC next action

- Run `SETUP_LOCAL.cmd` on a genuinely clean Windows + Docker Desktop machine.
- Initialize one Twenty workspace, generate two distinct tokens, run
  `scripts/configure-local-crm.ps1`, then manually verify registration, OTP
  helper, `/crm`, tenant filtering and an allowed CRM field edit.

## Testing Protocol

- Do not use Browser MCP as an acceptance gate for Yorso UI work unless the
  user explicitly asks for it in that turn.
- Primary replacement: Playwright project e2e tests, route-specific Playwright
  scripts and Playwright screenshots.
- For visual UI checks, capture at least desktop and 390px mobile screenshots
  under `output/playwright/` when the change affects rendered layout.
- For mobile scanability, record:
  `document.body.scrollWidth <= document.documentElement.clientWidth`.
- For interaction quality, keep checking nested controls:
  `a button`, `button a`, `a a`, `button button`.
- If a route needs a signed-in session, use the same localStorage/sessionStorage
  setup as the relevant e2e spec instead of relying on manual browser state.

## Guardrails To Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Buyer-first public narrative.
- Access gating: `anonymous_locked`, `registered_locked`, `qualified_unlocked`.
- Supplier identity redaction.
- Exact-price locks.
- Supplier document download grants and file serving remain qualified-only and audit-bound.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase dependency in production paths.

## 2026-08-19 Local Repo / Docker / Twenty Next Actions

1. Keep local development in
   `/Users/istokdmgmail.com/Documents/yorso-commerce-hub-main`; treat
   `yorso_new` as the project/product name.
2. Compose host binding hardening is complete: API, Postgres, PgBouncer,
   Redis and MinIO default to `127.0.0.1` host publishing and guards reject
   wildcard-style mappings. Keep these defaults for server transfer unless
   firewall, private-network or reverse-proxy controls are explicitly ready.
3. Decide a separate dependency-remediation batch for the current production
   `npm audit --omit=dev` findings. Do not run automatic `npm audit fix` inside
   a feature/UI batch.
4. Keep Twenty as the default self-hosted CRM/backoffice surface, but keep
   Yorso API/PostgreSQL as the source of truth and keep Twenty API/admin keys
   out of frontend code and committed project memory.
