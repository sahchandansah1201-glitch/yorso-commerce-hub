# Next Actions

## Current Next Action

P1I meta-regions defect fix is the active GitHub handoff.

Open PR: `https://github.com/sahchandansah1201-glitch/yorso-commerce-hub/pull/196`

Branch: `codex/p1i-meta-regions-country-picker-fix`

This is a frontend-only account workspace fix over `/account/meta-regions`:

- meta-regions require at least 2 countries;
- after selecting one country, the country picker remains ready for the next
  country instead of leaving the user in a dead input state;
- selected countries are excluded from the next result list;
- duplicate countries are blocked;
- removing a selected country still works after adding another country;
- read mode shows country chips and does not expose technical reason/currency
  or `usedFor` enum values;
- no backend, storage, auth, supplier access, catalog source or hosted provider
  behavior was added.

Next operational step: wait for PR #196 GitHub checks, then merge/sync Lovable
only if CI is green. Do not mark P1I accepted from chat or Lovable text alone.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| P1I defect delivery | Deliver the actual meta-region country-picker fix to GitHub/Lovable. | PR #196 opened and locally re-verified after CI blockers were fixed. | Wait for GitHub checks, then merge/sync only if green. |
| Country picker repeated selection | User can add Argentina, immediately search/select Brazil, then save 2+ countries. | Playwright e2e 17/17 plus repeat 14/14; screenshots show Argentina -> Brazil at 390px. | Keep this scenario as required acceptance for future picker changes. |
| Flaky e2e hardening | Avoid `networkidle` waits that can hang on this app. | Meta-regions e2e now waits on account-section UI readiness and persisted text. | Avoid `networkidle` in new account workspace tests unless there is a clear reason. |
| Catalog picker | Дать пользователю выбор продукта из workbook-backed справочника. | Picker подключён к add/edit form; e2e проверяет `Scomber scombrus (Atlantic mackerel)` и заполнение полей. | После commit/push подтянуть GitHub `main` в Lovable. |
| Product identity | Показывать продукт как `Latin (commercial)`, а не заставлять пользователя связывать две разные колонки. | Desktop table, mobile card, detail panel и delete context используют Latin-first product identity; отдельные storage/edit fields сохранены. | После Lovable sync визуально проверить desktop/mobile. |
| Commercial search | Поиск по коммерческому/локализованному названию должен находить Latin name. | `searchCatalog` ищет по `latin`, `en`, `es`, `ru`, `fr`, `cn`, `de`; unit test покрывает EN и RU. | Позже улучшить ranking/keyboard combobox, если понадобится. |
| Delete copy | Уменьшить поясняющий текст в delete dialog. | Title/description сокращены в EN/RU/ES; e2e проверяет отсутствие старого длинного RU текста. | Сохранять structured context: product identity, role, state. |
| Provider-free guard | Не возвращать Supabase scaffold. | Изменения не добавляют backend/provider runtime. | В каждом Lovable sync проверять provider-free tests. |
| Visual QA | Проверять реальный UI без Browser MCP, так как transport нестабилен. | Browser MCP исключён из обязательного процесса; основной путь — Playwright tests/scripts/screenshots. | Сохранять screenshots в `output/playwright/` и указывать overflow result. |

## Next Implementation After Series Closure

Recommended next scoped implementation after closing Prompt 0-6 / P1B:

1. P1C Products Picker Keyboard/A11y & Ranking:
   - make the picker behave as a proper keyboard-accessible combobox/listbox;
   - support ArrowDown, ArrowUp, Enter and Escape;
   - add/verify `aria-expanded`, `aria-activedescendant`, option ids and active
     option state;
   - improve ranking so exact Latin matches come first, then exact commercial
     matches, then localized partial matches;
   - keep the current `Latin (commercial)` identity and selected summary.
2. Later optional scope: product delete undo/toast feedback.

## Testing Protocol

- Do not use Browser MCP as an acceptance gate for Yorso UI work unless the
  user explicitly asks for it in that turn.
- Primary replacement: Playwright project e2e tests, route-specific Playwright
  scripts and Playwright screenshots.
- For visual UI checks, capture at least desktop and 390px mobile screenshots
  under `output/playwright/` when the change affects rendered layout.
- For mobile scanability, record:
  `document.body.scrollWidth <= document.documentElement.clientWidth`.
- For interaction quality, keep checking nested controls:
  `a button`, `button a`, `a a`, `button button`.
- If a route needs a signed-in session, use the same localStorage/sessionStorage
  setup as the relevant e2e spec instead of relying on manual browser state.

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
