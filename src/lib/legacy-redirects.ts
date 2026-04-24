/**
 * Legacy route redirect map.
 *
 * Add an entry here when a route is removed or renamed instead of declaring a
 * one-off <Route ...> in App.tsx. Each entry produces two router rules:
 *   - exact match:    `from`           → Navigate to `to`
 *   - subtree match:  `from`/*         → Navigate to `to`
 *
 * Keep the table small and intentional. If a path needs custom logic
 * (preserve params, conditional target, etc.), build a real route instead.
 */
export type LegacyRedirect = {
  /** Old path that should no longer exist in the app, e.g. "/workspace". */
  from: string;
  /** Active destination, e.g. "/offers". Must be an internal path. */
  to: string;
  /** Why this redirect exists — kept for reviewers and future cleanup. */
  reason: string;
  /** When this redirect was added, ISO date. Used to plan eventual removal. */
  addedAt: string;
};

export const legacyRedirects: LegacyRedirect[] = [
  {
    from: "/workspace",
    to: "/offers",
    reason: "Buyer workspace removed in Phase 1; buyers go straight to the catalog.",
    addedAt: "2026-04-24",
  },
];
