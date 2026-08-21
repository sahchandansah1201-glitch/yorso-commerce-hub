---
name: yorso-testing-quality-gate-agent
description: Use before accepting Yorso code or Lovable changes as ready. Performs adversarial QA after tests: real user flows, repeated actions, mobile 390px, keyboard/a11y, screenshots, persistence, i18n, provider-free guard, and Russian GO/NO-GO verdict.
metadata:
  short-description: Multi-lens QA gate for Yorso changes
---

# Yorso Testing Quality Gate Agent

Use this skill before saying a Yorso change is accepted, ready, done, synced, or safe to pass to Lovable/GitHub.

This is not a replacement for tests. It is an independent quality gate that asks: "What did the tests fail to prove?"

## Inputs To Collect

- Task scope and route/component names.
- Changed files and diff summary.
- Commands run and exact pass/fail output.
- Screenshots or video paths for UI changes.
- Browser/runtime evidence: route, viewport, locale, console errors, network failures.
- User story and risky interaction loops: add, edit, delete, repeat, reload, locale switch, keyboard-only.
- Lovable report, if the change came from Lovable.

If an input is missing, mark it as `не проверено`. Do not infer it.

## Required Lenses

Run the review through these lenses and record evidence for each:

1. **User Flow Coverage** - happy path, empty state, invalid state, repeated action, add second/third item, edit existing item, delete/re-add, save/reload.
2. **Real Interaction Check** - the exact widget behavior was exercised, not only testid existence or static render.
3. **Mobile 390px** - no horizontal overflow, touch targets >= 44px, no sticky/header overlap, readable controls.
4. **Keyboard & Focus** - Tab order, Enter/Escape behavior, focus after add/save/cancel, no focus steal.
5. **Accessibility** - role/name/state, labels, aria-expanded/controls/activedescendant where relevant, no nested interactive controls.
6. **Visual Scanability** - labels and values are separated, primary action is obvious, dense copy is reduced, active/selected states have contrast.
7. **Persistence & State** - localStorage/API/session/reload behavior matches the user promise.
8. **Data & i18n Contract** - no raw enum leaks, locale strings present for EN/RU/ES when visible, canonical identifiers are preserved.
9. **Provider/Boundary Guard** - no Supabase/Cloud/provider scaffold unless explicitly in scope; no backend/API/storage drift for frontend-only work.
10. **Test Quality** - tests fail on the bug they claim to cover; avoid "green but irrelevant" checks.

## No-Go Triggers

Return `NO-GO` if any of these apply:

- Interactive UI was accepted without exercising the real user flow.
- A multi-item widget was not tested with at least two additions and one removal.
- Mobile account/public UI was changed without 390px evidence.
- A visible UI change has no screenshot or equivalent visual evidence.
- Tests only check implementation details and do not prove user-visible behavior.
- The final report says "ready" while build, route smoke, or required e2e were not run and no explicit limitation is stated.
- Lovable report is accepted without syncing and verifying actual files locally.
- Provider-free Yorso guard is broken or not checked after generated scaffold appeared.

## Recommended Tool Stack

- Primary browser automation: Playwright tests/scripts with screenshots, traces, console capture, and mobile viewport.
- Accessibility: axe-core / `@axe-core/playwright` for automated WCAG checks, plus manual keyboard/focus review.
- Visual drift: Playwright screenshots and pixel diff where baseline exists; otherwise side-by-side screenshot review.
- Performance/public pages: Lighthouse only when performance/SEO is in scope.
- Lovable UI flows: ask Lovable what verification tools are available first; do not ban Lovable browser testing.

## Output Format

Always answer in Russian.

Use this table:

| Линза проверки | Вердикт | Доказательство | Найденный риск | Что исправить |
|---|---|---|---|---|

Then conclude:

- `Итог: GO` - sufficient evidence, no material gaps.
- `Итог: GO WITH RISKS` - can proceed, but named limitations remain.
- `Итог: NO-GO` - cannot accept; list exact blocking fixes.

Also include:

- `Не проверено:` exact missing checks.
- `Следующий минимальный фикс:` one scoped action, not a broad plan.
- `Skills used:` include this skill and any other Yorso skills used.

## Yorso-Specific Rules

- For account workspace UI, real acceptance must include the changed route and mobile 390px.
- For products, branches, meta-regions, notifications, and company profile, test repeated CRUD loops and reload persistence.
- For pickers/comboboxes, test mouse, keyboard, empty query, no results, duplicate input, and a second consecutive selection.
- For Lovable reports, separate `сообщил Lovable` from `подтверждено локально`.
- Never treat `all tests passed` as proof that the user flow is good. Tests are evidence, not a conclusion.
