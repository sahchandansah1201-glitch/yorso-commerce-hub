/**
 * Catalog request state — frontend mock only.
 *
 * Two independent buyer-initiated request flows live here:
 *   1. Access request — a registered buyer asks for full procurement access.
 *      Stored as a boolean pending flag (no auto-qualification).
 *   2. Product request — empty-state structured procurement request.
 *      Stored as a list of submitted requests for the current tab.
 *
 * Both use sessionStorage and are intentionally backend-free. When real
 * APIs exist, replace the read/write helpers and the dispatched
 * "yorso:catalog-requests-change" event with API-driven state.
 */
import { useEffect, useState } from "react";

const ACCESS_PENDING_KEY = "yorso_access_request_pending";
const PRODUCT_REQUESTS_KEY = "yorso_product_requests";
const EVENT = "yorso:catalog-requests-change";

export type ProductRequest = {
  id: string;
  product: string;
  latin?: string;
  format?: string;
  origin?: string;
  supplierCountry?: string;
  volume: string;
  destination?: string;
  timing?: string;
  notes?: string;
  submittedAt: string;
};

const safeGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
};

export const isAccessRequestPending = (): boolean =>
  safeGet(ACCESS_PENDING_KEY) === "1";

export const submitAccessRequest = () => {
  safeSet(ACCESS_PENDING_KEY, "1");
};

export const clearAccessRequest = () => {
  safeSet(ACCESS_PENDING_KEY, null);
};

export const readProductRequests = (): ProductRequest[] => {
  const raw = safeGet(PRODUCT_REQUESTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ProductRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const submitProductRequest = (req: Omit<ProductRequest, "id" | "submittedAt">): ProductRequest => {
  const full: ProductRequest = {
    ...req,
    id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    submittedAt: new Date().toISOString(),
  };
  const next = [full, ...readProductRequests()].slice(0, 20);
  safeSet(PRODUCT_REQUESTS_KEY, JSON.stringify(next));
  return full;
};

export const useAccessRequestPending = (): boolean => {
  const [pending, setPending] = useState<boolean>(() => isAccessRequestPending());
  useEffect(() => {
    const onChange = () => setPending(isAccessRequestPending());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return pending;
};
