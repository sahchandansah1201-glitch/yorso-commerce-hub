# Next Actions

## Current Next Action

P1B Products picker usability and search confidence is the latest accepted
frontend checkpoint.

This was a frontend-only account workspace checkpoint over `/account/products`:

- product catalog picker results show Latin name as the primary identity and
  commercial/localized name as secondary context;
- the add/edit form shows a selected-product summary from the current draft;
- helper and no-results copy are short and unambiguous;
- the workflow keeps `commercialName` and `latinName` as separate structured
  fields and continues to render visible product identities as
  `Latin (commercial)`;
- no backend, storage, auth, supplier access, catalog source or hosted provider
  behavior was added.

## План / факт

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
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
