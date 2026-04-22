

# План: Контракты Phase 0 — Analytics + Backend (Registration + Marketplace)

Реализуем три направления последовательно, каждое — самостоятельный шаг с приёмкой. Все три используют один и тот же стиль контрактов: типы → моки → адаптер → подключение UI → документация.

---

## Шаг 1. Analytics Contract v1

**Что делаем:** превращаем `analytics.ts` из «свободного track()» в строгий типизированный контракт с провайдер-адаптером и публичной документацией.

**Изменения в коде:**
- `src/lib/analytics.ts` — рефакторинг:
  - Per-event payload типы: каждое событие из `AnalyticsEvent` получает свой интерфейс (например, `LiveOfferCardClickPayload { offerId; supplierId; species; position; surface }`).
  - Перегрузка `track<E extends AnalyticsEvent>(event: E, payload: PayloadFor<E>)` — TS требует именно нужные поля.
  - Базовые поля (`timestamp`, `language`, `url`, `sessionId`, `userRole`) добавляются автоматически.
  - `sessionId` — UUID в `sessionStorage`, генерится один раз на сессию.
- `src/lib/analytics-provider.ts` (новый) — адаптер:
  - Интерфейс `AnalyticsProvider { send(event, payload): void }`.
  - Реализации: `ConsoleProvider` (dev), `NoopProvider` (prod-заглушка), `BatchProvider` (буфер + `navigator.sendBeacon` на `/api/analytics`).
  - Конфиг через `import.meta.env.VITE_ANALYTICS_PROVIDER`.
- Аудит существующих вызовов `analytics.track(...)` по проекту — добавить недостающие payload-поля под новые типы.

**Документация:**
- `.lovable/analytics-contract.md` — таблица: `event | trigger | surface | payload | KPI`.
  - KPI-колонка: `traffic +411%` / `registration +539%` / `retention +361%` / `trust +300%`.
  - Naming-конвенция: `surface_object_action`, snake_case.
  - Группировка: Landing, Offers, Registration, Auth, Scroll/Section, Future.

**Приёмка:** `tsc` ловит вызовы с неправильным payload; в console.log в dev видны обогащённые события; doc открывается и читается.

---

## Шаг 2. Backend Contract v1 — Registration (доводка)

**Что делаем:** в `api-contracts.ts` уже есть 9 операций и моки, но UI регистрации их **не использует** — пишем напрямую в `RegistrationContext` и `toast.success`. Подключаем моки и расширяем error-кейсы.

**Изменения в коде:**
- `src/lib/api-contracts.ts` — расширение моков:
  - Реалистичные ошибки по триггерам: email `taken@yorso.test` → `EMAIL_ALREADY_EXISTS`; код `123456` → success, иначе `INVALID_CODE`; rate-limit после 5 запросов кода (in-memory счётчик); 5% случайный `SERVER_ERROR` для отладки UI ошибок (флаг `VITE_MOCK_FLAKY`).
  - Логические переходы: `verifyEmail` нельзя вызвать без `startRegistration` (несуществующий `sessionId` → `VERIFICATION_FAILED`).
- Подключение в страницы:
  - `RegisterEmail.tsx` → `authApi.startRegistration` + loading state на кнопке + inline error по `field`.
  - `RegisterVerify.tsx` → `authApi.verifyEmail` + `authApi.requestPhoneVerification` (resend code).
  - `RegisterDetails.tsx` → `authApi.submitDetails` + `authApi.verifyPhone`.
  - `RegisterOnboarding.tsx` → `authApi.submitOnboarding`.
  - `RegisterCountries.tsx` → `authApi.submitMarkets`.
  - `RegisterReady.tsx` → `authApi.completeRegistration`.
  - `SignIn.tsx` → `authApi.signIn` + `requestPasswordReset`.
- `RegistrationContext` — хранить `sessionId`, возвращаемый `startRegistration`, прокидывать в последующие вызовы.
- Унифицированный хук `useApiCall()` — обёртка над `ApiResult<T>`, возвращает `{ loading, error, run }`, дергает `analytics.track('api_error', ...)` при `ok:false`.

**Документация:**
- `.lovable/backend-contract-registration.md` — endpoint, payload, success, error-codes, mock-триггеры, frontend state-машина.

**Приёмка:** все 7 шагов регистрации идут через `authApi.*`; ошибки рендерятся inline; refresh страницы сохраняет `sessionId`; mock-триггеры (`taken@yorso.test`, код `123456`) работают.

---

## Шаг 3. Backend Contract v1 — Marketplace

**Что делаем:** новый файл контрактов для каталожной части + перевод страниц `/offers`, `/offers/:id`, `/supplier/:slug` (если будет), `LiveOffers` на моки.

**Изменения в коде:**
- `src/lib/marketplace-contracts.ts` (новый) — 6 операций:
  1. `GET /api/offers` — `listOffers(filters, pagination, sort)` → `{ items: OfferSummary[]; total; page; pageSize; facets }`.
  2. `GET /api/offers/:id` — `getOfferDetail(id)` → `OfferDetail` (специф., галерея, supplier, terms).
  3. `GET /api/suppliers/:slug` — `getSupplierProfile(slug)` → `SupplierProfile` (verification, certs, products, activity).
  4. `POST /api/price-access/request` — `requestPriceAccess({ offerId, message })` → `{ requestId, status: 'pending' }`.
  5. `GET /api/price-access/status?offerId=` — `getPriceAccessStatus(offerId)` → `'none'|'pending'|'approved'|'rejected'`.
  6. `GET /api/offers/featured` — для `LiveOffers` на homepage.
  - Типы переиспользуют существующие из `mockOffers.ts` (`SupplierInfo`, `ProductSpecs`, `CommercialTerms`, `GalleryImage`).
  - Error-codes: `OFFER_NOT_FOUND`, `SUPPLIER_NOT_FOUND`, `PRICE_ACCESS_DENIED`, `PRICE_ACCESS_ALREADY_REQUESTED`, `AUTH_REQUIRED`.
  - Моки читают из `src/data/mockOffers.ts` + имитируют пагинацию/фильтрацию/задержку 300–800мс.
  - `requestPriceAccess` хранит state в `sessionStorage` (`yorso_price_access`), чтобы статус сохранялся между переходами.
- Подключение страниц:
  - `Offers.tsx` → `marketplaceApi.listOffers` с loading-skeleton, empty-state, error-state.
  - `OfferDetail.tsx` → `marketplaceApi.getOfferDetail` + `getPriceAccessStatus` + кнопка `requestPriceAccess` (если не залогинен → `AUTH_REQUIRED` → редирект на `/register?return=...`).
  - `LiveOffers.tsx` → `marketplaceApi.getFeaturedOffers`.

**Документация:**
- `.lovable/backend-contract-marketplace.md` — endpoint × payload × error × mock-trigger × состояние UI.

**Приёмка:** каталог рендерится из мок-API (видна задержка/skeleton); фильтры идут через payload; price access флоу работает с persisted статусом; ошибочные id показывают 404-state.

---

## Технические детали

```text
src/
├── lib/
│   ├── analytics.ts                  ← Шаг 1: типизированные payload'ы
│   ├── analytics-provider.ts         ← Шаг 1 (новый): адаптер
│   ├── api-contracts.ts              ← Шаг 2: расширение моков и error-кейсов
│   ├── marketplace-contracts.ts      ← Шаг 3 (новый)
│   └── use-api-call.ts               ← Шаг 2 (новый): хук-обёртка
├── pages/register/*.tsx              ← Шаг 2: подключение authApi
├── pages/Offers.tsx                  ← Шаг 3
├── pages/OfferDetail.tsx             ← Шаг 3
└── components/landing/LiveOffers.tsx ← Шаг 3

.lovable/
├── analytics-contract.md             ← Шаг 1
├── backend-contract-registration.md  ← Шаг 2
└── backend-contract-marketplace.md   ← Шаг 3
```

**Принципы для всех шагов:**
- Никакого реального бэкенда, БД, Supabase, auth.
- Все моки — чистые функции с `delay()`, без сетевых вызовов.
- Все state — `sessionStorage` с safe-parsing.
- Контракты — single source of truth: типы экспортируются и переиспользуются в UI.
- Каждый mock-триггер задокументирован в md (чтобы можно было руками протестировать ошибки).
- `import.meta.env.VITE_*` флаги: `VITE_ANALYTICS_PROVIDER`, `VITE_MOCK_FLAKY`, `VITE_MOCK_LATENCY_MS`.

---

## Порядок и точки одобрения

1. **Шаг 1 (Analytics)** — самый изолированный, ничего не ломает в UI. Делаем первым.
2. **Шаг 2 (Registration)** — затрагивает 7 страниц регистрации, нужна аккуратная миграция. Делаем вторым, чтобы новые ошибки уже трекались через Analytics из Шага 1.
3. **Шаг 3 (Marketplace)** — самый большой по объёму UI-изменений. Делаем последним, моки покроют каталог целиком.

После каждого шага — короткий чек-лист приёмки, прежде чем двигаться дальше.

