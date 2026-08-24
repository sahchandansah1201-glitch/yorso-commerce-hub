---
name: yorso-lovable-discovery-plan
description: Use before Lovable edits a Yorso UI surface to inspect the real implementation, reproduce the problem, define scope and produce an approval-ready plan without changing code.
---

# Yorso Lovable Discovery Plan

## Purpose

Turn a user report into an evidence-backed Lovable plan. This skill is a
read-only gate. Do not edit files in this phase.

## Required Steps

1. Report repository, active branch, HEAD and working-tree status. Stop if the
   repository or branch differs from the task boundary.
2. Run a capability preflight. Name the available Plan, Build, browser,
   Preview, screenshot, console/network, visual-edit and Design Guidance tools.
3. Inspect the real route, components, state owner, translations, testids and
   existing tests. Do not infer implementation from screenshots alone.
4. Reproduce the reported issue through the user flow when browser testing is
   available. Record observed behavior and evidence.
5. Define:
   - user and business job;
   - primary decision or action;
   - confirmed problem and root interaction;
   - files and contracts in scope;
   - non-goals and protected behavior;
   - responsive and accessibility requirements;
   - verification matrix and stop condition.
6. Challenge unnecessary fields, duplicate copy, competing actions and
   one-off components. Reuse project patterns where they fit.
7. Produce an approval-ready plan and stop before Build.

## Output

Report in Russian:

| План | Подтверждено кодом | Риск | Проверка |
|---|---|---|---|

Include unresolved assumptions explicitly. Never describe a proposed UI as
already implemented.
