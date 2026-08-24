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

## 2. Канонизация кодов

Единый helper (в `src/data/certifications.ts`), используемый рендерингом, проверкой дублей и сохранением:

- `"IFS Food"` → `IFS`, `"EU Approval Number"` → `EU` (алиас-таблица известных синонимов);
- известные алиасы отображаются и сохраняются как канонические коды справочника;
- неизвестные legacy-строки (`"BAP"`, `"EU Health Mark"`) остаются как есть, видимы и удаляемы;
- дубли исключаются по каноническому коду, а не по сырому тексту.

## 3. Изменяемые файлы

| Файл | Изменение |
|---|---|
| `src/data/certifications.ts` | алиас-таблица + `canonicalizeCertificationCode()`, список доступных кодов |
| `src/components/account/AccountCertificationPicker.tsx` | новый компонент: компактный multi-select со поиском, клавиатурой и chips |
| `src/pages/account/Account.tsx` | убрать `productFocus` из карточки Trust (read + edit), сертификаты через picker |
| `src/i18n/translations.ts` | EN/RU/ES ключи, заголовок карточки: «Сертификаты и допуски» / «Certifications and approvals» / «Certificaciones y autorizaciones»; без сырых enum |
| `src/components/account/SupplierProfilePreview.tsx` | убрать блок `productFocus`, сертификаты остаются badges |
| `e2e/p1s-company-certifications.spec.ts` | новый сценарий (п.5) |
| `e2e/account-company-edit-contract.spec.ts` | обновить кейс: без product-focus, сертификаты через picker |
| `src/pages/account/Account.test.tsx`, `Account.editable.test.tsx` | обновить ожидания карточки Trust и новый контейнер вместо Input |

Scope: `productFocus` убирается только из account Trust card и account `SupplierProfilePreview`. Публичный `SupplierProfile`, каталог `Suppliers`, API и backend не трогаем. Новых пакетов и внешних логотипов не добавляем.

## 4. Логотипы и идентификаторы

- В опциях picker, выбранных chips и read mode используем существующие локальные `CertificationInfo.logo` (MSC, ASC, BRC) + видимую аббревиатуру рядом.
- Коды без логотипа — компактный текстовый fallback (аббревиатура в рамке).
- Новые логотипы не скачиваем и не генерируем.
- Если видимый текст уже называет сертификат, соседнее изображение декоративное: `alt=""` (без дублирующего accessible name).
- Каждая опция и каждое действие удаления на мобиле ≥44px.

Стабильные канонические идентификаторы:

- в storage/справочнике и в testid — только `GLOBALGAP`; в UI допустимо отображение `GLOBALG.A.P.`;
- testid: `account-company-certificate-chip-GLOBALGAP`, `account-company-certificate-remove-GLOBALGAP`, `account-company-certificates-option-GLOBALGAP`;
- testid никогда не выводятся из локализованных названий или пунктуации.

## 5. Обратная совместимость

- `CompanyProfile.productFocus` и данные в storage не меняются; поле сохраняется при save, completion-счётчик и `s_certificates` работают как раньше.
- `certificates: string[]` — тот же тип; сохраняются канонические коды, неизвестные значения — без изменений.
- testid `account-company-certificates` остаётся, но теперь на контейнере picker; все unit/e2e потребители, ожидавшие `Input`, обновляются.
- Поведение Save/Cancel в `EditableCard` не меняется.
- Дополнительные testid: `account-company-certificate-chip-<CODE>`, `account-company-certificate-remove-<CODE>`, `account-company-certificates-search`, `account-company-certificates-option-<CODE>`, `account-company-certificates-empty`.

## 6. Playwright-сценарии (`e2e/p1s-company-certifications.spec.ts`)

Фикстура детерминированная: профиль стартует с одним выбранным `MSC`, далее вторым добавляется `HACCP`, третьим — `GLOBALGAP` (в UI `GLOBALG.A.P.`). Тест доказывает, что picker остаётся открытым/пригодным после каждого выбора и допускает три последовательных выбора без повторного входа в edit mode.

1. Read: в карточке Trust нет блока «Продуктовый фокус»; сертификаты — chips с логотипом (MSC/ASC/BRC) или текстовым fallback.
2. Три последовательных выбора без переоткрытия формы; picker остаётся usable после каждого.
3. Выбранный сертификат недоступен в списке; после удаления снова доступен.
4. Удаление и повторное добавление в одной сессии редактирования.
5. Клавиатура: ArrowDown/ArrowUp, Enter, Escape.
6. Пустой поиск / состояние «ничего не найдено».
7. Фокус остаётся на picker (или возвращается к нему) после выбора и удаления.
8. Save → reload → повторный вход в edit: выбранные chips префилл.
9. Legacy: `"IFS Food"` и `"EU Approval Number"` отображаются как `IFS`/`EU`; `"BAP"` остаётся как есть и удаляется.
10. Декоративность логотипов: у изображений рядом с видимой аббревиатурой `alt=""`.
11. Mobile 390px: нет horizontal overflow, все действия ≥44px, нет nested interactive.

## 7. Acceptance

`npx tsc -p tsconfig.app.json --noEmit`, `npm run check:provider-boundary`, `npm run build`, focused Vitest, Playwright.

Скриншоты в `test-results/p1s-company-certifications/`:

- desktop read;
- desktop edit с открытым picker, где видны опции с логотипом и без логотипа;
- mobile 390 read;
- mobile 390 edit с открытым picker;
- mobile выбранные chips с логотипом и с текстовым fallback;
- legacy-канонизированные chips `IFS` и `EU`.

Программно: отсутствие horizontal overflow, отсутствие nested interactive controls, mobile-действия ≥44px, отсутствие console/page errors, отсутствие provider-free scaffold.

Стоп после `/account/company`.
