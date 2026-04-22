# Analytics Contract v1 — чек-лист приёмки

Документ фиксирует, что значит «контракт принят». Делится на три блока:
типы (compile-time), доставка (runtime), KPI-маппинг (бизнес).

Автотесты — `src/lib/analytics.test.ts`, `src/lib/analytics-provider.test.ts`.
Ручные сценарии — раздел «Manual QA» в конце.

---

## 1. Валидация типов (compile-time)

| # | Критерий | Как проверить | Ожидание |
|---|---|---|---|
| T1 | Все события ограничены `EventPayloadMap` | `npx tsc --noEmit` | 0 ошибок |
| T2 | Опечатка в имени события — ошибка компиляции | `analytics.track("foo_bar")` в любом файле | TS2345 |
| T3 | Лишние/недостающие поля payload — ошибка | `analytics.track("hero_search_submit", {})` | TS-ошибка про `query` |
| T4 | События без полей не требуют payload | `analytics.track("hero_primary_cta_click")` | компилируется |
| T5 | `step` для funnel-событий — литерал | `track("registration_email_submitted", { step: 5, ... })` | TS-ошибка (ожидается `2`) |
| T6 | `role` ограничен `UserRole` | `track("registration_role_selected", { role: "admin", step: 1 })` | TS-ошибка |

## 2. Доставка событий (runtime)

| # | Критерий | Как проверить | Ожидание |
|---|---|---|---|
| R1 | Envelope содержит обязательные поля | unit-тест на `track()` | `event`, `timestamp` (ISO), `url`, `language`, `sessionId`, `role`, `payload` |
| R2 | `sessionId` стабилен в рамках вкладки | два `track()` подряд | одинаковый `sessionId` |
| R3 | `role` берётся из `sessionStorage.yorso_registration` | сет роли → `track()` | `role === "buyer"` |
| R4 | Сбой провайдера не ломает приложение | провайдер бросает в `send` | вызов `track()` не кидает |
| R5 | Console-провайдер логирует с префиксом | смотрим вывод | `[YORSO Analytics] <event>` |
| R6 | Batch-провайдер буферизует и флашит | 20 событий → flush; pagehide → flush | `sendBeacon` вызван 1 раз с `{events:[...]}` |
| R7 | Scroll-depth срабатывает на 25/50/75 один раз | имитация скролла | три события, без дублей |
| R8 | `setProvider` подменяет провайдер в тестах | `setProvider(stub)` | все `track()` идут в stub |

## 3. Соответствие KPI-маппингу

Источник истины — таблицы в `analytics-contract.md`. Для каждого KPI должен
существовать минимум один event, реально вызываемый в коде.

| KPI | Минимум событий | Где проверяется |
|---|---|---|
| **REG** (+539%) | `registration_role_selected`, `registration_email_submitted`, `registration_email_verified`, `registration_complete` | страницы `src/pages/register/*` |
| **TRAFFIC** (+411%) | `hero_*`, `live_offer_card_click`, `offers_list_view`, `scroll_depth_*` | `Hero`, `LiveOffers`, `Offers` |
| **RET** (+361%) | `signin_*`, `forgot_password`, `registration_onboarding_completed` | `SignIn`, `RegisterOnboarding` |
| **TRUST** (+300%) | `offer_detail_view`, `register_cta_offer_detail`, `phone_verified` | `OfferDetail`, `RegisterVerify` |

Автоматическая проверка: `analytics.kpi.test.ts` сверяет, что для каждого
KPI хотя бы одно из событий встречается в `grep`-сканировании `src/`.

---

## Manual QA (smoke)

Откройте DevTools Console, `VITE_ANALYTICS_PROVIDER=console` (DEV по умолчанию).

1. **Funnel happy-path.** `/register` → выбрать роль → email `qa@yorso.test` →
   код `123456` → details → onboarding → countries → ready.
   Ожидание: 4 ключевых события (`role_selected`, `email_submitted`,
   `email_verified`, `complete`) с **одним** `sessionId`, `step` = 1/2/3/7,
   `funnelDurationMs` > 0 на финале.
2. **Email error path.** Email `taken@yorso.test` → submit.
   Ожидание: `api_error` с `code:"EMAIL_ALREADY_EXISTS"`, без
   `registration_email_submitted` (или после исправления — с ним; зафиксировать).
3. **Hero CTA.** Кликнуть «Register free» → событие `hero_primary_cta_click`.
4. **Live offer.** Клик по карточке → `live_offer_card_click` с `offerId`,
   `product`, `position`.
5. **Scroll depth.** Проскроллить главную до 80% → ровно три события
   `scroll_depth_25/50/75`, без повторов при обратном скролле.
6. **Persistence.** F5 на середине регистрации → `sessionId` сохраняется,
   следующий `track()` использует тот же id.
7. **Provider swap.** В консоли `sessionStorage.clear()` и перезагрузка —
   `sessionId` новый, события продолжают идти.

## Definition of Done

- [ ] `npx tsc --noEmit` — зелёный
- [ ] `vitest run src/lib/analytics*.test.ts` — зелёный
- [ ] Manual QA сценарии 1–7 пройдены в DEV
- [ ] Все события из `analytics-contract.md` либо вызываются в `src/`,
      либо помечены как Legacy
- [ ] KPI-таблица выше — все 4 строки имеют ≥1 живой event
