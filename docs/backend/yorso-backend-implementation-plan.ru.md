# План реализации backend YORSO

Статус: рабочий архитектурный план
Frontend-репозиторий: `/Users/istokdmgmail.com/Documents/GitHub/yorso-commerce-hub`
Архитектурный workspace: `/Users/istokdmgmail.com/yorso_new`

## 1. Назначение документа

Этот документ описывает, как перевести уже созданный frontend YORSO с mock-данных,
`localStorage` и `sessionStorage` на реальный backend, не ломая разработанные
страницы, UX-логику и access-модель.

Значение пункта:

Backend должен не заменить продукт новой логикой, а стать источником истины для
того интерфейса, который уже спроектирован и реализован:

- главная страница и SEO-страницы;
- регистрация и вход;
- каталог закупок `/offers`;
- карточка предложения `/offers/:id`;
- каталог поставщиков `/suppliers`;
- профиль поставщика `/suppliers/:supplierId`;
- личный кабинет `/account/*`;
- запрос доступа к поставщику и ценам;
- форма запроса товара, если покупатель ничего не нашел;
- блог и продуктовые обновления.

Если backend будет проектироваться отдельно от frontend, появятся расхождения:
интерфейс будет показывать одно, данные будут поддерживать другое. Для YORSO это
опасно, потому что главный актив продукта - доверие к данным поставщиков,
ценам, документам и процессам доступа.

## 2. Текущее состояние frontend

Frontend уже содержит основные публичные и рабочие поверхности:

- главная страница с live offers, trust-блоками, категориями и supplier
  verification;
- регистрационный flow с шагами, route guards, сохранением состояния и
  аналитикой;
- sign-in и reset password;
- каталог закупок с фильтрами, горизонтальными карточками предложений,
  выбранным предложением справа, market intelligence, compare tray и gated price
  access;
- каталог поставщиков с access-aware карточками;
- отдельная страница поставщика с locked/unlocked состояниями;
- блог и страницы статей с SEO/meta/structured data;
- личный кабинет с разделами personal, company, branches, products,
  meta-regions и notifications.

Значение пункта:

Проект уже прошел стадию "нарисовать страницы". Backend должен обслужить эти
страницы реальными данными. Поэтому приоритет backend определяется не абстрактной
архитектурой, а тем, какие экраны уже существуют и какие данные они ожидают.

Текущие источники данных смешаны:

- `mockOffers`, `mockSuppliers`, `mockIntelligence`, `mockAccount`;
- `localStorage` и `sessionStorage`;
- legacy Supabase prototype adapters для auth, password reset, catalog read
  layer и supplier-access совместимости;
- Supabase migrations и smoke tooling уже есть локально, но теперь это
  исторические prototype/reference assets. Это не production architecture и не
  обязательная часть self-hosted deployment.

Значение пункта:

Система уже проверила часть access-идей через Supabase. Теперь эти наработки
нужно использовать как временный прототип и источник схемных решений, а
production backend строить как self-hosted систему.

## 3. Backend-стратегия

Production target: self-hosted backend.

Supabase больше не рассматривается как будущий production backend. Supabase,
Firebase, Appwrite, Clerk, Auth0, hosted BaaS platforms и похожие сторонние
application backends не должны использоваться как production-зависимости для
auth, database, storage, access control или deployment.

Legacy Supabase-код можно сохранять только как исторический prototype/reference
слой и временную совместимость, пока self-hosted replacement полностью не
закрыт. Его должно быть возможно удалить без изменения продуктовых экранов.
Production-система YORSO должна разворачиваться как цельный софт на своем
сервере.

Аргументы:

- PostgreSQL подходит домену YORSO: компании, продукты, офферы, цены, документы,
  доступы, RFQ, события и audit logs являются реляционными данными.
- PgBouncer нужен для connection pooling, чтобы тысячи пользователей не
  превращались в тысячи прямых подключений к базе.
- Backend API должен быть единственным data gateway для frontend.
- Redis нужен для cache, sessions, rate limits и краткоживущих workflow states.
- MinIO или owned S3-compatible object storage нужны для logo, cover, product
  photos, certificates и company documents.
- Queue workers нужны для email, notifications, approvals, imports, reports и
  будущих agent jobs.
- Self-hosted search service понадобится для catalog/supplier/product discovery,
  когда Postgres indexes перестанут быть достаточными.
- Docker Compose должен быть первым deploy target, чтобы проект можно было
  поднять на своем сервере как цельный софт.

Значение пункта:

Главная задача - не привязаться к облачному backend-провайдеру. Supabase уже
помог проверить схемы и access-flow, но production-цель YORSO - контролируемая
self-hosted система: frontend, backend API, PostgreSQL, storage, queue и
инфраструктура в одном воспроизводимом контуре. Supabase и похожие сторонние
BaaS/SaaS-сервисы не должны быть обязательным runtime-условием для production.

Ключевое правило:

> Если у пользователя нет доступа к данным, backend не должен возвращать
> реальные значения. Frontend blur - это только UX-подсказка, а не защита.

Значение пункта:

YORSO продает доверие и контролируемый доступ к коммерчески чувствительным
данным. Если locked-пользователь получает скрытые данные в network response или
DOM, продуктовая модель доступа сломана, даже если интерфейс визуально блюрит
текст.

## 4. Локальное хранение файлов проекта

Все проектные файлы должны существовать локально на этом ПК. Production runtime
должен разворачиваться на контролируемой серверной инфраструктуре из локальных
файлов репозитория и owned configuration. Hosted BaaS/SaaS dashboards не должны
быть источником истины.

Локально и в Git должны храниться:

- frontend source;
- backend docs и contracts;
- self-hosted backend source и API contracts;
- PostgreSQL migrations;
- Supabase prototype migrations только пока они полезны для сравнения схем;
- seed data для demo и QA;
- generated API/client types;
- test fixtures;
- API contracts;
- audit history и prompt history;
- local runbooks.

Локально, но не в Git, должны храниться:

- `.env.local`;
- database credentials;
- API keys;
- production uploads;
- приватные документы пользователей;
- exports production-данных;
- временные browser/session artifacts.

Значение пункта:

Проект не должен зависеть от того, что "что-то есть в облаке". Backend,
migrations, functions, seed data и документы должны быть доступны локально,
чтобы другой агент или разработчик мог продолжить работу без потери контекста.

Рекомендуемая структура frontend-репозитория:

```text
docs/
  backend/
    frontend-backend-contract.md
    yorso-backend-implementation-plan.md
    self-hosted-backend-architecture.md
    access-control-matrix.md
    migration-roadmap.md
apps/
  api/
  web/
packages/
  contracts/
  db/
  core/
infra/
  docker-compose.yml
  postgres/
  pgbouncer/
  object-storage/
supabase/
  migrations/
  seed/
src/integrations/supabase/
  client.ts
  types.ts
src/lib/
  catalog-api.ts
  account-api.ts
  supplier-api.ts
  access-api.ts
  rfq-api.ts
  notification-api.ts
```

Значение пункта:

Эта структура отделяет архитектурные решения, backend migrations, runtime API
adapters и UI-компоненты. Это снижает риск смешивания domain model, frontend UI и
backend policy logic.

## 5. Соответствие backend-модулей текущему frontend

| Frontend-раздел | Текущий источник | Нужный backend-модуль | Приоритет |
|---|---|---|---|
| `/register` | self-hosted registration/account creation при настроенном API; transient sessionStorage для form continuity и API-disabled preview | auth onboarding, user profile, company draft | Phase 2A-2I реализовано |
| `/signin`, `/reset-password` | self-hosted auth/password recovery при настроенном API; local contract preview без API | self-hosted auth/session API, buyer session bridge | Phase 2J закрыта |
| `/account/personal` | localStorage `mockAccount` | user profiles API | P0 |
| `/account/company` | localStorage `mockAccount` | company profiles, logo, cover, public profile draft | P0 |
| `/account/branches` | read-only mock | company branches CRUD | P1 |
| `/account/products` | read-only mock | company product matrix CRUD | P1 |
| `/account/meta-regions` | read-only mock | meta-region CRUD | P1 |
| `/account/notifications` | read-only mock | notification preferences API | P1 |
| `/offers` | self-hosted catalog API при настроенном API; API-disabled local fixture preview; без Supabase fallback | offer catalog API, public/qualified views | Phase 3A закрыта |
| `/offers/:id` | self-hosted catalog API при настроенном API; API-disabled local fixture preview; без Supabase fallback | offer detail API, documents, related offers | Phase 3A закрыта |
| `/suppliers` | mock suppliers | supplier directory public/qualified views | P0 |
| `/suppliers/:supplierId` | mock suppliers | supplier profile public/qualified/owner views | P0 |
| Supplier access panel | self-hosted access API при настроенном API; API-disabled local preview; без Supabase fallback | access request workflow, grants, notifications и audit | Phase 3B закрыта |
| Catalog request form | sessionStorage mock | RFQ request API | P1 |
| Blog | static files | content source, SEO metadata, sitemap/RSS | P2 |
| Analytics dashboards | mock data | event ingestion, funnel queries | P2 |

Значение пункта:

Таблица задает порядок backend-работы. Сначала нужно перевести на реальные
данные те экраны, от которых зависит бизнес-модель: account, suppliers, offers и
access. Блог, аналитика и CMS важны, но они не должны опережать source of truth
для торговой системы.

## 6. Базовая модель данных

### 6.1 Identity

Основные таблицы:

- `profiles`;
- `companies`;
- `company_members`;
- `company_roles`;
- `buyer_qualifications`;
- `supplier_verifications`.

Что хранится:

- пользователь;
- компания;
- принадлежность пользователя к компании;
- роль пользователя в компании;
- статус квалификации покупателя;
- статус проверки поставщика.

Значение пункта:

YORSO - B2B-система. Сделки совершают не отдельные люди, а компании. Поэтому
backend должен строиться вокруг связки user -> company -> role -> permissions.
Иначе невозможно корректно управлять доступом к ценам, поставщикам, документам и
командной работе.

Ключевое поведение:

- один пользователь позже может состоять в нескольких компаниях;
- у одной компании может быть несколько пользователей;
- protected actions требуют проверки membership и role;
- buyer qualification и supplier verification являются разными статусами.

### 6.2 Company Profile

Основные таблицы:

- `company_profiles`;
- `company_media`;
- `company_branches`;
- `company_products`;
- `company_meta_regions`;
- `company_notification_preferences`.

Что хранится:

- юридическое и торговое название компании;
- роль компании: buyer, supplier, both;
- контакты;
- описание;
- логотип и cover image;
- филиалы;
- продукты, которые компания продает или покупает;
- мета-регионы;
- настройки уведомлений.

Значение пункта:

Личный кабинет должен стать источником данных для публичного профиля поставщика,
supplier matching, offer creation и уведомлений. Если `/account/company` остается
только локальной формой, профиль поставщика и каталог будут жить отдельно от
данных, которые заполняет пользователь.

Storage buckets:

- `company-logos`;
- `company-covers`;
- `company-documents`.

Значение пункта:

Логотип и cover image нельзя хранить как временный browser URL. Они должны быть
загружены в Storage, иметь владельца, alt text, fit/focal settings и безопасные
правила доступа.

### 6.3 Supplier Directory

Основные таблицы и views:

- `supplier_profiles`;
- `supplier_certifications`;
- `supplier_delivery_markets`;
- `supplier_documents`;
- `supplier_product_previews`;
- `suppliers_public`;
- `suppliers_registered`;
- `suppliers_qualified`;
- `suppliers_owner`.

Значение пункта:

Каталог поставщиков должен показывать достаточно информации для доверия и
интереса, но не раскрывать supplier identity, контакты и чувствительные детали
до получения доступа.

Access-логика:

- anonymous users видят public-safe supplier preview;
- registered users видят больше доверительных сигналов, но без реальных
  контактов и identity, если доступ не одобрен;
- qualified users видят approved supplier identity, contacts, documents и
  расширенный catalog preview;
- supplier owners видят свой полный профиль.

Значение пункта:

Это защищает YORSO от парсинга поставщиков, некачественных лидов и покупателей,
которые не готовы к реальной сделке.

### 6.4 Offer Catalog

Основные таблицы и views:

- `products`;
- `offers`;
- `offer_prices`;
- `offer_media`;
- `offer_delivery_terms`;
- `offer_documents`;
- `offer_volume_breaks`;
- `offers_public`;
- `offers_registered`;
- `offers_qualified`;
- `offers_owner`.

Значение пункта:

Каталог закупок - основная рабочая поверхность покупателя. Он должен получать
данные из backend, фильтроваться на backend и соблюдать access model для цены и
поставщика.

Public response не должен включать:

- `supplier_id`;
- точные `price_min` и `price_max`;
- supplier name;
- website;
- WhatsApp;
- email;
- contacts;
- документы, закрытые политикой доступа.

Qualified response может включать:

- точную цену;
- supplier identity;
- supplier country;
- delivery terms;
- price tiers;
- landed-cost inputs;
- documents according to grant scope.

Значение пункта:

Такой разрыв между public и qualified payload защищает закрытую коммерческую
ценность каталога: точную цену, supplier identity, контакты и документы. При
этом payment terms, incoterms, delivery basis и опубликованные production facts
могут оставаться публичными, чтобы покупатель быстрее оценивал релевантность
предложения. Это нельзя реализовать надежно только условиями в React-компонентах.

### 6.5 Access Requests

Основные таблицы:

- `supplier_access_requests`;
- `price_access_requests`;
- `access_grants`;
- `access_events`;
- `access_notifications`.

Статусы:

- `sent`;
- `pending`;
- `approved`;
- `rejected`;
- `expired`.

Значение пункта:

Access flow - центральный бизнес-механизм YORSO. Он квалифицирует покупателя,
защищает поставщика и создает понятный путь к цене, контактам и документам.

Требуемое поведение:

- buyer может запросить доступ в один клик из offer или supplier profile;
- дополнительный шаг "причина запроса" не нужен в базовом flow;
- стандартная причина по умолчанию - доступ к цене и supplier identity;
- supplier owner или admin может approve/reject;
- approval создает grant;
- buyer получает уведомление при следующем визите;
- все действия пишутся в audit log.

Значение пункта:

Пользовательский путь должен быть коротким. Если 95% запросов нужны для цены,
лишний вопрос о причине ухудшает conversion и не добавляет ценности.

### 6.6 RFQ и Product Requests

Основные таблицы:

- `buyer_requests`;
- `buyer_request_items`;
- `buyer_request_destinations`;
- `supplier_responses`;
- `request_events`;
- `request_attachments`.

Значение пункта:

Если покупатель не нашел нужный товар, это не dead end. Это должна быть точка
создания структурированного RFQ, который поставщики могут обработать и ответить
сравнимыми предложениями.

Минимальные поля:

- species;
- Latin name;
- format/cut;
- product state;
- packaging;
- volume;
- destination;
- incoterms;
- target delivery window;
- certifications;
- notes;
- reference photos or files.

### 6.7 Procurement Workspace

Основные таблицы:

- `saved_offers`;
- `shortlisted_suppliers`;
- `watched_products`;
- `watched_countries`;
- `price_alerts`;
- `buyer_activity`;
- `compare_sessions`.

Значение пункта:

YORSO должен возвращать покупателя в систему не только через каталог. Saved
offers, watched products, RFQ, access statuses и alerts создают retention и
делают систему рабочим кабинетом закупщика.

### 6.8 Notifications

Основные таблицы:

- `notifications`;
- `notification_preferences`;
- `notification_deliveries`.

Каналы:

- in-app;
- email;
- messenger-ready placeholder;
- agent-ready placeholder.

События:

- supplier access approved;
- price access approved;
- new matching product;
- RFQ response;
- price movement;
- country news;
- document readiness;
- supplier profile review.

Значение пункта:

Уведомления превращают YORSO из витрины в операционную систему. Пользователь
должен узнавать о цене, доступе, ответе поставщика и изменениях рынка без
постоянного ручного поиска.

## 7. RLS и access-дизайн

RLS нужно считать частью продукта, а не технической настройкой безопасности.

Минимальные политики:

- user читает и редактирует свой профиль;
- company member читает данные компании в рамках роли;
- company admin редактирует company profile;
- supplier owner редактирует supplier profile и offers;
- buyer читает public suppliers и offers;
- buyer читает qualified data только при active grant;
- public user читает только public-safe views;
- locked states не получают contacts, legal details, exact prices, full catalog
  и confidential production notes. Опубликованные plant capacity, staff count,
  cold storage, blast freezing и transit specifics могут быть публичными facts.

Значение пункта:

Если правила доступа не закреплены в БД, любая ошибка frontend может раскрыть
данные. Для YORSO это не просто баг, а удар по доверию поставщиков.

Рекомендуемые helper-функции:

```sql
has_company_role(user_id, company_id, role)
has_supplier_access(user_id, supplier_id)
has_offer_price_access(user_id, offer_id)
is_company_member(user_id, company_id)
is_supplier_owner(user_id, supplier_id)
is_admin(user_id)
```

Значение пункта:

Helper-функции уменьшают дублирование RLS-логики и делают правила доступа
понятными для тестирования.

## 8. API adapters и миграция frontend

Frontend-страницы не должны напрямую импортировать database client. Нужны typed
adapters.

Рекомендуемые файлы:

- `src/lib/account-api.ts`;
- `src/lib/supplier-api.ts`;
- `src/lib/offer-api.ts`;
- `src/lib/access-api.ts`;
- `src/lib/rfq-api.ts`;
- `src/lib/notification-api.ts`;
- `src/lib/content-api.ts`.

Значение пункта:

Adapters позволяют заменить mock на backend без переписывания каждой страницы.
Компоненты должны получать данные в знакомой форме, а детали транспорта,
авторизации и хранения должны остаться внутри lib/API-слоя.

Миграционный паттерн:

1. Оставить mock fallback для стабильности preview.
2. Добавить backend API adapter с типизированным return shape.
3. Добавить loading, empty и error states.
4. Добавить тесты для public, registered и qualified access.
5. Убрать прямые imports mock data из page components.
6. Оставить mock data только как seed fixtures или fallback.

Значение пункта:

Такой порядок снижает риск сломать Lovable preview и позволяет переносить
страницы на backend по одной.

## 9. Этапы реализации

### Backend Phase 0: Contract и quality gates

Цель:

Зафиксировать backend contract и стабилизировать текущий frontend gate.

Задачи:

- поддерживать `docs/backend/frontend-backend-contract.md`;
- описать зависимости frontend от mock/localStorage/sessionStorage;
- исправить текущие `npm test` и `npm run lint` failures;
- провести inventory Supabase migrations как prototype/schema references;
- определить self-hosted API contracts и generated client type strategy;
- определить seed strategy;
- добавить `.env.example`.

Значение пункта:

Нельзя строить backend поверх красного quality gate. Если тесты и lint уже
падают, backend-изменения будут смешиваться с существующими регрессиями.

Exit criteria:

- production build проходит;
- lint проходит;
- тесты проходят или известные failures явно задокументированы;
- каждый активный frontend route сопоставлен с будущим backend source.

### Backend Phase 1: Account как source of truth

Цель:

Сделать `/account/*` реальным источником данных компании.

Задачи:

- реализовать `profiles` и `companies`;
- реализовать company media storage;
- реализовать branch CRUD;
- реализовать product matrix CRUD;
- реализовать meta-region CRUD;
- реализовать notification preferences CRUD;
- подключить frontend account pages к backend API adapters.

Значение пункта:

Компания должна сама заполнять данные, которые потом появятся в supplier profile,
matching, offers и access flow. Это основа всей B2B-модели.

Exit criteria:

- account data сохраняется между браузерами и устройствами;
- logo и cover хранятся в self-hosted object storage;
- supplier profile preview использует сохраненные company data;
- localStorage не является source of truth.

### Backend Phase 2: Supplier Directory и Supplier Profile

Цель:

Сделать поиск и оценку поставщиков реальными и access-safe.

Задачи:

- перенести supplier data в database;
- создать public и qualified supplier views;
- подключить `/suppliers`;
- подключить `/suppliers/:supplierId`;
- исключить locked DOM/network leaks;
- добавить owner view для собственной компании поставщика.

Значение пункта:

Поставщики будут доверять YORSO только если их identity, контакты, точные цены,
закрытые документы и юридические данные не раскрываются случайно. Публичные
условия сделки и опубликованные производственные возможности не нужно прятать:
они помогают покупателю быстрее квалифицировать предложение.

Exit criteria:

- locked users не получают скрытые supplier fields;
- qualified users видят approved data;
- document download grant выдаётся только после повторной проверки supplier
  access и не раскрывает `fileAssetId`, storage keys или прямые file URLs;
- document download serving валидирует grant id, buyer, supplier, document,
  expiry и current access перед чтением backend-only file asset;
- supplier owner видит свой полный профиль;
- browser и DOM leak tests проходят.

### Backend Phase 3: Offer Catalog

Цель:

Сделать каталог закупок реальным рабочим инструментом.

Задачи:

- перенести offers, prices, media и terms в database;
- реализовать public и qualified offer views;
- подключить backend filters;
- подключить offer detail page;
- подключить document readiness и offer media;
- сохранить mock fallback только для preview.

Значение пункта:

Покупатель должен принимать закупочное решение на основании реальных офферов,
цен, условий и документов, а не mock-карточек.

Exit criteria:

- locked users не получают exact prices или supplier identity;
- qualified users получают exact price и supplier details;
- фильтры работают от backend;
- offer pages не зависят от `mockOffers` как primary source.

### Backend Phase 4: Access Request Workflow

Цель:

Заменить localStorage-симуляцию доступа реальным workflow.

Задачи:

- реализовать request tables;
- реализовать one-click request из supplier profile и offer page;
- реализовать status transitions;
- реализовать approval grant;
- реализовать next-visit notification;
- создать supplier/admin approval placeholder.

Значение пункта:

Это главный conversion path: покупатель видит ценность, запрашивает доступ,
поставщик или YORSO подтверждает, покупатель получает цену и контакты.

Exit criteria:

- buyer request сохраняется в database;
- approval меняет frontend access level;
- buyer получает notification после approval;
- audit log фиксирует изменения доступа.

### Backend Phase 5: RFQ и Recovery Flow

Цель:

Превратить "товар не найден" в структурированный запрос.

Задачи:

- реализовать RFQ tables;
- подключить catalog empty state form;
- добавить supplier response model;
- добавить buyer request list в workspace;
- добавить базовые notifications.

Значение пункта:

Запрос товара создает спрос даже тогда, когда каталога недостаточно. Это важный
механизм роста предложения и удержания покупателя.

Exit criteria:

- buyer может отправить request;
- request виден в buyer workspace;
- supplier/admin может ответить структурированно;
- responses можно сравнить.

### Backend Phase 6: Buyer Workspace и Supplier Workspace

Цель:

Создать рабочие кабинеты за пределами публичного каталога.

Buyer workspace:

- saved offers;
- price requests;
- supplier access requests;
- RFQs;
- messages;
- watched products;
- price alerts;
- activity feed.

Supplier workspace:

- company profile;
- product catalog;
- offers and prices;
- buyer access requests;
- RFQ responses;
- documents;
- visibility analytics.

Значение пункта:

Без рабочих кабинетов YORSO остается каталогом. С кабинетами YORSO становится
операционной системой для закупок и продаж.

Exit criteria:

- пользователи возвращаются к ongoing work;
- suppliers управляют данными без разработчика;
- procurement activity не теряется между сессиями.

### Backend Phase 7: Messaging, Documents и Notifications

Цель:

Поддержать реальную коммуникацию сделки.

Задачи:

- buyer-supplier threads;
- document requests;
- file storage and access control;
- in-app notifications;
- email delivery;
- подготовка messenger integrations.

Значение пункта:

Торговая система должна поддерживать не только поиск, но и коммуникацию,
документы, уточнения и follow-up.

Exit criteria:

- buyer и supplier могут обмениваться структурированными сообщениями;
- documents gated and auditable;
- notifications связаны с реальными событиями.

### Backend Phase 8: Admin и Verification

Цель:

Сделать trust operational, а не декоративным.

Задачи:

- supplier verification console;
- document review queue;
- company qualification;
- fraud and abuse moderation;
- access audit;
- support tools.

Значение пункта:

Если verification badges не подкреплены процессом проверки, они становятся
маркетинговой декорацией. Для YORSO это недопустимо.

Exit criteria:

- trust labels backed by review states;
- admin может approve, reject и audit;
- public trust claims defensible.

## 10. Стратегия тестирования

Backend-работа не должна проверяться только визуально.

Обязательные тесты:

- RLS tests для anonymous, registered, qualified, supplier owner и admin;
- adapter tests для каждого frontend API wrapper;
- DOM leak tests для locked supplier и offer data;
- access request lifecycle tests;
- account persistence tests;
- upload validation tests;
- browser-level tests для critical flows;
- migration tests для seed data.

Значение пункта:

Главные риски YORSO связаны не с кнопками, а с данными и доступом. Поэтому
тестировать нужно не только UI, но и то, какие значения backend отдает разным
типам пользователей.

Известные риски из аудита:

- полный `npm test` сейчас падает;
- `npm run lint` сейчас падает;
- в `SupplierProfile` есть hook-order lint error;
- часть i18n tests устарела или фиксирует реальные регрессии;
- supplier row snapshots требуют пересмотра после layout changes.

Значение пункта:

Перед серьезным backend-расширением нужно закрыть эти gates, иначе новая работа
будет накапливаться поверх старых регрессий.

## 11. Правила миграции данных

Mock data должны стать seed data, а не исчезнуть сразу.

Правила:

- сохранять `mockOffers` и `mockSuppliers`, пока нет self-hosted seed parity;
- переносить по одной frontend surface за раз;
- избегать big-bang replacement;
- держать deterministic demo data для Lovable preview;
- иметь locked/qualified cases в seed data;
- все SQL и seed files должны храниться локально.

Значение пункта:

Lovable preview и текущие тесты завязаны на предсказуемые данные. Резкое
удаление mock-слоя сломает разработку. Правильный путь - сначала seed parity,
потом переключение primary data source.

## 12. Риски

| Риск | Почему важно | Как снижать |
|---|---|---|
| Frontend blur используется как защита | Скрытые данные можно получить через DOM или network | Enforce access в API queries и database views |
| Backend расходится с frontend | UI становится декоративным | Сначала frontend-backend contract |
| Слишком большой scope | Backend застопорится | Работать по страницам и adapters |
| Mock data удалены слишком рано | Preview и тесты теряют стабильность | Держать fallback до seed parity |
| Trust без операций | Verification badges становятся фальшивыми | Строить admin verification states |
| Файлы только в cloud | Проект нельзя восстановить локально | Хранить migrations, functions, seed и docs локально |

Значение пункта:

Эти риски напрямую связаны с доверием, безопасностью данных и скоростью
разработки. Их нужно учитывать до написания миграций, а не после.

## 13. Ближайшие действия

1. Поддерживать этот план в `docs/backend/`.
2. Поддерживать `frontend-backend-contract.md` рядом с планом.
3. Закрыть текущие lint/test failures.
4. Провести inventory Supabase migrations как prototype references.
5. Определить migration baseline.
6. Добавить `.env.example`.
7. Определить generated API/client types.
8. Создать Phase 1 schema для account/company.
9. Создать `account-api.ts`.
10. Добавить adapter tests для account.

Значение пункта:

Это минимальный путь к первому реальному backend-инкременту. Начинать нужно с
account/company, потому что все следующие сущности - suppliers, offers, access,
RFQ - опираются на компанию и пользователя.

## 14. Решение по порядку разработки

YORSO не должен начинать backend с orders, payments, CRM или AI agents.

Правильный порядок:

1. identity;
2. company profile;
3. supplier profile;
4. offer catalog;
5. access control;
6. RFQ;
7. buyer and supplier workspaces;
8. notifications and documents;
9. admin verification;
10. integrations.

Значение пункта:

Порядок отражает зависимость данных. Нельзя строить сделки, оплату, CRM или AI
agents, пока нет надежной модели компании, пользователя, предложений, поставщика
и доступа к чувствительным данным.

## 15. Итоговая позиция

Backend YORSO должен быть построен вокруг трех принципов:

1. Frontend-first compatibility.
2. Database-enforced access control.
3. Local reproducibility of all project files.

Значение пункта:

Frontend уже определил продуктовую форму YORSO. Backend должен сделать эту форму
реальной, защищенной и воспроизводимой. Только после этого YORSO сможет
развиваться как торговая система, а не как демонстрационный marketplace UI.

## Backend Phase 4H Checkpoint - UI скачивания документов поставщика

Статус: реализовано.

Phase 4H закрывает buyer-facing путь скачивания документов в профиле
поставщика:

- `SupplierProfile.tsx` показывает кнопку скачивания только для approved
  документов, только при настроенном self-hosted API и только для
  `qualified_unlocked` покупателя.
- `downloadSupplierDocument` сначала запрашивает self-hosted grant, затем
  скачивает файл по возвращенному API `downloadPath` с текущими session
  headers.
- `fileAssetId`, object keys, storage keys и direct file URLs не попадают в
  React-visible state и DOM.
- Locked buyers видят только document-readiness состояние без download action.
- Production passport показывает backend document rows даже если API временно
  не прислал optional logistics facts.

Следующий scoped backend direction после Phase 4H: либо supplier owner/admin
document management, либо bounded admin download-audit listing. Выбор зависит
от продуктового приоритета.

## Backend Phase 4I Checkpoint - Admin download-audit документов поставщика

Статус: реализовано.

Phase 4I выбирает bounded admin download-audit listing как следующий шаг по
supplier documents. Owner/admin upload и редактирование документов намеренно не
входят в этот инкремент.

Реализовано:

- `GET /v1/admin/supplier-documents/download-events` для authenticated admin
  session;
- bounded query contract с optional `status`, `supplierId`, `buyerUserId`,
  `limit <= 100` и `offset <= 10 000`;
- read path по `yorso_supplier_document_download_events`;
- response shaping без `fileAssetId`, object keys, storage keys, direct storage
  URLs и `downloadPath`;
- audit action `admin.supplier_document_download_events.read`;
- API route test и Postgres repository test.

Следующий scoped backend direction после Phase 4I: adjacent grant-audit
listing.

## Backend Phase 4J Checkpoint - Admin grant-audit документов поставщика

Статус: реализовано.

Phase 4J добавляет bounded admin grant-audit listing рядом с Phase 4I download
event listing. Owner/admin upload и редактирование документов остаются вне
этого инкремента.

Реализовано:

- `GET /v1/admin/supplier-documents/download-grants` для authenticated admin
  session;
- bounded query contract с optional `status`, `supplierId`, `buyerUserId`,
  `limit <= 100` и `offset <= 10 000`;
- read path по `yorso_supplier_document_download_grants`;
- response shaping без `fileAssetId`, object keys, storage keys, direct storage
  URLs и `downloadPath`;
- audit action `admin.supplier_document_download_grants.read`;
- API route test и PostgreSQL repository test.

Следующий scoped backend direction после Phase 4J: либо admin UI для
download/grant audit listings, либо supplier owner/admin document management
после отдельного решения по ownership, validation и audit rules.
