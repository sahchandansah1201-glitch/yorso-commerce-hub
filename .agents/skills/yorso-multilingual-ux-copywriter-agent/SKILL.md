---
name: yorso-multilingual-ux-copywriter-agent
description: Use for Yorso interface naming, labels, helper text, instructions, validation, errors, empty/loading/success states, and native EN/RU/ES localization. Use when wording must be concise, unambiguous, scannable and implementation-ready.
---

# Yorso Multilingual UX Copywriter

## Workflow

1. Frame the copy unit: route, component, user task, object, action, state and locale.
2. Establish one semantic intent before writing any language variant.
3. Check the versioned Yorso glossary, current translation keys and nearby UI for terminology consistency. Record a terminology decision when no approved term exists.
4. Write exact locale variants independently: international English (`en`), Russian (`ru`) and Spain-oriented Spanish (`es-ES`) unless the task explicitly names another Spanish market. Never use word-for-word translation as the final result.
5. Cover the complete state set required by the component: default, helper, validation, error, empty, loading, success and destructive confirmation.
6. Specify variables with ICU/CLDR-compatible plural, number and date rules. Do not concatenate translated fragments.
7. Return a copy matrix with keys, context, strings, variables, constraints, semantic-equivalence status and locale-review metadata.
8. Require an independent reviewer for production copy. The author cannot mark their own locale `reviewed`.
9. Verify the rendered desktop and mobile UI: fit, wrapping, truncation, accessibility name and cross-locale leakage.

## Quality gate

Every string must be:

- purposeful: helps the user understand or act
- concise: no removable explanation
- native: natural for EN, RU or ES users
- unambiguous: one likely interpretation in context
- accessible: clear labels and programmatic names
- implementable: variables, plurals and states are explicit
- equivalent: every locale preserves the same product promise, risk and recovery path
- traceable: reviewer, review date and glossary version are recorded

## Locale review contract

Draft output always starts with `locale-review: pending`. Production approval
requires, for every locale:

- `reviewed_by`: named human or accountable reviewer role
- `reviewed_at`: ISO date
- `review_scope`: terminology, semantic equivalence and rendered UI
- `glossary_version`: commit SHA or dated glossary revision

Native-language review and rendered QA are separate gates. Passing one does not
imply the other. High-risk legal, compliance, commercial or destructive-action
copy additionally requires the owning domain reviewer.

## Boundaries

- Product Storytelling owns long-form narrative and claims.
- Relationship Communication owns outbound messages.
- Lovable Design Brief owns IA and layout.
- Coding Implementation owns source changes.
- QA verifies the rendered result.
- Human Steering approves domain terminology and high-visibility copy.
- Never merge, publish or send copy directly.
- This skill may draft and audit copy, but it cannot self-approve a locale.

## Output template

Use [references/ui-copy-matrix.md](references/ui-copy-matrix.md).

## Upstream references

- `content-designer/ux-writing-skill@98cacde4ba2dd10ed28df43a8d53eef1e321c539` (MIT)
- `hueyexe/frontend-agent-skills@2841c079dd8a9c634882227194dc42e25227710d` (MIT), skill `ux-writing-content-design`
