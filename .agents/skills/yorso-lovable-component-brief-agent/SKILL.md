---
name: yorso-lovable-component-brief-agent
description: Use for Lovable.dev prompts that should create or refactor reusable Yorso components, design-system sections, shared UI primitives, acceptance criteria, and component-level prompts instead of one-off page layouts.
---

# Yorso Lovable Component Brief Agent

## Purpose

Write Lovable prompts that produce reusable Yorso components and sections, not
single-use decorative page blocks. Use this after a UX/UI audit or design-system
decision identifies primitives to reuse.

## External Baselines

- `promptfoo/promptfoo`: prompt, agent and RAG evaluation reference for future
  Lovable prompt regression checks.
- `openai/skills`: local Codex skill packaging and distribution standard.
- Official Lovable docs: Plan mode, Build mode, workspace/project knowledge,
  Lovable skills, design systems, visual edits, testing, GitHub sync,
  integrations, MCP server, and deployment/ownership docs.
- Yorso Project Knowledge source:
  `docs/lovable/project-knowledge-block.md`.
- Yorso Lovable lifecycle skills:
  `yorso-lovable-discovery-plan`, `yorso-lovable-ui-build`,
  `yorso-lovable-browser-acceptance`, `yorso-lovable-visual-critique` and
  `yorso-lovable-sync-verification`.

## Lovable Capability Model

Treat Lovable as a lifecycle tool, not only a one-shot UI generator:

- `Plan mode`: use before code changes for ambiguous, risky or multi-section
  work. Ask for a plan, clarify scope, then approve before Build.
- `Build mode`: use only after task scope, constraints and stop condition are
  explicit. Lovable edits files directly and should provide diff summaries.
- `Workspace/project knowledge`: use for persistent Yorso rules and domain
  context.
- `Lovable skills`: use for reusable task-specific playbooks.
- `Design systems`: use after Yorso shared UI primitives are stable. Current
  docs say a connected design system cannot be detached, so do not attach one
  casually.
- `Visual edits`: use for targeted UI polish, not IA, access policy or product
  logic.
- `Testing`: ask for browser/frontend/backend verification appropriate to the
  change.
- `GitHub sync`: require a sync/diff report before accepting a Lovable batch.
- `MCP/API/integrations`: high-power surfaces; require explicit user approval.

## Prompt Structure

1. Component or section name.
2. Business job and user decision it supports.
3. Current confirmed source: route, component, doc, screenshot, existing class
   pattern.
4. Reuse target: where the component will be used now and later.
5. Content anatomy: required slots, labels, proof fields, CTA area, state area.
6. Variants: tone, density, status, locked/unlocked, empty/error/loading.
7. Responsive behavior: desktop grid and mobile stack.
8. Accessibility: semantic element, heading/label, keyboard path, focus,
   no nested controls.
9. Trust/conversion constraints.
10. Acceptance checks.

## Account Workspace Prompting Rules

Use these extra rules when prompting Lovable for Yorso account/workspace pages:

- Treat the account area as an operational profile editor, not a marketing page.
- Use route-backed tabs. Sidebar items must navigate to real routes or be
  explicitly marked as not implemented; do not leave fake buttons.
- Preserve visible user-entered data. In read mode, values must be clearly
  visible. In edit mode, fields must show the current value inside the input.
- Separate field name and field value visually: small stable label, stronger
  value/control, optional helper/error below.
- Keep actions predictable: section-level `Edit`; edit-mode `Save` and
  `Cancel` in the same location across sections.
- Use local prototype state only unless backend/storage work is explicitly
  approved. Do not add database, auth, Supabase, Lovable Cloud or external
  services by default.
- Build account primitives first, then page routes. Do not create one-off
  field/card styles per tab.
- For products, use searchable selection from the provided product catalog and
  make role (`buying`, `selling`, `both`) obvious at row level.
- Always require 390px mobile verification, no horizontal overflow, no hidden
  entered values, and no nested interactive controls.
- Every Lovable response must include a Russian plan/fact table:
  `План`, `Сделано`, `Осталось`, `Проверка`.

## Yorso Prompt Rules

- Do not ask Lovable to "make it modern".
- Do not let Lovable invent supplier facts, metrics or trust claims.
- Require reuse of existing visual direction and tokens.
- Require component extraction when a pattern appears twice.
- Require buyer-first hierarchy on public marketplace surfaces.
- Require paid visibility and verified trust to be visually distinct.
- Require mobile 390px no-overflow checks.
- Use Plan mode first for ambiguous, high-risk or multi-section work.
- Use Build mode only after plan approval and a specific stop condition.
- Require GitHub sync and diff summary before accepting work.
- Do not add Supabase, Lovable Cloud backend, auth, payments, database changes,
  external services or runtime integrations unless explicitly approved.
- Preserve Yorso self-hosted product direction.

## Component Prompt Template

```text
Create/refactor a reusable Yorso component: [ComponentName].

Business job:
[Concrete buyer/supplier/operator decision]

Confirmed context:
- Route/files:
- Existing UI pattern:
- Data/source constraints:

Component anatomy:
- Header:
- Body:
- Evidence/proof area:
- CTA/action area:
- States:

Variants:
- [variant list]

Responsive behavior:
- Desktop:
- Mobile 390px:

Accessibility:
- Semantic wrapper:
- Heading/label:
- Keyboard/focus:
- Forbidden nested controls:

Do not:
- invent metrics or claims
- create a one-off page-only layout
- change access gating/redaction semantics

Acceptance checks:
- [checklist]
```

## Account Workspace Prompt Template

```text
Target: Lovable.dev
Mode: Plan first. Switch to Build only after I approve the plan.

Use Yorso account workspace rules.

Route/files:
- [routes/files]

Task:
[one scoped account workspace change]

Existing style to preserve:
- Clean light account UI from `/account/personal`.
- Small uppercase field labels, strong visible values, white section cards,
  orange primary actions, muted blue-gray helper text.

Required behavior:
- Read mode shows user-entered values clearly.
- Edit mode pre-fills current values and keeps Save/Cancel predictable.
- Sidebar tabs use real routes.
- Use local prototype state only unless backend scope is explicitly approved.

Do not:
- hide entered values
- create fake navigation buttons
- add backend/auth/database/Supabase/Lovable Cloud
- invent product facts, supplier proof, metrics or certifications
- touch unrelated public marketplace pages

Verification:
- Desktop and 390px mobile screenshots.
- No horizontal overflow.
- No nested interactive controls.
- Inputs show existing/current values in edit mode.
- Lovable reply includes Russian plan/fact table:
  `План | Сделано | Осталось | Проверка`.

Stop condition:
Stop after this scoped change and wait for review.
```

## Output

Report in Russian:

| Пункт | План | Факт | Что дальше |
|---|---|---|---|
| Component | Что должен создать Lovable. | Почему это reusable. | Где применить. |
| Constraints | Что подтверждено кодом/доками. | Что нельзя выдумывать. | Что спросить у человека. |
| Acceptance | Как проверять результат. | Какие проверки включены. | Кто следующий owner. |
