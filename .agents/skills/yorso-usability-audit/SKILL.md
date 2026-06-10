---
name: yorso-usability-audit
description: Run a repeatable usability audit on YORSO screens — Nielsen 10 heuristics adapted to B2B procurement, Baymard B2B specifics, 5-second scan test, density vs whitespace, and severity-classified fix list. Trigger when the user asks for a UX audit, usability review, "проверь юзабилити", or before merging any non-trivial UI change.
---

# YORSO Usability Audit

A repeatable review process that turns a YORSO screen into a severity-ranked fix list. Designed for a B2B seafood procurement workspace, not a marketing site.

## When to run

- User asks for UX/usability audit or "проверь юзабилити".
- Before merging non-trivial UI changes to /offers, /offers/:id, /account/*, /suppliers/*, registration, sign-in.
- After a refactor that touches shared components (Field, FormRow, OfferRow, IntelligencePanel, ListSection).

## Steps

### 1. Capture context
- Take a screenshot of the current screen (desktop AND mobile 390px when layout differs).
- Identify the **primary job** of the screen in one sentence (e.g. "Procurement manager decides to inspect / compare / request access").
- Identify the **access state** in scope (anonymous_locked / registered_locked / qualified_unlocked).

### 2. 5-second scan test
Cover the screenshot, look 5s, then answer:
- What is this screen for?
- What's the next action?
- What's locked vs unlocked?
- Where is price? Where is supplier?

If any answer is unclear → **Critical** finding.

### 3. Nielsen 10 heuristics — B2B adaptation

| # | Heuristic | YORSO lens |
|---|-----------|------------|
| 1 | Visibility of system status | Access state visible? Saving/autosave feedback? Filters applied count? |
| 2 | Match real world | Procurement vocabulary (Incoterms, MOQ, HS code) — not e-commerce ("Add to cart"). |
| 3 | User control | Undo on destructive actions; can exit edit without losing data; back button works. |
| 4 | Consistency | Same Field/FormRow across tabs; same lock pattern; same CTA copy ("Request price access"). |
| 5 | Error prevention | Validate before submit; confirm destructive ops; disable invalid CTAs. |
| 6 | Recognition over recall | Selected filters visible; selected offer highlighted; breadcrumbs present. |
| 7 | Flexibility | Keyboard shortcuts on table; bulk select; save filter presets later. |
| 8 | Aesthetic & minimalist | No duplicate trust badges, no decorative lock icons, no badge soup. |
| 9 | Error recovery | Errors say WHAT and HOW TO FIX, not just "Invalid". |
| 10 | Help & docs | Tooltips on Incoterms, certifications, access states. |

### 4. Baymard B2B specifics
- **Price visibility logic**: range when locked, exact when unlocked, never both.
- **Supplier identity follows price access** — never expose supplier name without price.
- **MOQ + payment terms + Incoterms** are first-class, not footnotes.
- **Compare** lives in a tray, not per-row buttons.
- **Filters above workspace** for fast B2B scanning; sidebar only if filter count > 12.
- **Table rows scannable in 2-3s** — single trust signal, prominent product name, compact metadata strip.

### 5. Density & whitespace
- B2B baseline body: 14px (text-sm). Headings via design tokens only.
- Row height: 64-88px desktop, 96-120px mobile.
- Never: tiny metadata clusters <11px, duplicate badges, lock icons beside trust copy.
- Section dividers: `border-border/60`, not heavy cards.

### 6. Access-state honesty check
- anonymous_locked: no exact price, no supplier name, CTA = "Create buyer account".
- registered_locked: no exact price unless granted, CTA = "Request price access".
- qualified_unlocked: full price + supplier.
- Never show "guest", "demo", "anonymous" labels.
- Mock data labeled as estimate, never implies real backend.

### 7. Accessibility quick-check
Run the `skill/accessibility` critical block: alt, aria-label on icon Buttons, label/input pairing, tap targets ≥44px on mobile, single `<main>`, focus-visible.

### 8. Report findings

Group by severity:

- **Critical** — blocks the primary job, breaks access model, accessibility blocker
- **Warning** — degrades scan/decision speed, inconsistency with established pattern
- **Info** — polish, copy, minor density

For each finding:
```
[Severity] <one-line problem>
File: src/.../Foo.tsx:123
Why it matters: <user impact in 1 sentence>
Fix: <concrete change, referencing yorso-component-patterns when relevant>
```

Start the report with the screen name, primary job, scan-test result, and finding counts.

### 9. Offer to fix
List fixes in severity order. Ask the user which to apply (do not auto-apply more than the obvious critical wins). When fixing, **always** use shared primitives from `yorso-component-patterns` — never inline a new style.

## Anti-patterns to flag instantly

- "Register for exact price" → use "Create buyer account" / "Request price access"
- Lock icon next to "Verified supplier"
- Compare button on every row
- Duplicate trust badges (MSC + ASC + "Verified" + checkmark)
- Sidebar filters with <8 filters
- `text-gray-*` instead of design tokens
- New ad-hoc card styles instead of `AccountSectionCard` / `Field` grid
- Supplier name visible while price is locked
