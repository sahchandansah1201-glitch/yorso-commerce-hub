---
name: yorso-lovable-ui-build
description: Use after a Yorso Lovable plan is approved to implement only the accepted UI scope while preserving contracts, component patterns and provider-free boundaries.
---

# Yorso Lovable UI Build

## Purpose

Implement the approved Yorso UI change with a surgical diff. This is a Build
phase, not a discovery or acceptance phase.

## Build Contract

1. Restate the approved route, files, observable behavior, non-goals and stop
   condition.
2. Confirm branch and HEAD before editing.
3. Reuse existing components, tokens, translations and interaction patterns.
   Extract a shared component only when the same pattern has multiple real
   consumers or the approved plan explicitly requires it.
4. Preserve API, state, storage, access, analytics, SEO, i18n and testid
   contracts unless the approved scope names a deliberate change.
5. Keep operational B2B screens compact and scan-friendly. Make values stronger
   than labels and keep one primary action per context.
6. Do not invent facts, metrics, supplier proof, certifications or assets.
7. Do not install hosted backend dependencies or modify protected runtime
   layers without explicit approval.
8. Add or update focused tests for the changed behavior.
9. Review the diff for unrelated changes, but do not claim visual acceptance.
10. Stop after the implementation diff and hand off to browser acceptance.

## Output

Report in Russian:

| План | Сделано | Не тронуто | Следующая проверка |
|---|---|---|---|

List changed files and behavior. Label all unverified browser behavior as
unverified.
