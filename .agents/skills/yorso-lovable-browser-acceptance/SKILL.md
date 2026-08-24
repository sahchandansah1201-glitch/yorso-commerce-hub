---
name: yorso-lovable-browser-acceptance
description: Use after a Yorso UI implementation to test the real workflow like a user across desktop and mobile, including repeated selection, persistence, keyboard, errors and screenshots.
---

# Yorso Lovable Browser Acceptance

## Purpose

Provide independent browser evidence for a completed UI change. Begin with the
current implementation and do not edit code until defects are recorded.

## Acceptance Procedure

1. Confirm repository, branch, HEAD and the exact implementation under test.
2. Use available browser testing, Preview and console/network inspection. If a
   capability is unavailable, state the fallback and its limitation.
3. Start from a deterministic fixture or known account state.
4. Execute the relevant matrix in
   `references/human-flow-matrix.md`. Stateful pickers and multi-selects must
   include at least three consecutive selections, removal, re-addition and
   duplicate handling.
5. Exercise keyboard navigation and focus behavior.
6. Save, reload, reopen Edit and verify persisted prefill.
7. Repeat the critical flow on desktop and 390px mobile. Add tablet when the
   layout changes around that breakpoint.
8. Capture screenshots at decision states, not only the final screen.
9. Record console errors, page errors, failed requests, horizontal overflow,
   nested controls and undersized mobile actions.
10. Report defects before changing code. After a fix, rerun the exact failing
    sequence plus the nearest regression path.

## Pass Rule

Do not pass on unit tests, selector presence or one happy path alone. A pass
requires current browser evidence for the user-visible claim.

## Output

Report in Russian with findings first:

| Сценарий | Ожидание | Факт | Доказательство |
|---|---|---|---|

Then list exact viewport sizes, screenshots, errors and unverified items.
