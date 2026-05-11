# Матрица контроля доступа backend YORSO

Статус: backend contract для Phase 0
Назначение: русская версия для проверки человеком
Связанные документы:

- `docs/backend/yorso-backend-implementation-plan.ru.md`
- `docs/backend/frontend-backend-contract.md`

## 1. Назначение

YORSO должен защищать коммерческую ценность маркетплейса: точные цены, закрытые
ценовые уровни, личность поставщика, контакты, юридические данные, restricted
documents и полный каталог продукции.

Payment terms, incoterms, delivery basis и опубликованные производственные
возможности являются публичными marketplace-данными, если поставщик или
администратор явно не пометил конкретное поле как confidential.

Значение пункта:

Если закрытые данные будут доступны всем, поставщики потеряют мотивацию
размещаться в YORSO, а сервис превратится в бесплатную базу для парсинга.
Публичные условия сделки и производственные capability-факты, наоборот, помогают
покупателю быстрее оценить релевантность предложения без лишнего запроса доступа.
Поэтому access model должна быть реализована на backend, а не только в
интерфейсе.

Главное правило:

Frontend может блюрить, маскировать или показывать заглушки. Но backend уже
должен отдавать безопасный payload. Locked-пользователь не должен получать
реальные скрытые значения в network response, DOM text, JSON-LD, metadata, logs,
search indexes или exports.

## 2. Уровни доступа

| Уровень | Значение | Backend identity |
|---|---|---|
| `anonymous_locked` | Посетитель без buyer session | нет authenticated user |
| `registered_locked` | Покупатель вошел, но доступ к поставщику/цене не одобрен | authenticated user без active grant |
| `qualified_unlocked` | Покупатель с активным grant к поставщику или offer | authenticated user с active access grant |
| `supplier_owner` | Представитель компании-поставщика управляет своими данными | authenticated user с supplier company membership |
| `admin` | Оператор YORSO для проверки и поддержки | authenticated user с admin role |

Значение пункта:

`qualified_unlocked` не должен быть глобальным "открыть все". В B2B-системе
доступ должен быть scoped: к конкретному поставщику, offer, документу или набору
данных. Покупатель может иметь доступ к одному поставщику и не иметь доступа к
другому.

## 3. Классы данных

| Класс данных | Примеры | Чувствительность |
|---|---|---|
| Публичные факты продукта | название продукта, латинское название, формат, origin, фото, безопасный MOQ label | низкая |
| Публичный teaser поставщика | masked name, страна, город если разрешен, тип, safe trust summary | средняя |
| Точная цена и закрытые price tiers | exact price, buyer-specific price tiers, unpublished rebates | высокая |
| Публичные торгово-логистические условия | payment terms, incoterms, delivery basis, public MOQ, loading port | низкая/средняя |
| Личность поставщика | company name, legal name, supplier id, profile owner | высокая |
| Каналы контакта | email, phone, WhatsApp, website, direct messenger | высокая |
| Юридические данные | registration number, tax id, legal address, bank-related fields | высокая |
| Опубликованные производственные capability-факты | plant capacity, staff count, cold storage, blast freezing, transit specifics | низкая/средняя |
| Документы | certificates, health docs, catch/IUU docs, packing lists, traceability files | высокая |
| Метрики активности | exact offer count, exact product count, response history, buyer demand | средняя/высокая |
| Internal operations | verification notes, risk flags, moderation notes, admin audit | restricted |

Значение пункта:

Не все данные одинаково чувствительны. Product photo, payment terms, incoterms,
delivery basis и опубликованные сведения о мощности завода могут быть публичными.
WhatsApp поставщика, legal details, точная цена и закрытые документы не должны
уходить locked-пользователю.

## 4. Глобальные правила

1. Не отправлять high-sensitivity values locked-пользователям.
2. Если locked UI должен сохранять структуру страницы, отправлять placeholders,
   а не реальные значения.
3. Exact counts должны быть gated, если раскрывают ширину каталога поставщика.
4. JSON-LD и metadata подчиняются тем же правилам, что и visible UI.
5. Search не должен раскрывать hidden company names или contacts.
6. Logs и analytics payloads не должны содержать hidden values для locked users.
7. Export/download endpoints должны использовать те же RLS rules, что page API.
8. Public views должны быть безопасны даже при копировании всего response.
9. Owner/admin views должны быть отделены от buyer-qualified views.
10. RLS является source of truth. React conditional rendering недостаточен.
11. Public trade/logistics terms и опубликованные production capability facts
    можно отдавать locked users, если поле явно классифицировано как public.

Значение пункта:

В прошлом мы уже сталкивались с ситуацией, когда данные были визуально скрыты,
но оставались в DOM. Для backend это недопустимо: данные должны отсекаться до
отправки клиенту.

## 5. Главная страница

| Данные | anonymous_locked | registered_locked | qualified_unlocked |
|---|---|---|---|
| Public offer teaser | можно | можно | можно |
| Real product photos | можно | можно | можно |
| Exact price | только mask/range | только mask/range | только если grant применим |
| Supplier name | только safe teaser | только safe teaser | только если grant применим |
| Supplier contacts | нельзя | нельзя | обычно нельзя на главной |

Backend target:

- `homepage_marketplace_preview`;
- safe offer preview view.

Значение пункта:

Главная должна доказывать, что маркетплейс живой, но не должна раскрывать полную
коммерческую базу поставщиков.

## 6. Каталог предложений `/offers`

| Данные | anonymous_locked | registered_locked | qualified_unlocked | supplier_owner | admin |
|---|---|---|---|---|---|
| Product identity | можно | можно | можно | свои offers | можно |
| Latin name, format, origin | можно | можно | можно | можно | можно |
| Product images | можно | можно | можно | можно | можно |
| Safe MOQ label | можно | можно | можно | можно | можно |
| Exact MOQ value | если не sensitive | если не sensitive | можно | можно | можно |
| Payment terms | можно | можно | можно | можно | можно |
| Incoterms / delivery basis | можно | можно | можно | можно | можно |
| Price range label | можно | можно | можно | можно | можно |
| Exact price min/max | нельзя | нельзя без grant | можно по grant | свои offers | можно |
| Supplier id | нельзя | нельзя без grant | можно по grant | своя компания | можно |
| Supplier name | masked | masked/partial | можно по grant | своя компания | можно |
| Supplier contacts | нельзя | нельзя | только в detail/contact flow по grant | своя компания | можно |
| Compare metadata | safe fields | safe fields | granted fields | можно | можно |

Backend target:

- `offers_public`;
- `offers_registered`;
- `offers_qualified`;
- `offers_owner`;
- `offers_admin`.

Значение пункта:

Каталог закупок - основной экран покупателя. Он должен быть полезным даже без
регистрации, но точная цена и supplier identity должны раскрываться только через
управляемый доступ.

## 7. Карточка предложения `/offers/:id`

| Данные | anonymous_locked | registered_locked | qualified_unlocked |
|---|---|---|---|
| Product detail | можно | можно | можно |
| Photo gallery | можно | можно | можно |
| Price summary | только safe range | только safe range | exact values по grant |
| Payment terms / incoterms / delivery basis | можно | можно | можно |
| Supplier trust summary | safe summary | safe summary | full trust pack по grant |
| Supplier profile link | masked profile | masked profile | full profile по grant |
| Documents | teaser/status only | teaser/status only | downloadable по document grant |
| Traceability | safe summary | safe summary | full details по grant |
| Related offers | safe fields | safe fields | granted fields where applicable |

Backend target:

- `offer_detail_public`;
- `offer_detail_registered`;
- `offer_detail_qualified`.

Значение пункта:

Offer detail должен помогать принять решение, но не должен обходить правила,
установленные для каталога.

## 8. Каталог поставщиков `/suppliers`

| Данные | anonymous_locked | registered_locked | qualified_unlocked | supplier_owner | admin |
|---|---|---|---|---|---|
| Masked supplier name | можно | можно | можно если нет grant | не нужно | можно |
| Real company name | нельзя | нельзя | можно по supplier grant | своя компания | можно |
| Country/city | можно если safe | можно | можно | можно | можно |
| Supplier type | можно | можно | можно | можно | можно |
| Short safe description | можно | можно | можно | можно | можно |
| Full about text | нельзя | нельзя | можно по grant | своя компания | можно |
| Product preview images | можно | можно | можно | можно | можно |
| Exact product count | нельзя | нельзя | можно по grant | своя компания | можно |
| Exact active offer count | нельзя | нельзя | можно по grant | своя компания | можно |
| Delivery geography | limited teaser | limited teaser | full by grant | своя компания | можно |
| Website/WhatsApp/email | нельзя | нельзя | можно по grant | своя компания | можно |

Backend target:

- `suppliers_public`;
- `suppliers_registered`;
- `suppliers_qualified`;
- `suppliers_owner`;
- `suppliers_admin`.

Значение пункта:

Каталог поставщиков должен создавать доверие, но не становиться открытой базой
контактов для агентов и нецелевых пользователей.

## 9. Профиль поставщика `/suppliers/:supplierId`

| Данные | anonymous_locked | registered_locked | qualified_unlocked |
|---|---|---|---|
| Dossier layout | можно | можно | можно |
| Hero image | если public-safe | если public-safe | можно |
| Logo | placeholder или public-safe | placeholder или public-safe | можно по grant |
| Real company name | нельзя | нельзя | можно по grant |
| Legal details | нельзя | нельзя | можно по grant/admin policy |
| Website/WhatsApp/contact | нельзя | нельзя | можно по grant |
| Published production passport facts | можно | можно | можно |
| Non-public production notes | нельзя | нельзя | можно по grant/admin policy |
| Catalog preview | safe teaser only | safe teaser only | full by grant |
| Supplier offers | safe preview | safe preview | supplier-specific granted offers |
| Documents | status only | status only | full/downloadable by grant |
| Similar suppliers | safe teaser | safe teaser | based on each supplier grant |

Backend target:

- `supplier_profile_public`;
- `supplier_profile_registered`;
- `supplier_profile_qualified`;
- `supplier_profile_owner`.

Значение пункта:

Профиль поставщика - коммерческое досье. Он должен показывать структуру и
ценность, но не отдавать locked-пользователю реальные закрытые значения.

## 10. Личный кабинет `/account/*`

| Данные | account owner | company member | company admin | public/other user |
|---|---|---|---|---|
| Personal profile | только свой | нельзя | только support/admin case | нельзя |
| Company identity | company scope | company scope | edit | нельзя |
| Company media | company scope | company scope | edit | public после publication |
| Branches | company scope | company scope | edit | нельзя |
| Products | company scope | company scope | edit | public preview после publication |
| Meta-regions | company scope | company scope | edit | нельзя |
| Notification preferences | own/company scope | role-based | edit | нельзя |

Значение пункта:

Личный кабинет должен быть защищен по company membership. Это будущая основа
team accounts и supplier workspace.

## 11. Supplier Access Request Flow

| Action/data | anonymous_locked | registered_locked | qualified_unlocked | supplier_owner | admin |
|---|---|---|---|---|---|
| See access CTA | можно | можно | hidden/granted state | не применимо | можно |
| Create request | сначала sign-up | можно | no duplicate active request | не применимо | support case |
| See own request status | нельзя | можно | можно | incoming requests | можно |
| Approve/reject request | нельзя | нельзя | нельзя | для своего supplier | можно |
| Receive approval notification | нельзя | можно | можно | не применимо | можно |
| Audit access event | нельзя | own request only | own grant only | own supplier requests | можно |

Backend target:

- `supplier_access_requests`;
- `price_access_requests`;
- `access_grants`;
- `access_events`;
- `notifications`.

Значение пункта:

Это основной conversion path. Покупатель должен быстро запросить доступ, а
поставщик или YORSO должны контролируемо его выдать.

## 12. RFQ / Product Request

| Action/data | anonymous_locked | registered_locked | qualified_unlocked | supplier_owner | admin |
|---|---|---|---|---|---|
| View empty-state request form | teaser | можно | можно | не основной сценарий | можно |
| Submit RFQ | sign-up или draft | можно | можно | не основной сценарий | можно |
| See own RFQs | нельзя | own company only | own company only | supplier responses only | можно |
| See supplier responses | нельзя | own requests only | own requests only | own submitted responses | можно |
| Attach files | нельзя | validation required | validation required | response files | можно |

Значение пункта:

Если покупатель не нашел товар, YORSO должен не терять его, а создавать
структурированный спрос для поставщиков.

## 13. Правила поиска

Locked users могут искать по:

- masked supplier name;
- country;
- city if public-safe;
- supplier type;
- product species;
- certifications;
- safe delivery teaser;
- public trade/logistics terms;
- published production capability facts;
- public product fields.

Locked users не должны искать по:

- real company name;
- website;
- WhatsApp;
- email;
- legal registration number;
- hidden product names;
- hidden document names;
- confidential production notes.

Значение пункта:

Поиск не должен становиться способом проверить, есть ли скрытая компания в базе.
Если `companyName` скрыт, поиск по `companyName` тоже должен быть закрыт.
Но поиск по публичным условиям поставки, incoterms, delivery basis и
опубликованным production facts допустим.

## 14. Metadata и SEO

Public SEO metadata не должны раскрывать locked values.

Правила:

- supplier profile JSON-LD использует masked/public-safe identity;
- canonical URLs допустимы, но metadata должны быть safe;
- hidden company name не должен попадать в `title`, `description`, `og:title`,
  `og:description`, `alt`, JSON-LD, breadcrumb schema или sitemap labels;
- offer pages не раскрывают supplier identity или exact prices в metadata;
- blog может упоминать supplier только если информация approved/public.

Значение пункта:

SEO не должен обходить access model. Закрытые данные нельзя случайно раскрывать
через metadata или schema.

## 15. Нужные backend views и helper functions

Минимальные views/RPCs:

```sql
suppliers_public
suppliers_registered
suppliers_qualified
suppliers_owner
offers_public
offers_registered
offers_qualified
offers_owner
get_supplier_profile_public(p_supplier_id)
get_supplier_profile_qualified(p_supplier_id)
get_offer_public(p_offer_id)
get_offer_qualified(p_offer_id)
```

Helper functions:

```sql
is_admin(p_user_id)
is_company_member(p_user_id, p_company_id)
has_company_role(p_user_id, p_company_id, p_role)
is_supplier_owner(p_user_id, p_supplier_id)
has_supplier_access(p_user_id, p_supplier_id)
has_offer_price_access(p_user_id, p_offer_id)
has_document_access(p_user_id, p_document_id)
```

Значение пункта:

Views отделяют safe payload от sensitive payload. Helper functions делают RLS
понятным и тестируемым.

## 16. Test matrix

| Test case | Expected result |
|---|---|
| anonymous reads offers_public | no exact price, no supplier id, no contacts; public payment terms, incoterms and delivery basis may be returned |
| registered reads offers_public/registered | no exact price unless grant exists |
| qualified reads granted offer | exact price and supplier identity returned |
| qualified reads non-granted offer | fallback to public-safe payload |
| anonymous reads suppliers_public | no companyName, website, WhatsApp, legal details |
| anonymous reads published production facts | public plant, staff, storage, freezing and transit facts may be returned when classified public |
| registered searches supplier real name | no hidden identity result leak |
| qualified reads granted supplier | full allowed profile returned |
| supplier owner reads own supplier | full owner profile returned |
| supplier owner reads another supplier | public or denied, not owner data |
| admin reads supplier | full admin view returned |
| locked supplier profile metadata | no hidden value in title/meta/JSON-LD |
| locked DOM snapshot | no hidden real values in textContent |
| locked network payload | no hidden real values in response JSON |

Значение пункта:

Нужно тестировать не только UI, но и payload. Если значение не видно глазами, но
есть в response JSON, access model не работает.

## 17. Phase 0 exit criteria

Планирование access control завершено, когда:

- эта матрица лежит в `docs/backend/`;
- `frontend-backend-contract.md` использует те же access levels;
- migration plan включает public/qualified/owner/admin views;
- tests planned для DOM, network и RLS leaks;
- будущие backend-задачи не могут игнорировать access level requirements.

Значение пункта:

Эта матрица должна стать обязательной ссылкой для всех backend-задач, связанных
с каталогом, поставщиками, ценами, документами и профилями.
