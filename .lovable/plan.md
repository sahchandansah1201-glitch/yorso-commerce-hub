# P1S — /account/company: Trust & Certifications cleanup

Ветка: `local-lab/agent-capability-foundation`. Только UI-слой вкладки `/account/company`.
Backend, API, auth, provider-free policy, другие вкладки и `main` не трогаем.

## 1. Что уже есть в коде и данных

Локальный справочник `src/data/certifications.ts` — 12 кодов с EN/RU/ES:

| Код | Отображение | Логотип |
|---|---|---|
| MSC | MSC | есть |
| ASC | ASC | есть |
| BRC | BRC | есть |
| HACCP, IFS, GLOBALGAP, EU, FDA, HALAL, KOSHER, FOS, ISO22000 | аббревиатура / «EU Approved» | нет |

Функция `getCertificationInfo(code, lang)` уже нормализует код (upper-case, убирает пробелы/точки/дефисы) и даёт локализованные `name`, `fullName`, `issuer`, `description`.

Текущее состояние карточки «Доверие и сертификации» (`Account.tsx`, ~строки 874–933):
- read: блок «Продуктовый фокус» (дублирует данные о продуктах) + блок «Сертификаты» chips;
- edit: два `Input` со вводом через запятую (`splitList`), testid `account-company-product-focus`, `account-company-certificates`.

Данные в mock-профиле содержат значения вне справочника: `"IFS Food"`, `"EU Approval Number"`, у филиалов — `"BAP"`, `"EU Health Mark"`.

## 2. Изменяемые файлы

| Файл | Изменение |
|---|---|
| `src/components/account/AccountCertificationPicker.tsx` | новый компонент: компактный multi-select по справочнику + chips выбранного |
| `src/pages/account/Account.tsx` | из карточки Trust убрать блок «Продуктовый фокус» (read + edit), сертификаты — через новый picker |
| `src/i18n/translations.ts` | ключи EN/RU/ES: заголовок карточки-подписи, «Добавить сертификат», «Удалить {code}», пустое состояние, поиск/подсказка; без сырых enum |
| `src/components/account/SupplierProfilePreview.tsx` | убрать блок `productFocus` (если он там рендерится) и оставить сертификаты как badges |
| `e2e/p1s-company-certifications.spec.ts` | новый сценарий (см. п.4) |
| `e2e/account-company-edit-contract.spec.ts` | обновить старый кейс: убрать ввод product-focus, ввод сертификатов заменить на выбор из picker |
| `src/pages/account/Account.test.tsx`, `Account.editable.test.tsx` | обновить ожидания по карточке Trust |

Модель данных `CompanyProfile.productFocus` и `certificates` остаются без изменений — поле `productFocus` просто не редактируется и не показывается на этой вкладке.

## 3. Обратная совместимость

- Тип и local prototype storage не меняются: сохраняем `certificates: string[]` с кодами справочника.
- Значения вне справочника (`"IFS Food"`, `"EU Approval Number"`, `"BAP"`) не удаляются: `getCertificationInfo` возвращает fallback, chip рендерится с исходной строкой и остаётся удаляемым. Новых сертификатов picker не придумывает — добавить можно только из справочника.
- `productFocus` сохраняется в объекте при save (не обнуляется), поэтому счётчик completion и другие поверхности не ломаются.
- `s_certificates` в `account-store.ts` продолжает считать `certificates.length >= 1` — логику не меняем.
- testid `account-company-certificates` остаётся на контейнере picker, чтобы контракт не рвался; для элементов добавляются `account-company-certificate-chip-<CODE>`, `-remove-<CODE>`, `-add`.

## 4. Playwright-сценарии (`e2e/p1s-company-certifications.spec.ts`)

1. Read-режим: карточка Trust не содержит блока «Продуктовый фокус»; сертификаты — badges с аббревиатурой.
2. Добавление: открыть edit → picker → выбрать MSC и ASC → chips появились; уже выбранные в списке недоступны.
3. Удаление: удалить ASC → chip исчез, ASC снова доступен в списке.
4. Сохранение и повторное открытие: Save → read показывает MSC → перезагрузка `/account/company` → значение сохранилось; повторный вход в edit префилл сохранённых chips.
5. Legacy-значение: `"EU Approval Number"` из mock остаётся chip и удаляется.
6. Mobile 390px: отсутствие horizontal overflow (`scrollWidth <= clientWidth`), touch targets ≥44px, отсутствие nested interactive (кнопка удаления не внутри другой кнопки).
7. Локали EN/RU/ES: подписи и aria-label не содержат сырых enum-значений.

## 5. Verification (после утверждения)

`npx tsc -p tsconfig.app.json --noEmit`, `npm run check:provider-boundary`, `npm run build`,
vitest по затронутым файлам, Playwright по новому и обновлённому спекам, скриншоты desktop read / mobile read / mobile edit в `test-results/p1s-company-certifications/`.
