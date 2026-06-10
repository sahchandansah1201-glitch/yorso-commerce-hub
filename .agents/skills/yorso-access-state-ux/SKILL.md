---
name: yorso-access-state-ux
description: Visual and copy contract for YORSO's three access states (anonymous_locked, registered_locked, qualified_unlocked) — price/supplier visibility rules, lock affordances, honest mock-data labels, progressive disclosure, and RU/EN microcopy. Trigger when touching /offers, /offers/:id, /suppliers, request/access flows, or any UI that gates content by user state.
---

# YORSO Access-State UX

YORSO has exactly **three** access states. They drive nearly every visibility decision in the procurement workspace. Apply this skill whenever a screen shows price, supplier identity, contact actions, or any gated commercial term.

## 1. The three states

| State | Who | Sees price | Sees supplier name | Primary CTA |
|-------|-----|------------|--------------------|-------------|
| `anonymous_locked` | not signed in | range only (if allowed) | no | **Create buyer account** |
| `registered_locked` | signed in, no access grant | range only | no | **Request price access** |
| `qualified_unlocked` | access granted | exact price | yes, + contact | **Contact supplier** / **Compare** |

Hard rules:
- **Supplier identity follows price access.** No price grant ⇒ no supplier name, no logo recognizable, no contact button.
- Never expose internal labels: no "guest", "demo", "anonymous", "demo access", "trial".
- Mock data is allowed but must be **honestly labeled** as estimate, never imply real-time/verified/approved.

## 2. Visual language per state

### Locked field (price or supplier)
- Show the **shape** of the data (range, country, category) — never a fake exact value.
- Use one compact lock affordance: small `Lock` icon (12px) + muted label. Not a full overlay, not a blur.
- CTA inline, small, action-led: `<Button size="sm" variant="link">`.

```tsx
{access === "qualified_unlocked" ? (
  <span className="text-numeric">{formatPrice(offer.priceExact)}</span>
) : (
  <div className="flex flex-col gap-0.5">
    <span className="text-numeric text-muted-foreground">{formatRange(offer.priceRange)}</span>
    <button className="inline-flex items-center gap-1 text-xs text-primary hover:text-link-hover">
      <Lock className="h-3 w-3" aria-hidden />
      {t.access_cta_requestPrice}
    </button>
  </div>
)}
```

### Locked supplier
- Show: supplier country + trust signal (e.g. "MSC certified producer, Norway").
- Hide: company name, logo wordmark, contact button.
- Caption: `t.access_supplier_revealsWithPrice` ("Supplier details unlock with price access").

### Unlocked
- Full identity: name, logo, country, trust signal, contact action.
- **Still only one** trust signal.

## 3. Progressive disclosure

Within a single screen, disclose in this order as state advances:
1. Public identity (always): product name, latin, image, format, origin country, category.
2. Range pricing + market signals (anonymous + registered).
3. Exact price + supplier identity + contact (qualified).
4. Full commercial terms, document pack, direct messaging (qualified + additional grants).

Never reveal step N+1 before step N.

## 4. Honest mock data

Anywhere mock data is shown, attach a small honesty marker:

```tsx
<span className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
  {t.common_estimate}
</span>
```

Forbidden phrasings (imply real backend that does not exist):
- "Verified live price"
- "Real-time supplier data"
- "Approved by YORSO compliance"
- "Last contacted 2h ago"

Allowed phrasings:
- "Estimate based on category averages"
- "Indicative range, request exact price"
- "Sample news — feed connects after pilot"

## 5. CTA microcopy (RU / EN)

| Context | EN | RU |
|---------|----|----|
| Anonymous price gate | Create buyer account | Создать аккаунт покупателя |
| Registered price gate | Request price access | Запросить доступ к цене |
| Supplier reveal | Supplier reveals with price access | Поставщик откроется после доступа к цене |
| Mock data marker | Estimate | Оценка |
| Qualified primary | Contact supplier | Связаться с поставщиком |
| Compare add | Add to comparison | В сравнение |
| Detail link | View offer details | Открыть карточку оффера |

**Forbidden copy** (do not reintroduce):
- "Register for exact price" / "Зарегистрируйтесь чтобы увидеть цену"
- "Sign up to unlock" / "Зарегистрируйтесь для разблокировки"
- "Demo access" / "Демо-доступ"

## 6. State source

Read state from `BuyerSessionContext`:

```ts
import { useBuyerSession } from "@/contexts/BuyerSessionContext";

const { accessState } = useBuyerSession();
// "anonymous_locked" | "registered_locked" | "qualified_unlocked"
```

Never derive from `localStorage` directly. Never gate on a hardcoded boolean.

## 7. Test contract

When changing access-gated UI, manually verify all three states:

1. Sign out → check anonymous shows range + "Create buyer account".
2. Sign in (no grant) → check registered shows range + "Request price access".
3. Sign in with grant → check exact price + supplier name + contact.

E2E specs in `e2e/offer-detail-access.spec.ts`, `e2e/supplier-locked-i18n.spec.ts` cover the contract — run them after gating changes.

## 8. Pre-commit checklist (access UI)

- [ ] Three states behave correctly; no leak of exact price or supplier name.
- [ ] No internal labels ("guest", "demo") in user-visible copy.
- [ ] Lock icon used only on actually-locked fields, never beside trust copy.
- [ ] Mock data carries honesty marker.
- [ ] CTA copy from the table above (RU + EN both present).
- [ ] State pulled from `BuyerSessionContext`, not localStorage.
