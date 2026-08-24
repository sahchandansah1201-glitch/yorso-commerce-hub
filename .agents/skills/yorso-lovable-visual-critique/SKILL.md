---
name: yorso-lovable-visual-critique
description: Use after browser screenshots exist to review a Yorso UI for hierarchy, scanability, density, action priority, contrast and responsive defects before acceptance.
---

# Yorso Lovable Visual Critique

## Purpose

Perform a screenshot-based critique separate from implementation authorship.
This skill does not accept code merely because tests pass.

## Review Axes

1. Information hierarchy: can the user find the primary entity, status and
   next action without reading every line?
2. Scanability: stable labels, stronger values, aligned fields, useful grouping
   and restrained helper copy.
3. Density: no decorative cards, duplicated sections or oversized controls on
   operational screens.
4. Action priority: one clear primary action; secondary and destructive actions
   compact but discoverable.
5. Contrast and state: readable active, selected, disabled, error and focus
   states; no dark-on-dark or low-contrast text.
6. Responsive behavior: desktop, tablet when relevant and 390px mobile without
   truncation, overlap, clipped menus or layout shifts.
7. Content quality: native EN/RU/ES labels, no raw enums, ambiguous headings or
   unexplained technical language.
8. Trust: no fabricated proof, metrics, logos or unsupported claims.

## Procedure

- Inspect the actual screenshots and route, not a verbal summary.
- Compare read and edit modes and all open overlays changed in the batch.
- Findings come first, ordered by severity, with screenshot and component
  references.
- Distinguish confirmed defects from preferences.
- If no defect is found, state the remaining visual coverage gap.

## Output

| Severity | Finding | User impact | Required correction | Evidence |
|---|---|---|---|---|

End with `PASS`, `PASS WITH RISKS` or `FAIL`; do not use visual polish language
as a substitute for evidence.
