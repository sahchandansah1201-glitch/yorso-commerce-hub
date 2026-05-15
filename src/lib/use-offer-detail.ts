import { useEffect, useMemo, useState } from "react";
import type { SeafoodOffer } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import { findFallbackOfferByIdForSupplierAccess } from "@/lib/catalog-fallback";
import { createOfferCatalogApiClient } from "@/lib/offer-catalog-api";
import {
  SUPPLIER_ACCESS_CHANGE_EVENT,
  getApprovedSupplierAccessIds,
} from "@/lib/supplier-access-requests";

export type OfferDetailSource = "api" | "local";
export type OfferDetailStatus = "idle" | "loading" | "ready" | "error";

interface OfferDetailState {
  error: string | null;
  failedAttempts: number;
  lastErrorCode: string | null;
  offer: SeafoodOffer | null;
  source: OfferDetailSource;
  status: OfferDetailStatus;
  usingFallback: boolean;
}

const grantScopedFallbackLevel = (level: AccessLevel, grantScoped: boolean): AccessLevel =>
  grantScoped && level === "qualified_unlocked" ? "registered_locked" : level;

const extractOfferDetailErrorCode = (error: unknown) => {
  const err = error as { code?: string; message?: string; status?: number };
  if (err?.code) return err.code;
  if (err?.status) return `http_${err.status}`;
  if (err?.message) return err.message;
  return "offer_detail_api_failed";
};

const isNotFoundError = (error: unknown) => {
  const code = extractOfferDetailErrorCode(error).toLowerCase();
  return code.includes("offer_not_found") || code.includes("404");
};

const localState = (
  id: string | undefined,
  level: AccessLevel,
  grantScoped = false,
): OfferDetailState => ({
  error: null,
  failedAttempts: 0,
  lastErrorCode: null,
  offer: id
    ? findFallbackOfferByIdForSupplierAccess(
        id,
        grantScopedFallbackLevel(level, grantScoped),
        getApprovedSupplierAccessIds(),
      )
    : null,
  source: "local",
  status: "ready",
  usingFallback: false,
});

export function useOfferDetail(id: string | undefined, level: AccessLevel) {
  const client = useMemo(() => createOfferCatalogApiClient(), []);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<OfferDetailState>(() => localState(id, level, client.enabled));

  useEffect(() => {
    if (!id) {
      setState(localState(id, level, client.enabled));
      return;
    }

    const fallback = findFallbackOfferByIdForSupplierAccess(
      id,
      grantScopedFallbackLevel(level, client.enabled),
      getApprovedSupplierAccessIds(),
    );
    const requestLevel = client.enabled && level !== "anonymous_locked"
      ? "qualified_unlocked"
      : level;

    if (!client.enabled) {
      setState(localState(id, level));
      return;
    }

    let cancelled = false;
    setState((current) => ({
      ...current,
      error: null,
      offer: current.offer ?? fallback,
      source: "api",
      status: "loading",
      usingFallback: false,
    }));

    void client
      .getOfferById(id, requestLevel)
      .then((offer) => {
        if (cancelled) return;
        setState({
          error: null,
          failedAttempts: 0,
          lastErrorCode: null,
          offer,
          source: "api",
          status: "ready",
          usingFallback: false,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        const code = extractOfferDetailErrorCode(error);

        if (isNotFoundError(error) && !fallback) {
          setState({
            error: null,
            failedAttempts: 0,
            lastErrorCode: code,
            offer: null,
            source: "api",
            status: "ready",
            usingFallback: false,
          });
          return;
        }

        if (fallback) {
          setState((current) => ({
            error: null,
            failedAttempts: current.failedAttempts + 1,
            lastErrorCode: code,
            offer: fallback,
            source: "local",
            status: "error",
            usingFallback: true,
          }));
          return;
        }

        setState((current) => ({
          error: code,
          failedAttempts: current.failedAttempts + 1,
          lastErrorCode: code,
          offer: null,
          source: "api",
          status: "error",
          usingFallback: false,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [client, id, level, refreshToken]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onSupplierAccessChange = () => setRefreshToken((n) => n + 1);
    window.addEventListener(SUPPLIER_ACCESS_CHANGE_EVENT, onSupplierAccessChange);
    return () => {
      window.removeEventListener(SUPPLIER_ACCESS_CHANGE_EVENT, onSupplierAccessChange);
    };
  }, []);

  return {
    ...state,
    apiEnabled: client.enabled,
    loading: state.status === "loading" && !state.offer,
    recovering: state.status === "loading" && state.source === "api",
    retry: () => setRefreshToken((n) => n + 1),
  };
}
