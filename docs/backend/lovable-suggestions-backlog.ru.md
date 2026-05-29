# Backlog предложений Lovable

Статус: active triage log
Назначение: русская версия для проверки человеком
Связанные документы:

- `docs/backend/access-control-matrix.ru.md`
- `docs/backend/frontend-backend-contract.md`
- `docs/backend/supabase-migration-to-types-flow.ru.md`
- `docs/backend/yorso-backend-implementation-plan.ru.md`

## 1. Зачем нужен этот документ

Lovable после синхронизации или тестов часто предлагает дополнительные работы.
Часть предложений полезна, но их нельзя внедрять автоматически.

Правило:

- внедрять сразу, если предложение маленькое, проверяемое и усиливает текущий
  access/security contract;
- переносить в backlog, если оно полезное, но не блокирует текущий этап;
- переносить в backend phase, если нужна реальная база, RLS, API или storage;
- отклонять, если это scope creep и не улучшает buyer/supplier workflow.

Значение пункта:

Так мы используем Lovable как источник идей и проверок, но не позволяем ему
расширять продукт хаотично. Решение о реализации остается за нами.

## 2. Текущие предложения Lovable

| ID | Предложение | Решение | Статус | Почему |
|---|---|---|---|---|
| LVB-001 | Проверить SSR leaks SupplierProfile | Внедрено | Done in PR #8 | Защищает от утечек locked supplier data через HTML/head. |
| LVB-002 | Расширить locked DOM tests | Внедрено | Done in PR #8 | Усиливает frontend access contract до появления backend. |
| LVB-003 | Добавить e2e access check | Внедрено | Done in current PR | Проверяет anonymous, registered, qualified и downgrade flows в реальном app shell. |
| LVB-004 | Защитить доступ на уровне API | Backend foundation начат | Backend P0 in progress | Таблицы access grants/requests/events и helper-функции добавлены, но frontend adapters еще нужно перевести на backend API. |

Значение пункта:

Первые три пункта закрывают frontend-уровень проверки access contract: DOM,
head/HTML и browser-level route behavior. API-защиту нельзя полноценно сделать
без backend, поэтому она остается обязательной задачей backend P0.

## 3. Выполнено: E2E Access Check

Цель:

- проверить access behavior в запущенном приложении, а не только unit/jsdom
  тестами.

Реализованный scope:

- route: `/suppliers/:supplierId`;
- состояния: `anonymous_locked`, `registered_locked`, `qualified_unlocked`;
- переход: `qualified_unlocked` обратно в `registered_locked`;
- проверки:
  - locked states не показывают real company name, website, WhatsApp, legal
    data, exact active offer count или ItemList JSON-LD;
  - locked states показывают public production capability facts и public
    trade/logistics terms;
  - qualified state показывает real supplier identity и contact actions;
  - downgrade удаляет stale real identity и ItemList JSON-LD из `<head>`.

Значение пункта:

Unit tests подтверждают компонентную логику. E2E нужен, чтобы поймать ошибки
реального роутинга, storage, head metadata и состояния страницы в браузере.

Реализация:

- тест: `e2e/supplier-profile-access.spec.ts`;
- Playwright config использует `/bin/chromium` только если он существует, иначе
  переключается на bundled Playwright browser;
- тест падает, если locked state раскрывает company name, website, WhatsApp,
  legal values, exact active-offer count или ItemList JSON-LD.

Значение пункта:

Теперь у нас есть проверка не только компонентов, но и реального маршрута
`/suppliers/:supplierId` в браузере. Это снижает риск, что Lovable или Codex
случайно вернут утечку через storage, SEO/head metadata или downgrade-сценарий.

## 4. Backend P0: API-Level Access Protection

Цель:

- перенести access enforcement из frontend mock behavior в backend source of
  truth.

Нужные backend pieces:

- `suppliers_public`, `suppliers_registered`, `suppliers_qualified`,
  `suppliers_owner`;
- `offers_public`, `offers_registered`, `offers_qualified`, `offers_owner`;
- `supplier_access_requests`, `price_access_requests`, `access_grants`,
  `access_events`;
- helper functions:
  - `has_supplier_access(user_id, supplier_id)`;
  - `has_offer_price_access(user_id, offer_id)`;
  - `has_document_access(user_id, document_id)`.

Acceptance:

- locked API responses не содержат restricted supplier values;
- qualified API responses содержат только grant-scoped data;
- RLS tests покрывают public, registered, qualified, supplier owner и admin;
- frontend больше не получает raw restricted data для locked states.

Значение пункта:

Frontend blur и DOM tests защищают прототип, но не являются настоящей
безопасностью. Production-уровень начнется только тогда, когда backend перестанет
возвращать закрытые данные locked-пользователям.

Текущий foundation:

- миграция: `supabase/migrations/20260511130000_backend_access_foundation.sql`;
- таблицы: `supplier_access_requests`, `access_grants`, `access_events`;
- helper-функции: `has_supplier_access(user_id, supplier_id)`,
  `has_offer_price_access(user_id, offer_id)`;
- прямое anonymous-чтение базовых таблиц `offers` и `suppliers` отозвано,
  безопасные public views остаются доступными.

Значение пункта:

Это первый backend-слой, который соответствует уже созданному frontend access
model. Но он еще не означает полный production backend: frontend adapters пока
должны быть переведены с localStorage/mock state на реальные request/grant
статусы.

Прогресс по adapters:

- Устаревшее Supabase-направление закрыто в Backend Phase 3B: `src/lib/supplier-access-api.ts`
  больше не подключается к Supabase auth/RLS и не вызывает
  `supplier_access_requests` / `log_supplier_access_event` через Supabase.
- Production path для Supplier Access Flow теперь идет через self-hosted
  `/v1/access/*`; при отсутствии `VITE_YORSO_API_URL` остается только local
  preview mock, чтобы Lovable preview и прототип не ломались.
- Access event hardening добавляет composite indexes для audit queries по
  request/supplier/actor/target и отклоняет не-object metadata payloads в RPC.
- `access_events_admin` дает read-only admin audit view с контекстом actor,
  target, supplier, offer, request и grant. Non-admin users получают пустой
  результат.
- `npm run check:supabase-types` остается non-strict preview/build guard,
  потому что Lovable может регенерировать `types.ts` из своего Supabase schema.
  Команда сообщает о drift, но не блокирует сборку приложения.
- `src/lib/supplier-access-api.ts` содержит frontend contract для self-hosted
  Supplier Access backend и не использует untyped Supabase calls.
- `npm run check:supabase-types:strict` является backend-readiness gate. Он
  должен проходить после применения migrations и регенерации `types.ts`; он
  падает, если отсутствуют `access_events`, `access_grants`,
  `supplier_access_requests`, `access_events_admin` или
  `log_supplier_access_event`.
- `npm run supabase:types:regen` регенерирует `types.ts` из project
  `eaasthucczsduwrznrng` и затем запускает strict check. Перед этим pending
  migrations должны быть применены к live Supabase project.
- `npm run supabase:access-preflight` проверяет Supabase CLI, project link,
  доступ текущего Supabase login и strict type status до любых live migration
  commands.
- `docs/backend/supabase-migration-to-types-flow.ru.md` фиксирует обязательную
  последовательность и отдельно запрещает вручную восстанавливать access
  sections в generated `types.ts`.

## 5. Правило triage для будущих предложений Lovable

Каждое новое предложение Lovable нужно классифицировать:

- `Done`: уже внедрено и проверено;
- `P1`: делать скоро, потому что усиливает trust, access или conversion flow;
- `P2`: полезно, но не блокирует текущий этап;
- `Backend P0`: обязательно при старте backend;
- `Rejected`: scope creep, дубликат или конфликт с Project Knowledge.
