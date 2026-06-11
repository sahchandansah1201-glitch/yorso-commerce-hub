# Next Actions

## Current Next Action

P1A.3 Products catalog picker hookup and delete copy cleanup is the active
frontend checkpoint.

This is a frontend-only account workspace checkpoint over `/account/products`:

- the workbook-backed product catalog picker must be visible in the add/edit
  product form;
- searching by commercial/localized or Latin product name must show Latin name
  first with the commercial name in parentheses, then fill both structured
  fields from the static catalog JSON;
- visible product identities in the product matrix must also use
  `Latin (commercial)` so the user learns the canonical product taxonomy while
  scanning rows/cards;
- product delete confirmation copy must stay short and unambiguous;
- no backend, storage, auth, supplier access, catalog source or hosted provider
  behavior is added.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Catalog picker | Дать пользователю выбор продукта из workbook-backed справочника. | Picker подключён к add/edit form; e2e проверяет `Scomber scombrus (Atlantic mackerel)` и заполнение полей. | После commit/push подтянуть GitHub `main` в Lovable. |
| Product identity | Показывать продукт как `Latin (commercial)`, а не заставлять пользователя связывать две разные колонки. | Desktop table, mobile card, detail panel и delete context используют Latin-first product identity; отдельные storage/edit fields сохранены. | После Lovable sync визуально проверить desktop/mobile. |
| Commercial search | Поиск по коммерческому/локализованному названию должен находить Latin name. | `searchCatalog` ищет по `latin`, `en`, `es`, `ru`, `fr`, `cn`, `de`; unit test покрывает EN и RU. | Позже улучшить ranking/keyboard combobox, если понадобится. |
| Delete copy | Уменьшить поясняющий текст в delete dialog. | Title/description сокращены в EN/RU/ES; e2e проверяет отсутствие старого длинного RU текста. | Сохранять structured context: product identity, role, state. |
| Provider-free guard | Не возвращать Supabase scaffold. | Изменения не добавляют backend/provider runtime. | В каждом Lovable sync проверять provider-free tests. |

## Next Implementation After P1A.3

Recommended next scoped implementation after Lovable confirms sync:

1. verify `/account/products` in Lovable after GitHub sync;
2. decide whether the product picker needs full ARIA combobox keyboard
   navigation and result ranking;
3. decide whether product delete needs undo/toast feedback.

## Guardrails To Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Buyer-first public narrative.
- Access gating: `anonymous_locked`, `registered_locked`, `qualified_unlocked`.
- Supplier identity redaction.
- Exact-price locks.
- Supplier document download grants and file serving remain qualified-only and audit-bound.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase dependency in production paths.
