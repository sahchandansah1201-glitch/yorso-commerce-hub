import type { Location, NavigateFunction } from "react-router-dom";

export interface CatalogReturnState {
  path: string;
  scrollY: number;
  offerId?: string;
}

const STATE_KEY = "catalogReturn";

export const buildCatalogReturnState = (offerId?: string): { [k: string]: CatalogReturnState } => ({
  [STATE_KEY]: {
    path: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/offers",
    scrollY: typeof window !== "undefined" ? window.scrollY : 0,
    offerId,
  },
});

export const readCatalogReturnState = (location: Location): CatalogReturnState | null => {
  const state = location.state as Record<string, unknown> | null;
  if (!state || typeof state !== "object") return null;
  const ctx = state[STATE_KEY] as CatalogReturnState | undefined;
  if (!ctx || typeof ctx.path !== "string") return null;
  return ctx;
};

export const clearCatalogReturnState = (location: Location, navigate: NavigateFunction) => {
  navigate(location.pathname + location.search, { replace: true, state: null });
};

export const CATALOG_RETURN_STATE_KEY = STATE_KEY;
