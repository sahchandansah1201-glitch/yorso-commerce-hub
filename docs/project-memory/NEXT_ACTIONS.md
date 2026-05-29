# Next Actions

## Current Next Action

Backend Phase 2J is implemented and committed locally at `f753224f`.

Phase 2J closes Phases 2A-2I as one self-hosted auth, registration and password
recovery surface. The remaining auth Supabase prototype fallback was removed
from code.

## Plan / Fact

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Auth runtime | Убрать Supabase auth fallback из `/signin` и `/reset-password`. | Реализовано: `auth-runtime.ts` не содержит `legacy-auth-supabase-adapter`, `supabase_prototype`, `VITE_SUPABASE` branching или direct Supabase import. | Не возвращать hosted auth provider в runtime. |
| Adapter file | Удалить код, который вызывал Supabase Auth. | Реализовано: `src/lib/legacy-auth-supabase-adapter.ts` удалён. | Boundary test проверяет отсутствие файла. |
| Session/analytics source | Убрать Supabase как источник browser session. | Реализовано: `AuthRuntimeSource`, `BuyerSessionSource`, analytics auth/workspace source = `self_hosted` / `local_contract`. | Старые optional source значения больше не эмитятся runtime'ом. |
| Guards | Запретить возврат auth Supabase fallback. | Реализовано: `test:auth-runtime`, `check:self-hosted-api`, `check:production-scale-baseline`. | Держать guards в `ci:core`. |
| Debt list | Точно выделить оставшийся Supabase/prototype debt вне auth. | Реализовано: Phase 2J doc фиксирует catalog fallback, supplier-access fallback, Supabase reference tooling/tests, empty env keys и dependency. | Убирать отдельными Phase 3 batches. |

## Next Implementation After Phase 2J

Recommended next scoped workstream:

Backend Phase 3A: catalog Supabase fallback removal.

Concrete scope:

- удалить `src/lib/legacy-catalog-supabase-adapter.ts`;
- перевести `src/lib/catalog-api.ts` в self-hosted API first + local fixture
  preview only, без Supabase fallback;
- обновить `src/lib/catalog-api.boundary.test.ts`, `useLandingOffers` source
  naming and related docs/guards;
- подтвердить `/`, `/offers`, `/offers/:id` behavior through existing
  self-hosted API/local fixture paths;
- не трогать supplier-access fallback в этом же batch, кроме фиксации как
  следующего отдельного debt.

Alternative after Phase 3A:

Backend Phase 3B: supplier-access Supabase fallback removal.

## Guardrails To Preserve

- Batches #110-#141 public UX/a11y safeguards.
- Batch #112 route code splitting.
- Batch #113 route chunk error boundary.
- Buyer-first public narrative.
- Access gating: `anonymous_locked`, `registered_locked`, `qualified_unlocked`.
- Supplier identity redaction.
- Exact-price locks.
- Self-contained product direction: do not add or expand hosted BaaS/Supabase
  dependency in production paths.
