# Next Actions

## Current Next Action

Backend Phase 3C is implemented and committed locally at `6c2f5368`.

Phase 3C retires the active Supabase/provider reference tooling. The tracked
product surface is now provider-free: runtime source, env examples, package
scripts, dependency graph, CI guards and frontend smoke tests no longer require
Supabase or another hosted BaaS.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Provider files | Убрать активные Supabase project/reference files. | Реализовано: удалены `supabase/`, `src/integrations/supabase`, Supabase scripts и RLS/reference tests. | Исторические docs не считать runtime. |
| Dependency | Убрать hosted BaaS SDK из продукта. | Реализовано: `@supabase/supabase-js` удалён из `package.json` и lockfile. | Не возвращать SDK без нового ADR. |
| Env | Убрать Supabase env debt. | Реализовано: `.env` и `.env.example` без `VITE_SUPABASE_*`; smoke scripts больше не инжектят Supabase stubs. | Provider secrets не хранить в repo. |
| Guard | Заменить `check:supabase-boundary`. | Реализовано: `check:provider-boundary` сканирует production source roots и запрещает hosted-provider imports/env/legacy markers. | Держать в `ci:core`. |
| Browser smoke | Переименовать no-Supabase smoke в provider-free smoke. | Реализовано: `smoke:e2e:frontend-provider-free-env` и `e2e/frontend-provider-free-env.spec.ts`. | Держать в `ci:full`. |
| Runtime policy | Убрать provider-specific admin/runtime fields. | Реализовано: старые `supabaseProductionBackend` / `prototypeSupabaseConfigured` удалены; policy provider-neutral. | Не возвращать provider-specific status fields. |
| DB contract | Убрать provider role из migration manifest. | Реализовано: `supabaseRole` удалён; migrator валидирует self-hosted PostgreSQL baseline. | Live migrations идут через `packages/db`. |
| Validation | Закрыть Phase 3C гейтами. | Реализовано: full tests/build/lint/API/smoke/guards прошли. | Сохранять Browserslist stale как отдельный maintenance item. |

## Next Implementation After Phase 3C

Recommended next scoped workstream:

Backend Phase 4A: Supplier Directory/Profile Source Of Truth Audit.

Concrete scope:

- map `/suppliers` and `/suppliers/:supplierId` frontend reads in configured
  API mode;
- verify whether `mockSuppliers` is still used only for API-disabled preview or
  can leak into configured production mode;
- document exact source-of-truth gaps for supplier directory rows, selected
  supplier panel, supplier profile tabs, shortlist/local preview and access
  shaping;
- decide the first implementation slice: either remove configured-mode mock
  leakage, or add missing backend contract coverage for supplier profile data.

## Guardrails To Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Buyer-first public narrative.
- Access gating: `anonymous_locked`, `registered_locked`, `qualified_unlocked`.
- Supplier identity redaction.
- Exact-price locks.
- Self-contained production direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
