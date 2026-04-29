## Состояние: уже реализовано

Проверил `src/i18n/how-it-works.ts` и `src/pages/HowItWorks.tsx` — все требуемые изменения этого промпта уже на месте после предыдущей итерации:

**Hero:**
- H1 построен вокруг уверенности покупателя: `hero_titlePrefix` + `hero_titleHighlight` ("seafood procurement decision" / "решение о закупке морепродуктов" / "compra de pescado y marisco") + `hero_titleSuffix`.
- Primary CTA: `hero_ctaFind` → "Find products and suppliers" / "Найти продукты и поставщиков" / "Encontrar productos y proveedores", ведёт на `/offers`.
- Secondary buyer CTA: `hero_ctaRequestAccess` → "Request access to a supplier" / "Запросить доступ к поставщику", ведёт на `/offers#request`.
- Supplier CTA (`hero_ctaSupplier`) — мелкая текстовая ссылка под кнопками, визуально вторичная.

**Buyer Decision Snapshot (сразу после hero):**
- Секция `#buyer-decision-snapshot` с 3 карточками.
- Каждая карточка: иконка (ShieldCheck / Scale / FileCheck2) + ярлык "Buyer question" + заголовок-вопрос + блок "What Yorso provides" + блок "Evidence the buyer gets" с верхним бордером и success-цветом.
- 3 вопроса покрыты: доверие к поставщику, обоснованность цены, защита решения внутри компании.
- Доказательства: статус верификации, low/avg/high диапазон цены, экспортируемый отчёт Procurement Decision Proof / audit trail.
- Внизу — `bds_supplierNote` курсивом про вторичность поставщиков.

**Языки:** EN/RU/ES обновлены, длины массивов (`bds_cards: 3`) совпадают с типом.

**Стиль:** em-dashes удалены из новых ключей, hype-слов нет, формулировки в духе "buyer can check / compare / request / export".

## Что нужно сделать

Ничего. Задача уже выполнена в предыдущем шаге. Нет смысла перезаписывать те же файлы — это сожжёт кредиты без изменения результата.

## Предлагаю на выбор

1. **Перейти к следующей секции** `/how-it-works` (Problem Map или System Map) с тем же buyer-first аудитом и реализацией.
2. **Вернуться к главной** и продолжить аудит с блока **Live Wholesale Offers** (как договаривались до отвлечения на /how-it-works).
3. **QA-проход по уже сделанному** Hero + BDS: открыть превью на 1379px и 375px, проверить сканируемость, выровнять мелочи (отступы, weight иконок, контраст) — уже без копирайтных правок.

Скажи, какой путь выбираем, и я перейду в build mode только под него.