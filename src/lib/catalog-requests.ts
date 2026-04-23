/**
 * Catalog request state — frontend mock only.
 *
 * Two independent buyer-initiated request flows live here:
 *   1. Access request — a registered buyer asks for full procurement access.
 *      Stored as a structured object (not just a flag) so the review team
 *      can see what was requested. No auto-qualification.
 *   2. Product request — empty-state structured procurement request.
 *      Stored as a list of submitted requests for the current tab.
 *
 * Both use sessionStorage and are intentionally backend-free. When real
 * APIs exist, replace the read/write helpers and the dispatched
 * "yorso:catalog-requests-change" event with API-driven state.
 */
import { useEffect, useState } from "react";

const ACCESS_REQUEST_KEY = "yorso_access_request";
const PRODUCT_REQUESTS_KEY = "yorso_product_requests";
const EVENT = "yorso:catalog-requests-change";

export type AccessRequestScope = "prices" | "suppliers" | "intelligence";

export type AccessRequest = {
  scopes: AccessRequestScope[];
  note?: string;
  submittedAt: string;
};

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

export const readAccessRequest = (): AccessRequest | null => {
  const raw = safeGet(ACCESS_REQUEST_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AccessRequest;
    if (!parsed || !Array.isArray(parsed.scopes)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const isAccessRequestPending = (): boolean => readAccessRequest() !== null;

export const submitAccessRequest = (req: Omit<AccessRequest, "submittedAt">): AccessRequest => {
  const full: AccessRequest = { ...req, submittedAt: new Date().toISOString() };
  safeSet(ACCESS_REQUEST_KEY, JSON.stringify(full));
  return full;
};

export const clearAccessRequest = () => {
  safeSet(ACCESS_REQUEST_KEY, null);
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

export const useAccessRequest = (): AccessRequest | null => {
  const [req, setReq] = useState<AccessRequest | null>(() => readAccessRequest());
  useEffect(() => {
    const onChange = () => setReq(readAccessRequest());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return req;
};

export const useAccessRequestPending = (): boolean => useAccessRequest() !== null;

export const useProductRequests = (): ProductRequest[] => {
  const [list, setList] = useState<ProductRequest[]>(() => readProductRequests());
  useEffect(() => {
    const onChange = () => setList(readProductRequests());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return list;
};
