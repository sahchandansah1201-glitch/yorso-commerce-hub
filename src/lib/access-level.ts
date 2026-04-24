/**
 * Catalog Access Level — Phase 1 Marketplace Core
 *
 * Three explicit UI-visible access states. No backend yet:
 *   anonymous_locked   — no buyer session
 *   registered_locked  — buyer session exists, not yet qualified
 *   qualified_unlocked — buyer session + mock-qualified flag
 *
 * Mock qualification:
 *   - URL flag `?qualified=1` qualifies the current session for the visit
 *   - Stored in sessionStorage under `yorso_buyer_qualified` (per-tab, mock-only)
 *   - Dev override via AccessLevelSwitcher writes the same key
 *
 * Backend-readiness: when real qualification API exists, replace the body
 * of `useAccessLevel` and `setQualified` with API-driven state. The
 * surface contract (3 string states) does not need to change.
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useBuyerSession } from "@/contexts/BuyerSessionContext";

export type AccessLevel = "anonymous_locked" | "registered_locked" | "qualified_unlocked";

const QUALIFIED_KEY = "yorso_buyer_qualified";

const readQualified = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(QUALIFIED_KEY) === "1";
  } catch {
    return false;
  }
};

const writeQualified = (value: boolean) => {
  if (typeof window === "undefined") return;
  try {
    if (value) sessionStorage.setItem(QUALIFIED_KEY, "1");
    else sessionStorage.removeItem(QUALIFIED_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("yorso:qualified-change"));
};

export const setQualified = (value: boolean) => writeQualified(value);
export const isQualifiedMock = (): boolean => readQualified();

export const useAccessLevel = (): {
  level: AccessLevel;
  isSignedIn: boolean;
  isQualified: boolean;
  setQualified: (v: boolean) => void;
} => {
  const { isSignedIn } = useBuyerSession();
  const location = useLocation();
  const [qualified, setQualifiedState] = useState<boolean>(() => readQualified());

  // Dev-only URL override. In production builds, the `?qualified` flag is
  // ignored so ordinary users cannot self-upgrade their access level via URL.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const params = new URLSearchParams(location.search);
    const flag = params.get("qualified");
    if (flag === "1" && !readQualified()) {
      writeQualified(true);
      setQualifiedState(true);
    } else if (flag === "0" && readQualified()) {
      writeQualified(false);
      setQualifiedState(false);
    }
  }, [location.search]);

  // Subscribe to in-tab changes from the dev switcher.
  useEffect(() => {
    const onChange = () => setQualifiedState(readQualified());
    window.addEventListener("yorso:qualified-change", onChange);
    return () => window.removeEventListener("yorso:qualified-change", onChange);
  }, []);

  let level: AccessLevel = "anonymous_locked";
  if (isSignedIn && qualified) level = "qualified_unlocked";
  else if (isSignedIn) level = "registered_locked";

  return {
    level,
    isSignedIn,
    isQualified: qualified,
    setQualified: (v) => {
      writeQualified(v);
      setQualifiedState(v);
    },
  };
};
