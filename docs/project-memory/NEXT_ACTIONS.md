# Next Actions

## Current Next Action

P1A.1 Products Mobile Scanability has been pushed to GitHub `main` and is ready
for Lovable sync.

This is a frontend-only account workspace checkpoint:

- `/account/products` keeps the existing desktop product table;
- mobile `<md` now renders labelled product cards instead of forcing users to
  scan a horizontal table;
- cards reuse the same product data, filters, sorting, pagination, detail, edit
  and delete handlers;
- no backend, storage, auth, supplier access, catalog source or
  Supabase/runtime behavior changed.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Mobile cards | Убрать мобильное чтение через horizontal table. | Добавлены labelled product cards на `<md`. | Проверить в Lovable после sync. |
| Desktop table | Сохранить текущий desktop UI. | Таблица остается на `md+`, старые test ids сохранены. | Не менять без отдельного prompt. |
| Actions | Сохранить детали/редактирование/удаление. | Mobile cards вызывают те же handlers, touch targets 44px. | Delete confirm отдельно. |
| Sync | Сделать локальную и Lovable/GitHub базу единой. | P1A.1 отправлен в GitHub `main`. | Подтянуть `main` в Lovable. |

## Next Implementation After P1A.1

Recommended next scoped implementation after Lovable confirms sync:

1. review `/account/products` visual density in Lovable against the mobile
   screenshot;
2. decide whether delete confirmation is needed for product rows/cards;
3. keep workbook-backed product picker and catalog source as separate scope.

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
