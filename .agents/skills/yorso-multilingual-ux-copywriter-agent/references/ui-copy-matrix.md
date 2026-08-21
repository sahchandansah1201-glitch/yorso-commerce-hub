# UI Copy Matrix

| Key | Route / component | State | Semantic intent | EN | RU | ES-ES | Variables / ICU rule | Constraints | Semantic equivalence | Locale review |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `key` | `/route` / `Component` | default | What the user must understand or do | Copy | Текст | Texto | `{count, plural, ...}` | max length, a11y, wrapping | pending | pending |

## Terminology decisions

| Concept | Approved EN | Approved RU | Approved ES | Rejected alternatives | Reason |
| --- | --- | --- | --- | --- | --- |

## State completeness

- default
- helper
- validation
- error and recovery
- empty
- loading
- success
- destructive confirmation, when relevant

## Rendered QA

- desktop viewport checked
- mobile viewport checked
- no truncation or incoherent wrapping
- accessible name matches action
- no cross-locale leakage

## Locale review evidence

| Locale | Reviewed by | Reviewed at | Review scope | Glossary version | Result |
| --- | --- | --- | --- | --- | --- |
| EN | — | — | terminology + semantics + rendered UI | — | pending |
| RU | — | — | terminology + semantics + rendered UI | — | pending |
| ES-ES | — | — | terminology + semantics + rendered UI | — | pending |

The author must not fill `reviewed` for their own copy. Preserve `pending` until
an independent reviewer has checked both language and the rendered component.
