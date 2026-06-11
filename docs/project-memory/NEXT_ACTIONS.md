# Next Actions

## Current Next Action

P1A.2 Products Delete Confirmation is the active stabilization checkpoint.

This is a frontend-only account workspace checkpoint over `/account/products`:

- desktop table and mobile cards keep the existing product matrix;
- deleting one `CompanyProduct` now requires an explicit confirmation dialog;
- canceling the dialog keeps the product unchanged;
- confirming the dialog calls the existing product delete handler;
- no backend, storage, auth, supplier access, catalog source or hosted
  provider behavior is added.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Delete confirmation | Защитить удаление продукта от случайного клика. | Desktop delete и mobile delete открывают общий confirmation dialog. | После commit/push подтянуть GitHub `main` в Lovable. |
| Cancel path | Cancel не должен удалять продукт. | E2E проверяет cancel на desktop и mobile. | Сохранять при refactor. |
| Confirm path | Confirm должен переиспользовать текущий delete handler. | Dialog submit вызывает существующий `deleteProduct(target.id)`. | Undo/toast — отдельный scope, если понадобится. |
| Provider-free guard | Не возвращать Supabase scaffold. | Удалены восстановленные `src/integrations/supabase/*`, `supabase/`, tracked `.env`; `.env` добавлен в `.gitignore`. | В каждом Lovable sync проверять provider-free tests. |

## Next Implementation After P1A.2

Recommended next scoped implementation after Lovable confirms sync:

1. verify `/account/products` in Lovable after GitHub sync;
2. decide whether product delete needs undo/toast feedback;
3. keep workbook-backed product picker/catalog source changes as separate
   scope unless explicitly requested.

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
