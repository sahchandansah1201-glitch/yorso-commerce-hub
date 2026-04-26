/**
 * Catalog Access Level — Phase 1 Marketplace Core
 *
 * Three explicit UI-visible access states. No backend yet:
 *   anonymous_locked   — no buyer session
 *   registered_locked  — buyer session exists, not yet qualified
 *   qualified_unlocked — buyer session + supplier-approved access
 *
 * Approval payload (mock):
 *   When a supplier approves price access, we persist a small payload
 *   describing WHO approved it. Today this is mocked client-side; when
 *   the real API exists, the same shape will arrive from the backend.
 *
 *   {
 *     companyName: string;   // supplier company name from supplier profile
 *     approvedAt: string;    // ISO timestamp
 *   }
 *
 * Storage:
 *   - sessionStorage key `yorso_buyer_qualification` holds the payload
 *   - URL flag `?qualified=1` (DEV only) writes a stub payload
 *   - Dev override via AccessLevelSwitcher writes a stub payload
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";

export type AccessLevel = "anonymous_locked" | "registered_locked" | "qualified_unlocked";

export interface QualificationPayload {
  companyName: string;
  approvedAt: string;
}

const QUALIFICATION_KEY = "yorso_buyer_qualification";
// Legacy boolean flag — read for backwards compatibility, but never written.
const LEGACY_KEY = "yorso_buyer_qualified";
const EVENT = "yorso:qualified-change";

const readQualification = (): QualificationPayload | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(QUALIFICATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QualificationPayload;
      if (parsed && typeof parsed.companyName === "string") return parsed;
    }
    // Legacy boolean — upgrade to a stub payload so existing tabs keep working.
    if (sessionStorage.getItem(LEGACY_KEY) === "1") {
      return { companyName: "", approvedAt: new Date().toISOString() };
    }
    return null;
  } catch {
    return null;
  }
};

const writeQualification = (payload: QualificationPayload | null) => {
  if (typeof window === "undefined") return;
  try {
    if (payload) {
      sessionStorage.setItem(QUALIFICATION_KEY, JSON.stringify(payload));
    } else {
      sessionStorage.removeItem(QUALIFICATION_KEY);
      sessionStorage.removeItem(LEGACY_KEY);
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
};

/**
 * Imperative setter (non-hook). When `companyName` is omitted, an empty
 * string is stored — the UI should treat that as "approved, supplier name
 * not provided" and fall back to a generic message.
 */
export const setQualified = (
  value: boolean,
  companyName?: string,
) => {
  if (!value) {
    writeQualification(null);
    return;
  }
  writeQualification({
    companyName: companyName ?? "",
    approvedAt: new Date().toISOString(),
  });
};

export const isQualifiedMock = (): boolean => readQualification() !== null;
export const readQualificationPayload = (): QualificationPayload | null =>
  readQualification();

export const useAccessLevel = (): {
  level: AccessLevel;
  isSignedIn: boolean;
  isQualified: boolean;
  qualification: QualificationPayload | null;
  setQualified: (v: boolean, companyName?: string) => void;
} => {
  const { isSignedIn } = useBuyerSession();
  const location = useLocation();
  const [qualification, setQualificationState] = useState<QualificationPayload | null>(
    () => readQualification(),
  );

  // Dev-only URL override. In production builds the `?qualified` flag is
  // ignored so ordinary users cannot self-upgrade their access via URL.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const params = new URLSearchParams(location.search);
    const flag = params.get("qualified");
    if (flag === "1" && !readQualification()) {
      const payload: QualificationPayload = {
        companyName: params.get("supplier") ?? "",
        approvedAt: new Date().toISOString(),
      };
      writeQualification(payload);
      setQualificationState(payload);
    } else if (flag === "0" && readQualification()) {
      writeQualification(null);
      setQualificationState(null);
    }
  }, [location.search]);

  // Subscribe to in-tab changes (dev switcher, other components).
  useEffect(() => {
    const onChange = () => setQualificationState(readQualification());
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const qualified = qualification !== null;
  let level: AccessLevel = "anonymous_locked";
  if (isSignedIn && qualified) level = "qualified_unlocked";
  else if (isSignedIn) level = "registered_locked";

  return {
    level,
    isSignedIn,
    isQualified: qualified,
    qualification,
    setQualified: (v, companyName) => {
      setQualified(v, companyName);
      setQualificationState(readQualification());
    },
  };
};
