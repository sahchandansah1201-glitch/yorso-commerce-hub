# План/факт по Lovable prompt и ответам

Обновлено: 2026-06-12

## Назначение

Этот файл фиксирует каждый prompt для Lovable и каждый ответ Lovable в
табличной форме. Цель: видеть реальный прогресс по batch, не полагаться на
память чата и не смешивать запрошенное с фактически проверенным.

## Правила

- Строка добавляется только когда есть конкретный prompt для Lovable или
  конкретный ответ Lovable.
- Нельзя отмечать пункт как выполненный только потому, что он был указан в
  prompt.
- В колонке `Факт / проверено` должны быть реальные файлы, маршруты, тесты или
  команды.
- Если пункт взят только из ответа Lovable и локально не перепроверен, писать
  `сообщено Lovable, локально не перепроверено`.
- Если локальная проверка была, указывать команду или точный файловый чек.
- Если пункт не реализован, неизвестен или pending, писать это прямо.
- В каждом будущем ответе по batch использовать русскую таблицу:
  `План`, `Факт / проверено`, `Будет реализовано`, `Статус точности`.

## Таблица прогресса

## Закрытие серии Prompt 0-6 / P1A-P1B

Серия закрыта по факту GitHub `main` на `dcc15b22` и локальной проверки в
`/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`.

| Prompt / scope | Решение | Факт / проверено | Статус |
|---|---|---|---|
| Prompt 0 — Plan First For P0/P1/P2 | Принять как planning artifact, не как реализацию. | План был передан пользователем скриншотом; кодовых изменений по Prompt 0 не ожидалось. | Закрыт как planning-only. |
| Prompt 1 — P0A Account Primitives And Routes | Принять. | Локально подтверждены `src/components/account/AccountShell.tsx`, `AccountSidebar.tsx`, `AccountActionBar.tsx`, `AccountEmptyState.tsx`, `AccountField.tsx`, `AccountCompletionCard.tsx`; маршруты `/account` -> `/account/personal` и `/account/:section` есть в `src/App.tsx`. | Закрыт. |
| Prompt 2 — P0B Personal Read/Edit Mode | Принять как уже покрытый существующей реализацией. | Локально подтверждены `EditableCard` и `PersonalSection` в `src/pages/account/Account.tsx`; read/edit значения рендерятся через `renderView`/`renderEdit`; тестовые файлы `Account.test.tsx` и `Account.editable.test.tsx` присутствуют. | Закрыт. |
| Prompt 3 — P1A Products Tab MVP | Не принимать исходный P1A как полный результат; принять только после follow-up. | Исходный отчёт Lovable сам фиксировал незакрытое: workbook не был подключён, mobile row-cards и delete confirm требовали follow-up. Позже закрыто через P1A.1, P1A.2, P1A.3 и P1B. | Закрыт через follow-up batch-и. |
| P1A.1 — Products Mobile Scanability | Принять. | Локально подтверждены `account-products-mobile-cards`, desktop table remains md+, mobile cards use existing handlers; e2e `/account/products` позже прошёл 20/20. | Закрыт. |
| P1A.2 — Products Delete Confirmation | Принять. | Локально подтверждён `pendingDeleteProduct`, dialog `account-product-delete-confirm`, cancel/confirm flows; `e2e/account-products-crud.spec.ts` покрывает desktop/mobile delete. | Закрыт. |
| P1A.3 — Products Latin-first Identity | Принять. | Локально подтверждён picker hookup, `productTaxonomyDisplay`, Latin-first table/cards/detail/delete, `searchCatalog` и catalog test; `e2e/account-products-crud.spec.ts` прошёл 20/20. | Закрыт. |
| P1B — Products Picker Usability & Search Confidence | Принять. | Локально подтверждён `dcc15b22`: `AccountProductCatalogPicker` показывает Latin-first results, selected summary, empty state; `npm test` focused 11/11, `check:provider-boundary`, `tsc`, `build`, Playwright e2e 20/20, desktop/mobile screenshots via Playwright. | Закрыт. |
| Prompt 4 — Sticky mobile account nav chips | Принять. | Локально подтверждено: `AccountShell` рендерит sticky mobile chips; `AccountSidebar` uses real `NavLink`, `min-h-11`, `scrollIntoView` guard. | Закрыт. |
| Prompt 5 — P2A Home Overflow Fix | Принять. | Локально подтверждено: `src/index.css` содержит `overflow-x: clip`; `MarketplaceActivity.tsx` содержит `min-w-0 flex-1 break-words`. | Закрыт. |
| Prompt 6 — P2B Steering Dashboard Density Cleanup | Оставить skipped/deferred. | Локально подтверждено: в этом repo нет `/agents` route и `src/components/steering/agent-directory.tsx`; prompt был не применим к `yorso-commerce-hub`. | Закрыт как skipped/deferred. |

### Ошибки и drift, обнаруженные в серии

| Проблема | Факт | Решение |
|---|---|---|
| Lovable путал актуальный HEAD | В P1B отчёте был указан `HEAD: 4c43ef0b`, фактический GitHub после sync был `dcc15b22`. | Принимать Lovable отчёт только после `git fetch`, сравнения `HEAD/origin/main` и локальных checks. |
| Supabase scaffold возвращался автоматически | Несколько sync-коммитов возвращали `src/integrations/supabase/*` и `supabase/config.toml`, несмотря на отчёты Lovable “provider-free clean”. | Зафиксировано в `.gitignore`; `provider-free-tooling-retirement.test.ts` проверяет retired path guards; `check:provider-boundary` обязателен перед принятием sync. |
| P1A исходно был неполным | Workbook-backed picker, mobile cards и delete confirm не были закрыты первым ответом Lovable. | Закрыто отдельными scoped batch: P1A.1, P1A.2, P1A.3, P1B. |
| Browser MCP нестабилен | Browser MCP падал с `Transport closed`. | Browser MCP исключён из acceptance gates; замена: Playwright e2e/scripts/screenshots + overflow metrics. |

### Обязательный sync-gate для следующих Lovable batch

1. `git fetch origin`.
2. Сравнить `HEAD` и `origin/main`.
3. Проверить `git diff --name-status HEAD..origin/main` до pull.
4. После pull проверить:
   - `src/integrations/supabase/` отсутствует;
   - `supabase/` отсутствует;
   - `@supabase/supabase-js` отсутствует в package/lockfiles.
5. Запустить минимум:
   - `npm run check:provider-boundary`;
   - focused tests по изменённому scope;
   - `npx tsc -b --noEmit` при TS/UI logic изменениях;
   - `npm run build`.
6. Для UI scope использовать Playwright, а не Browser MCP:
   - desktop screenshot;
   - mobile `390x844` screenshot;
   - `document.body.scrollWidth <= document.documentElement.clientWidth`.

| Дата | Batch / prompt | Источник ответа Lovable | План | Факт / проверено | Будет реализовано | Статус точности |
|---|---|---|---|---|---|---|
| 2026-05-28 | Phase 0 Remediation sync / commit `dc5ab55` | Пользователь передал отчёт Lovable sync по Phase 0 Remediation | Синхронизировать Lovable с `main` на Phase 0 remediation commit `dc5ab55`. Проверить, что Phase 0 закрыта зелёными гейтами, предыдущие 18 failures устранены, safeguards #110-#141 сохранены, Batch #112 code splitting и Batch #113 route chunk error boundary не изменены. | Локально проверено: commit `dc5ab55` существует в истории как `[codex] Remediate backend Phase 0 test contracts`; `git show --stat dc5ab55` подтверждает изменения в RU/i18n tests, sign-in locale tests, registration funnel, catalog price/category localization, Supabase access/RLS smoke tests и project-memory. `docs/backend/phase-0-closure-audit.md` подтверждает `npm test` 184 files / 1268 passed / 2 skipped, `npm run lint`, `npm run build`, `npm run contracts:build`, отсутствие known Phase 0 failures, warnings Supabase types/Browserslist. Текущий `main` уже новее (`a8eb4b0`), но включает `dc5ab55`. | По Phase 0 Remediation ничего не осталось. Следующий запланированный workstream уже уточнён после audit: Backend Phase 1A Account Session Authority Gate, а не общий Phase 1. | Факт commit/files/docs проверен локально через `git log`, `git show`, `rg`. Полные команды `npm test`, `npm run lint`, `npm run build`, `npm run contracts:build` заново не запускались; их статус указан по Phase 0 audit document и переданному отчёту Lovable. |
| 2026-05-28 | Batch #141 / `docs/project-memory/PROMPTS/prompt-141-lovable-sync.md` | Пользователь передал отчёт Lovable sync по Batch #141; дополнительно выполнены локальные файловые проверки 2026-05-28 | Синхронизировать Lovable с GitHub `main` после Batch #141. Проверить локализованные имена кнопок закрытия public catalog sheet/drawer в RU/ES. Сохранить поведение catalog drawer, access gating, supplier identity redaction, exact-price locks, public SEO, Batch #112 code splitting, Batch #113 route chunk boundary и safeguards #110-#140. | Локально проверено по файлам: `src/components/ui/sheet.tsx` содержит optional `closeLabel` с default `Close`; `src/components/catalog/CompareTray.tsx` и `src/components/catalog/IntelligenceRail.tsx` передают `closeLabel={t.aria_close}`; `src/components/catalog/SheetCloseLocale.test.tsx`, `e2e/public-sheet-close-locale-a11y.spec.ts`, package smoke scripts и Batch #141 production-scale notes присутствуют. Lovable сообщил clean sync, отсутствие конфликтов, отсутствие локальных изменений, сохранение поведения catalog drawer и известных warning-ов. | По Batch #141 ничего не осталось. Следующий не-Lovable workstream: Backend Phase 1A Account Session Authority Gate из `docs/backend/phase-1-account-source-of-truth-discovery-audit.md`. | Проверено по repository files через `rg` и чтение файлов. Runtime/e2e заново в этом tracker update не запускались; pass counts остаются из предыдущей Batch #141 validation и ответа Lovable. |
| 2026-06-11 | Prompt P1A.2 / Products Delete Confirmation | Codex отправил Lovable build prompt `docs/project-memory/PROMPTS/prompt-p1a2-products-delete-confirmation-lovable-build.md`; пользователь передал ответ Lovable и затем локальная проверка выявила расхождения | Реализовать подтверждение удаления одного `CompanyProduct` во вкладке `/account/products`: desktop table delete и mobile card delete должны открывать confirmation dialog; cancel не удаляет; confirm переиспользует существующий delete handler; не менять backend/auth/storage/catalog/Supabase. | Локально проверено: `src/pages/account/Account.tsx` содержит `pendingDeleteProduct`, desktop/mobile delete вызывают `setPendingDeleteProduct(...)`, dialog `account-product-delete-confirm` показывает product/Latin/role/state и confirm вызывает `deleteProduct(target.id)`. `e2e/account-products-crud.spec.ts` обновлён: desktop cancel/confirm и mobile 390px cancel/confirm. `E2E_USE_WEB_SERVER=1 npx playwright test e2e/account-products-crud.spec.ts --project=chromium` — 19 passed. | После commit/push: подтянуть GitHub `main` в Lovable и визуально проверить `/account/products`. Undo/toast после удаления — отдельный scope, если потребуется. | Проверено локально по файлам и e2e. |
| 2026-06-11 | P1A.2 provider-free remediation после ответа Lovable | Lovable сообщил, что удалил `src/integrations/supabase/`, `supabase/` и очистил `.env`; локальная проверка показала, что это не полностью совпало с деревом | Убедиться, что кодовая база Lovable/GitHub/local остаётся self-hosted/provider-free и не возвращает retired Supabase scaffold. | Локально проверено и исправлено: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `supabase/config.toml` удалены; tracked `.env` удалён, `.env` добавлен в `.gitignore`; `src/test/provider-free-tooling-retirement.test.ts` читает `.env` только если он tracked в git и всё ещё запрещает SUPABASE refs в tracked env. `npm test -- src/test/provider-free-tooling-retirement.test.ts src/test/self-hosted-backend-policy.test.ts` — 5 passed; `npm run test:backend-contract` — 101 passed; `node scripts/check-provider-production-boundary.mjs` — passed. | В каждом следующем Lovable sync перед принятием результата запускать provider-free tests/guard. | Проверено локально; исходное утверждение Lovable было неточным для локального дерева. |
| 2026-06-11 | P1A.3 / Products catalog picker hookup and delete copy cleanup | Пользователь задал контрольные вопросы по Latin name usage/search и указал, что delete dialog copy слишком длинная; затем уточнил, что продукт надо показывать Latin-first и commercial name в скобках | Проверить, где используется Latin name; подтвердить, может ли пользователь искать по коммерческому названию и получать Latin name из справочника; подключить picker; сократить текст delete confirmation; показывать product identity как `Latin (commercial)`. | Локально проверено: `AccountProductCatalogPicker` и `searchCatalog` существовали, но picker не был подключён в `Account.tsx`. Исправлено: picker смонтирован в add/edit form; результат показывает `Scomber scombrus (Atlantic mackerel)`; выбор заполняет `commercialName=Atlantic mackerel` и `latinName=Scomber scombrus`; desktop table, mobile cards, detail panel и delete context показывают `Latin (commercial)`; delete title/description сокращены в EN/RU/ES. `npm test -- src/lib/account-product-catalog.test.ts` — 6 passed; account tests — 35 passed; `npx tsc -b --noEmit` — passed; `npm run lint` — passed with 4 existing warnings; `npm run build` — passed; `e2e/account-products-crud.spec.ts` — 20 passed. | После commit/push синхронизировать Lovable и визуально проверить `/account/products`. Возможный следующий scope: full ARIA combobox keyboard navigation/ranking. | Проверено локально; предыдущий claim “picker embedded” был неточным до этого fix. |
| 2026-06-12 | Prompt P1A.3 sync + Prompt 6 skipped/deferred notice | Пользователь передал скрин отчёта Lovable: `Sync чистый`, Prompt 6 зафиксирован как skipped/deferred, HEAD `f855eb56`, files changed by Lovable `0`, TypeScript/build не запускался | Сообщить Lovable, что Prompt 6 уже skipped/deferred, и синхронизировать применимый текущий scope P1A.3 `/account/products` без новых feature-правок. | Локально проверено после `git fetch`: remote `origin/main` был впереди до `cd0414fe`; commit `f855eb56` фактически добавил обратно `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `supabase/config.toml`, несмотря на утверждение Lovable `Provider-free guard`. Выполнен fast-forward pull, stale Supabase scaffold удалён снова, создан prompt-файл `docs/project-memory/PROMPTS/prompt-p1a3-products-sync-and-prompt6-skipped-lovable.md`. | Закоммитить provider-free correction и prompt traceability после проверок; затем отправить/синхронизировать GitHub. | Отчёт Lovable был неточным: `Files changed by Lovable: 0` и `src/integrations/supabase/ нет` не соответствовали GitHub diff. |
| 2026-06-12 | Lovable sync after `8bb0397c` | Пользователь передал скрин отчёта Lovable: workspace на `8bb0397c`, проверки проходят, `src/integrations/supabase/` и `supabase/` отсутствуют, files changed `0` | Принять sync только если GitHub/local подтверждают provider-free state. | Локально проверено после `git fetch`: remote снова ушёл вперёд до `c0f98a53`, а diff `8bb0397c..c0f98a53` снова добавил `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `supabase/config.toml`. Исправлено повторно: Supabase scaffold удалён, `.gitignore` получил retired path guards `src/integrations/supabase/` и `supabase/`, `provider-free-tooling-retirement.test.ts` теперь проверяет эти guards. | Закоммитить и запушить повторный correction. Сообщить Lovable: не использовать `Try to fix` для этой build-card, пока он генерирует Supabase scaffold. | Отчёт Lovable снова был неточным относительно GitHub diff; теперь добавлен дополнительный guard против untracked автогенерации. |

## Обязательный формат таблицы в будущих ответах по batch

| Зона | План | Факт / проверено | Будет реализовано | Статус точности |
|---|---|---|---|---|
| Prompt | Что prompt просил Lovable синхронизировать или реализовать. | Подтверждённый prompt file/path. | Что в prompt ещё не закрыто. | `Проверено`, `только сообщено Lovable`, `неизвестно` или `pending`. |
| Ответ Lovable | Что Lovable сообщил в отчёте. | Какие пункты ответа проверены по файлам/маршрутам/тестам. | Что осталось нерешённым или требует follow-up. | Точное основание: файл, команда, route check или “не перепроверено”. |
| Реализация | Ожидаемые изменения в коде/docs/tests. | Реальные файлы/routes/tests, которые присутствуют. | Следующий scoped implementation. | Локальная проверка или честная оговорка. |
| Safeguards | Какие ограничения и сохранённое поведение должны остаться. | Какие safeguards проверены или только сообщены. | Что нужно перепроверить в следующем batch. | Не называть локально проверенным то, что не проверялось. |
