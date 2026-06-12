# P1I — /account/meta-regions: Country List Builder

## Цель
Переделать UI секции мета-регионов: основной сценарий = «имя + список стран», без витрины enum-ов.

## Изменения UI (`src/pages/account/Account.tsx` → `MetaRegionsSection`)

### Форма add/edit
Только три блока:
1. **Имя мета-региона** — `Input` с testid `account-meta-name` (как было).
2. **Add country** — `AccountCountryCombobox` (из P1F):
   - testid `account-meta-country-combobox` (+ alias `account-meta-countries` для обратной совместимости с программными querySelector'ами).
   - При выборе страны из листбокса (или Enter по совпадению) — добавить в `draft.countries`, очистить инпут.
   - Дубликаты блокируются (canonical-ключ — нижний регистр имени или `entry.alpha2`).
   - Свободный текст разрешён только если он матчится в каталоге; иначе показывается inline-хинт и не добавляется.
3. **Selected countries** — контейнер `account-meta-selected-countries`:
   - Каждый чип `account-meta-selected-country-{idOrSlug}`: имя + опционально ISO2, кнопка удаления `account-meta-remove-country-{idOrSlug}` с `aria-label` и `min-h-11 min-w-11`.
   - Пусто → `account-meta-empty-countries` с короткой подписью.

Кнопки `account-meta-save` / `account-meta-cancel` — без изменений.
`account-meta-reason`, `account-meta-currency`, `account-meta-notes`, `account-meta-use-*` — **удалены из формы**. Значения сохраняются внутренне:
- new: `logisticsReason='manual'`, `defaultCurrency='EUR'`, `usedFor=['supplier_matching']`, `notes=''`.
- edit: сохраняем существующие значения региона.

### Read-mode карточка
- Заголовок — имя.
- Тело: чипы стран (wrap, `flex flex-wrap gap-1.5`); если пусто — fallback-строка.
- Технические поля (reason/currency/usedFor) **не отображаются**.
- Edit/Delete в футере (как сейчас, testid'ы сохраняются).

### Шапка секции
Короткий explainer: EN/RU/ES варианты из ТЗ. Старые ключи `account_metaRegions_explainer`, `account_metaRegion_form_desc` обновляем; неиспользуемые reason/usedFor ключи оставляем в `translations.ts` (не удаляем — могут использоваться elsewhere, проверим rg).

## i18n (`src/i18n/translations.ts`)
- Обновить `account_metaRegions_explainer` (EN/RU/ES) на короткую формулировку.
- Новые ключи: `account_metaRegion_add_country`, `account_metaRegion_selected_countries`, `account_metaRegion_no_countries`, `account_metaRegion_remove_country` (для `aria-label`), `account_metaRegion_duplicate_country`.

## Валидация
`validateMetaRegionDraft` → только `name` (required) + `countries.length ≥ 1`. Currency/notes уходят из валидации.

## Без бэкенда / без схемы
Структура `MetaRegion` в `mockAccount`/contracts не меняется — значения подставляем дефолтами/сохраняем существующие. БД-миграции не трогаем.

## Тесты

### `e2e/account-meta-regions-crud.spec.ts` — переписать под новый UX
- helper `addCountry(page, name)` — кликает по combobox, вводит, выбирает option `account-meta-country-combobox-option-{id}` или нажимает Enter.
- adds: имя + 3 страны через combobox → save → reload → видны имя и чипы стран.
- validation: пустые name+countries → ошибки, форма не закрывается.
- edit `mr_3`: добавить страну, удалить одну через `account-meta-remove-country-*` → save → проверить.
- delete: создать + удалить, после reload не виден.
- ru-локаль: имя кириллицей + 3 страны RU, заголовок «Мета-регионы», нет утечки enum-строк.

### `e2e/account-workspace-sections.spec.ts`
Поправить только если асёртит удалённые reason/currency/usedFor строки.

## Проверка
- `npx tsc -b --noEmit`
- `npm run check:provider-boundary`
- `npm run build`
- `E2E_USE_WEB_SERVER=1 npx playwright test e2e/account-meta-regions-crud.spec.ts e2e/account-workspace-sections.spec.ts --project=chromium --reporter=list`
- Скриншоты через отдельный playwright-скрипт в `/tmp` (desktop, mobile 390 list, mobile 390 add с выбранными странами, mobile 390 edit после удаления страны) → сохранить в `/mnt/documents/p1i/`.
- Программно (внутри скриншот-скрипта): `scrollWidth ≤ clientWidth`, `a button, button a, a a, button button` = 0.
- Проверить и удалить, если появились, `src/integrations/supabase/` и `supabase/`.

## Файлы (ожидаемо)
- `src/pages/account/Account.tsx` — секция `MetaRegionsSection` (≈250 строк → ≈140).
- `src/i18n/translations.ts` — ключи EN/RU/ES.
- `e2e/account-meta-regions-crud.spec.ts` — переписан.
- (возможно) `e2e/account-workspace-sections.spec.ts` — точечно.

## Stop condition
После P1I — стоп. Никаких других вкладок account.

## Запреты (как в ТЗ)
Никакого Supabase/Cloud/внешних API, не трогать `/account/personal|branches|products`, не откатывать P1G.1 header fix, не выдумывать страны вне каталога, не показывать enum-значения.

Жду подтверждения, чтобы переключиться в Build.
