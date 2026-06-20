# P1M — Упрощение формы Add/Edit товара в /account/products

## Цель
Убрать дублирование: после выбора в Product catalog пользователь не вводит вручную название, латинское имя и категорию. Форма становится узкой и сфокусированной на полях, влияющих на матчинг.

## Скоуп
Только маршрут `/account/products`. Не трогаем AccountShell, Header, другие табы, backend/API/storage/auth, Supabase-policy.

## Изменения UI

### Форма Add/Edit (`Account.tsx`, секция `account-product-form`)
1. Оставляем `AccountProductCatalogPicker` как единственный источник идентичности товара.
2. Под пикером — компактный «selected product summary»:
   - Если `draft.latinName` и `draft.commercialName` заполнены: `Gadus morhua (Atlantic Cod H&G)` — латинское курсивом первым, коммерческое в скобках.
   - Если ничего не выбрано: подсказка «Выберите товар из каталога» (i18n).
   - testid: `account-product-selected-summary`.
3. Удаляем `FormRow` для:
   - `commercialName` (`account-product-commercial-name`)
   - `latinName` (`account-product-latin-name`)
   - `category` (`account-product-category`)
   - Сами значения в `draft` сохраняются и пишутся при Save (из выбора каталога / из существующего product при edit).
4. Primary поля (одна grid 1/2 колонки):
   - State (`account-product-state`)
   - Role (`account-product-role`)
   - Monthly volume (`account-product-monthly-volume`, required)
   - Format / cut (`account-product-format`)
5. «Optional details» — `<details>` (нативный `<summary>` = одна интерактивная кнопка, без вложенностей), по умолчанию свёрнут на add; на edit — раскрыт, если есть значения:
   - Certifications (`account-product-certificates`)
   - Target countries (`account-product-target-countries`)
   - testid: `account-product-optional-details`.

### Валидация (`validateProductDraft`)
Required:
- выбранный catalog product → проверяем непустые `commercialName` и `latinName` (ошибка вешается на summary, testid `account-product-selected-summary-error`)
- `monthlyVolume`

Убираем required для:
- `category`
- `commercialName`/`latinName` как отдельных полей (валидируются через summary)
- `certificates`, `targetCountries`

State и role — селекты с дефолтными значениями, не блокируют Save.

### Edit mode
- При `startEdit(product)` форма prefill-ит summary из `product.commercialName/latinName`.
- Optional details авто-раскрывается, если `certificates.length > 0` или `targetCountries.length > 0`.

### Table / mobile cards
Не трогаем. Существующие строки продолжают показывать сертификаты и target countries.

### Mobile 390px
- Сетка `grid-cols-1` на mobile уже есть.
- `<summary>` и кнопки имеют `min-h-11`.
- Никаких nested `<a>`/`<button>` внутри `<summary>`.

## i18n (EN/RU/ES) в `src/i18n/translations.ts`
Новые ключи:
- `account_product_selected_summary_empty` — «Выберите товар из каталога» / «Pick a product from the catalogue» / «Elige un producto del catálogo»
- `account_product_selected_summary_required` — «Сначала выберите товар из каталога» / «Select a product from the catalogue first» / «Selecciona primero un producto del catálogo»
- `account_product_optional_details` — «Дополнительно (необязательно)» / «Optional details» / «Detalles opcionales»
- `account_product_form_desc` — укоротить (RU: «Заполните основные параметры закупки».)

Старые ключи `account_product_col_product/_col_latin/_field_category` остаются — используются в таблице, поиске, сортировке.

## Тесты
- `e2e/account-products-crud.spec.ts` — обновить add-сценарий: выбор каталога → state/role/volume/format → Save. Убрать ручной ввод commercialName/latinName/category.
- `e2e/account-products-save-flow-report.spec.ts` — синхронизировать селекторы.
- `e2e/account-workspace-acceptance.spec.ts` — обновить product screenshots/asserts.
- Добавить новые проверки:
  - попытка Save без выбора каталога → ошибка на summary
  - edit существующего продукта → summary prefilled, optional details раскрыты
  - mobile 390: no horizontal overflow, nested interactive controls = 0
- Скриншоты в `test-results/p1m-products-form-simplification/`:
  - `desktop-add-form.png`
  - `mobile-390-add-form.png`
  - `mobile-390-selected-summary.png`
  - `mobile-390-optional-details.png`

## Verification
- `npx tsc -b --noEmit`
- `npm run check:provider-boundary`
- `npm run build`
- `E2E_USE_WEB_SERVER=1 npx playwright test e2e/account-products-crud.spec.ts e2e/account-products-save-flow-report.spec.ts e2e/account-workspace-acceptance.spec.ts --project=chromium --reporter=list`

## Не трогаем
backend, API, storage schema, auth, AccountShell, Header, другие /account табы, Supabase/provider-free policy, существующие testid таблицы/мобильных карточек/поиска/сортировки.

## Stop
После /account/products. Другие табы не начинаем.

## Отчёт
RU-таблица `План | Сделано | Осталось | Проверка` + commit hash, files changed, conflicts, provider-free guard status, batch size report.
