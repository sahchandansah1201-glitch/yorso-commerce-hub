/**
 * Mock supplier approval pipeline.
 *
 * In production this will be replaced by a real backend webhook /
 * realtime channel that pushes an approval payload to the buyer when
 * the supplier confirms price access. For now we simulate the same
 * payload shape locally so the UI can be developed end-to-end.
 *
 * Payload shape mirrors `QualificationPayload` from `access-level.ts`:
 *   { companyName: string; approvedAt: string }
 *
 * The "supplier profile" is currently sourced from `mockOffers` — we
 * pick the supplier the buyer most plausibly interacted with (first
 * offer in the catalog, or an explicit override).
 */
import { mockOffers } from "@/data/mockOffers";
import { setQualified } from "@/lib/access-level";

export interface SupplierApprovalPayload {
  companyName: string;
  approvedAt: string;
}

const DEFAULT_FALLBACK = "Nordic Seafood AS";

/** Resolve a supplier company name from the mock supplier directory. */
export const resolveSupplierCompanyName = (offerId?: string): string => {
  if (offerId) {
    const match = mockOffers.find((o) => o.id === offerId);
    if (match?.supplierName) return match.supplierName;
  }
  return mockOffers[0]?.supplierName ?? DEFAULT_FALLBACK;
};

/**
 * Apply a supplier approval payload — this is the seam that a real
 * backend handler will call when the approval webhook arrives.
 */
export const applySupplierApproval = (payload: SupplierApprovalPayload) => {
  setQualified(true, payload.companyName);
};

/**
 * Simulate the supplier approving the buyer's access request. Returns
 * a cancel function so callers can abort if the dialog/component
 * unmounts before the simulated approval lands.
 */
export const simulateSupplierApproval = (
  options: { offerId?: string; delayMs?: number } = {},
): (() => void) => {
  const { offerId, delayMs = 2500 } = options;
  const companyName = resolveSupplierCompanyName(offerId);
  const timer = setTimeout(() => {
    applySupplierApproval({
      companyName,
      approvedAt: new Date().toISOString(),
    });
  }, delayMs);
  return () => clearTimeout(timer);
};
