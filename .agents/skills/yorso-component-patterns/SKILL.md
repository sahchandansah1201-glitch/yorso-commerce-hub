---
name: yorso-component-patterns
description: Canonical YORSO UI patterns — Field/FormRow for account forms, ListSection for item lists, OfferRow for procurement workspace, IntelligencePanel for offer-aware sidebar, density tokens, and forbidden duplicates. Trigger when creating or refactoring cards, forms, tables, lists, offer rows, or any /account, /offers, /suppliers UI.
---

# YORSO Component Patterns

The shared visual contract. Read this BEFORE writing any new card, form row, list item, or table on YORSO. If a pattern already exists, reuse it — do not invent.

## 1. Account forms — Field grid

For any `/account/*` view-mode section. Source: `src/components/account/fields.tsx`.

```tsx
import { Field, FormRow, fallback, splitList, PendingFeatureRow } from "@/components/account/fields";

<dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
  <Field label={t.account_field_city} value={branch.city} />
  <Field label={t.account_field_incoterms} value={branch.incoterms} />
</dl>
```

Rules:
- Use `<dl>` + `Field` for read view. Never inline `<span class="text-xs uppercase">…</span>`.
- Use `FormRow` for edit view. It injects `id`, `aria-invalid`, `aria-describedby`.
- Empty values render muted italic via `fallback(v, t.account_value_notSpecified)`.
- Subheadings inside a card ONLY when section has >6 fields.
- Edit/Delete actions live in a `border-t border-border/60 pt-3 mt-3` footer.

## 2. Item lists — ListSection

For repeatable item lists in `/account/*` (Branches, Products, Meta-Regions, Notifications). Source: `src/components/account/ListSection.tsx`.

- `ListSectionHeader` — title + count + primary action.
- `ListEmpty` — empty-state card with icon, copy, CTA.
- Item card shell: `rounded-lg border border-border bg-card p-4` + Field-grid body + actions footer.

Notes (free-text under fields) → `mt-3 text-xs italic text-muted-foreground`.

## 3. Procurement workspace — OfferRow

`/offers` is a workspace, not a grid. Each row has 6 zones (left → right):

```
[image+origin] [product+latin+format] [supplier/access] [logistics/MOQ/payment] [price/access] [signals/news/docs]
```

Rules:
- Product name: `.text-card-title`, prominent.
- "View offer details" = compact link near product name, NOT a big button.
- Exact price: only `qualified_unlocked`. Else show range or "Request price access".
- Supplier name: only `qualified_unlocked`. Else show country + "Supplier reveals with price access".
- ONE trust signal per row (e.g. "MSC certified"). Never stack badges.
- NO lock icon beside trust copy. Lock icon ONLY means "this exact field is locked".
- Compare button: lives in selected-row panel + compare tray, NOT per row.
- Row scannable in 2-3s.

## 4. IntelligencePanel (right sidebar on /offers)

Tied to **selected offer**, not category. Inputs: category, origin, supplier country, logistics basis, access state.

Sections, in order: market snapshot → origin news → supplier-country news → price movement → document readiness.

- Mark all data as estimate when mocked: `<span className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Estimate</span>`.
- When no offer selected: render empty state ("Select an offer to see procurement intelligence"), not stale data.

## 5. Density tokens

- Body: `text-sm` (14px). Set via global `body { @apply text-sm }`.
- Headings: design tokens only (`.text-page-title`, `.text-section-title`, `.text-card-title`).
- Micro labels: `text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground`.
- Numeric/price: `.text-numeric` (tabular-nums).
- Dividers: `border-border/60`.
- Card padding: `p-4` (compact), `p-6` (primary sections).
- Row gaps: `gap-x-6 gap-y-4` for field grids.
- Mobile tap targets: ≥44×44px (set `min-h-11 min-w-11` on icon Buttons).

## 6. Color & token discipline

- NEVER use `text-gray-*`, `bg-white`, `text-black`. Use semantic tokens.
- Status: `text-success` / `text-destructive` / `text-muted-foreground`.
- Accent: orange = primary CTA. Navy = headings. Warm bg = page background.
- Hover on links: `hover:text-link-hover`.

## 7. Forbidden duplicates / anti-patterns

| Forbidden | Use instead |
|-----------|-------------|
| Custom card with `border rounded p-4` | `AccountSectionCard` or existing list-item shell |
| Inline label `<span class="text-xs uppercase">` | `<Field>` / `<dt>` from fields.tsx |
| `Badge` for enabled/disabled status in list rows | `Field` with plain text value |
| Multiple trust badges per offer row | Single signal |
| Lock icon beside "verified" / supplier name | Lock icon ONLY on locked fields |
| Sidebar filter panel with <8 filters | Horizontal filter strip |
| "Register for exact price" / "Sign up to see price" | "Create buyer account" / "Request price access" |
| `tsx <span className="text-gray-500">` | `text-muted-foreground` |
| Hand-rolled `<input id="email">` in a list | `useId()` or `id={\`email-${row.id}\`}` |
| New ad-hoc form layout per tab | `FormRow` from fields.tsx |

## 8. Adding a new pattern

If a screen genuinely needs a new shared pattern:
1. Build it locally first.
2. Use it in ≥2 places.
3. Extract to `src/components/account/` or `src/components/offers/`.
4. Update this skill with the new entry + import path.
5. Add an anti-pattern row for the old inline form.

## 9. Pre-commit checklist (UI changes)

- [ ] No `text-gray-*` / hardcoded colors.
- [ ] All forms use `FormRow`; all read-views use `Field`.
- [ ] All lists use `ListSection*` primitives.
- [ ] Single trust signal per offer row.
- [ ] Price/supplier honor access state.
- [ ] Icon-only Buttons have `aria-label`.
- [ ] Mobile tap targets ≥44px.
- [ ] No duplicate ids in mapped lists.
