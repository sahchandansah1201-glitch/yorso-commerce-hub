# P1S — verification gate: /account/company (Trust & Certifications)

Read-only проверка. Файлов проекта изменено: **0**.

## Идентификация

- Repo: `sahchandansah1201-glitch/yorso-commerce-hub`
- Рабочая ветка окружения: `edit/edt-f0ba54ff-…` (синхронизирована с `local-lab/agent-capability-foundation`), `main` не тронут
- HEAD: `556375526860938aa48d7e92ce14272a04d8044a` — совпадает с ожидаемым
- Working tree: чистый

## Skills / capabilities

- Skills: `yorso-real-user-acceptance`, `yorso-provider-free-github-sync`, `yorso-multilingual-interface-copy`, `yorso-ui-surface-build` (только как чек-лист).
- Capabilities: чтение файлов и `rg`; `npm run check:provider-boundary`; официальный прогон `npm run smoke:e2e:p1s-company-certifications` (build + Playwright/Chromium, 7/7 PASS); независимый Playwright-прогон по собственному конфигу вне репозитория (`/tmp/browser/p1s`), 3/3 PASS, скриншоты desktop/390px EN/RU/ES.
- Ограничения: прямой запуск spec через основной конфиг требует `E2E_USE_WEB_SERVER=1` и preview-сборки (без них — 7 fail, это инфраструктура, не дефект UI); bundled chromium отсутствует, использован `/bin/chromium`; окружение заново генерирует `src/integrations/supabase/` и `supabase/` — удалены штатным `precheck`, в трекинге git их нет.

## Проверки

| Проверка | Ожидание | Факт | Статус | Доказательство |
|---|---|---|---|---|
| SHA | `5563755…` | `556375526860938aa48d7e92ce14272a04d8044a` | PASS | `git rev-parse HEAD` |
| Working tree | чисто | пусто | PASS | `git status --porcelain` |
| Provider-free | нет импортов Supabase/BaaS | 366 файлов, 0 импортов | PASS | `check:provider-boundary` |
| Supabase scaffold / dep | отсутствует в репо | в git нет ни `src/integrations/supabase`, ни `supabase/`, ни `@supabase/*` в package.json/lock | PASS | `git ls-files`, `rg '"@supabase'` |
| productFocus в Trust card | отсутствует | в `Account.tsx` карточка Trust содержит только сертификаты | PASS | `Account.tsx:882–922`, e2e `not.toContainText("Product focus")` |
| productFocus в account `SupplierProfilePreview` | отсутствует | нет блока | PASS | чтение компонента |
| Официальные e2e P1S | PASS | 7/7 | PASS | `smoke:e2e:p1s-company-certifications` |
| 3 последовательных выбора без переоткрытия edit | picker остаётся usable | MSC→HACCP→GLOBALGAP подряд | PASS | независимый прогон |
| Remove / re-add в одной сессии | работает | MSC удалён и добавлен снова | PASS | независимый прогон |
| Focus после удаления | возвращается к picker | `account-company-certificates-search` | PASS | лог `FOCUS_AFTER_REMOVE` |
| Клавиатура + `aria-activedescendant` | привязан к активной опции | атрибут заполнен после ArrowDown | PASS | независимый прогон |
| Save → reload → prefill | чипы префилл | HACCP/GLOBALGAP видны после reload и повторного edit | PASS | `desktop-edit-prefill-after-reload.png` |
| Legacy канонизация | `IFS Food→IFS`, `EU Approval Number→EU` | чипы `IFS`, `EU` | PASS | read-mode скриншот |
| Стабильные id | testid на `GLOBALGAP`, в UI `GLOBALG.A.P.` | подтверждено | PASS | лог `GLOBALGAP_VISIBLE_TEXT` |
| Raw enum leakage | нет | видимый текст без `snake_case` | PASS | лог `CARD_TEXT` |
| Horizontal overflow 390px | 0 | 0 (RU и ES) | PASS | лог `OVERFLOW` |
| Nested interactive | 0 | 0 | PASS | лог `NESTED` |
| Mobile targets ≥44px | все | нарушений нет | PASS | лог `SMALL: []` |
| Console/page errors | нет | нет | PASS | все прогоны |
| EN/RU/ES метки | нативные | «Certifications and approvals» / «Сертификаты и допуски» / «Certificaciones y autorizaciones» | PASS | e2e locale-кейсы |

## Визуальные находки

| Severity | Finding | User impact | Required correction | Evidence |
|---|---|---|---|---|
| Warning (defect, i18n) | Видимое имя сертификата не локализуется: в RU/ES чип показывает `EU Approved` (также `Halal`, `Kosher`) — `name` в `src/data/certifications.ts` вне i18n | RU/ES-закупщик видит смешанный язык в списке допусков; «EU Approved» — статус, а не бренд | Локализовать `name` для не-брендовых кодов (EU → «Допуск ЕС» / «Autorización UE», Halal → «Халяль», Kosher → «Кошер»), бренды (MSC/ASC/BRC/GLOBALG.A.P./ISO/FDA) оставить | `mobile-390-edit-picker-ru.png` |
| Warning (defect, density) | Текстовый fallback дублирует само имя для 3-буквенных кодов: чипы/опции читаются как «IFS IFS», «FDA FDA», «FOS Friend of the Sea» + `HAC HACCP` | шум при сканировании, ложная избыточность | Показывать fallback-аббревиатуру только когда она не совпадает с первыми символами видимого имени, иначе только имя | `desktop-read-en.png`, лог `CARD_TEXT` |
| Info (defect, copy) | Заголовок карточки `Trust and certificates` / «Доверие и сертификации» после удаления Product Focus описывает только сертификаты | заголовок обещает больше, чем содержит | Привести заголовок к содержанию: «Сертификаты и допуски» / «Certifications and approvals» / «Certificaciones y autorizaciones» | `desktop-read-en.png` |
| Info (preference) | Логотипы 16px (read) / 20px (chip) — ASC/MSC нечитаемы, работают как цветовое пятно | слабый сигнал доверия | Поднять до 20–24px в read и chip, сохранив ≥44px тач-зоны | `desktop-read-en.png` |
| Info (preference) | Все чипы одного веса, порядок = порядок хранения | нет приоритета ключевых допусков (MSC/ASC/EU) | Стабильная сортировка по значимости справочника | `desktop-read-en.png` |

Блокирующих дефектов нет: доступ, канонизация, клавиатура, персистентность, мобильные метрики и provider-free — все подтверждены.

## Verdict

**PASS WITH RISKS** — риски только визуальные/копирайтинговые (два Warning выше), продуктовая логика P1S подтверждена независимо.

## Не проверено

- Реальный SHA удалённой ветки на GitHub (нет доступа к remote из окружения) — синхронизация подтверждена только локальным HEAD.
- Скринридер (NVDA/VoiceOver), контраст по инструментальному замеру APCA/WCAG, реальные тач-жесты на устройстве.
- Публичный `SupplierProfile` и каталог `Suppliers` (вне scope P1S).

## Предлагаемая коррекция (следующий batch, только по одобрению)

1. Локализация `name` для не-брендовых кодов справочника (EU, Halal, Kosher) в EN/RU/ES + обновление e2e locale-кейсов.
2. Подавление дублирующего текстового fallback, когда аббревиатура совпадает с именем.
3. Заголовок карточки Trust → «Сертификаты и допуски» и аналоги EN/ES.
4. Логотипы 20–24px в read/chip без изменения тач-зон.

Scope: только `/account/company`, `src/data/certifications.ts`, `src/i18n/translations.ts`, картинки не добавляются, backend/provider не трогаем.
