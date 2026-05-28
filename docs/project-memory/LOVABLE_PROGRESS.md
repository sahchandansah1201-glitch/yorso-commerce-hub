# План/факт по Lovable prompt и ответам

Обновлено: 2026-05-28

## Назначение

Этот файл фиксирует каждый prompt для Lovable и каждый ответ Lovable в
табличной форме. Цель: видеть реальный прогресс по batch, не полагаться на
память чата и не смешивать запрошенное с фактически проверенным.

## Правила

- Строка добавляется только когда есть конкретный prompt для Lovable или
  конкретный ответ Lovable.
- Нельзя отмечать пункт как выполненный только потому, что он был указан в
  prompt.
- В колонке `Факт / проверено` должны быть реальные файлы, маршруты, тесты или
  команды.
- Если пункт взят только из ответа Lovable и локально не перепроверен, писать
  `сообщено Lovable, локально не перепроверено`.
- Если локальная проверка была, указывать команду или точный файловый чек.
- Если пункт не реализован, неизвестен или pending, писать это прямо.
- В каждом будущем ответе по batch использовать русскую таблицу:
  `План`, `Факт / проверено`, `Будет реализовано`, `Статус точности`.

## Таблица прогресса

| Дата | Batch / prompt | Источник ответа Lovable | План | Факт / проверено | Будет реализовано | Статус точности |
|---|---|---|---|---|---|---|
| 2026-05-28 | Batch #141 / `docs/project-memory/PROMPTS/prompt-141-lovable-sync.md` | Пользователь передал отчёт Lovable sync по Batch #141; дополнительно выполнены локальные файловые проверки 2026-05-28 | Синхронизировать Lovable с GitHub `main` после Batch #141. Проверить локализованные имена кнопок закрытия public catalog sheet/drawer в RU/ES. Сохранить поведение catalog drawer, access gating, supplier identity redaction, exact-price locks, public SEO, Batch #112 code splitting, Batch #113 route chunk boundary и safeguards #110-#140. | Локально проверено по файлам: `src/components/ui/sheet.tsx` содержит optional `closeLabel` с default `Close`; `src/components/catalog/CompareTray.tsx` и `src/components/catalog/IntelligenceRail.tsx` передают `closeLabel={t.aria_close}`; `src/components/catalog/SheetCloseLocale.test.tsx`, `e2e/public-sheet-close-locale-a11y.spec.ts`, package smoke scripts и Batch #141 production-scale notes присутствуют. Lovable сообщил clean sync, отсутствие конфликтов, отсутствие локальных изменений, сохранение поведения catalog drawer и известных warning-ов. | По Batch #141 ничего не осталось. Следующий не-Lovable workstream: Backend Phase 1A Account Session Authority Gate из `docs/backend/phase-1-account-source-of-truth-discovery-audit.md`. | Проверено по repository files через `rg` и чтение файлов. Runtime/e2e заново в этом tracker update не запускались; pass counts остаются из предыдущей Batch #141 validation и ответа Lovable. |

## Обязательный формат таблицы в будущих ответах по batch

| Зона | План | Факт / проверено | Будет реализовано | Статус точности |
|---|---|---|---|---|
| Prompt | Что prompt просил Lovable синхронизировать или реализовать. | Подтверждённый prompt file/path. | Что в prompt ещё не закрыто. | `Проверено`, `только сообщено Lovable`, `неизвестно` или `pending`. |
| Ответ Lovable | Что Lovable сообщил в отчёте. | Какие пункты ответа проверены по файлам/маршрутам/тестам. | Что осталось нерешённым или требует follow-up. | Точное основание: файл, команда, route check или “не перепроверено”. |
| Реализация | Ожидаемые изменения в коде/docs/tests. | Реальные файлы/routes/tests, которые присутствуют. | Следующий scoped implementation. | Локальная проверка или честная оговорка. |
| Safeguards | Какие ограничения и сохранённое поведение должны остаться. | Какие safeguards проверены или только сообщены. | Что нужно перепроверить в следующем batch. | Не называть локально проверенным то, что не проверялось. |
