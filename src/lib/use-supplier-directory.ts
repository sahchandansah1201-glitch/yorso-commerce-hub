import { useEffect, useMemo, useState } from "react";
import type { MockSupplier } from "@/data/mockSuppliers";
import { localizeSupplier } from "@/data/mockSuppliersI18n";
import type { Language } from "@/i18n/translations";
import {
  createSupplierDirectoryApiClient,
  type SupplierDirectoryAccessLevel,
  type SupplierDirectoryQuery,
} from "@/lib/supplier-directory-api";
import {
  localizedMockSuppliers,
  localizeSupplierDirectoryItem,
} from "@/lib/supplier-directory-view";
import { SUPPLIER_ACCESS_CHANGE_EVENT } from "@/lib/supplier-access-requests";

export type SupplierDirectorySource = "api" | "local";
export type SupplierDirectoryStatus = "idle" | "loading" | "ready" | "error";

interface SupplierDirectoryListArgs {
  accessLevel: SupplierDirectoryAccessLevel;
  language: Language;
  query?: string;
  filterQuery?: Pick<Partial<SupplierDirectoryQuery>, "species" | "certification" | "verificationLevel"> | null;
  limit?: number;
  offset?: number;
}

interface SupplierDirectoryDetailArgs {
  accessLevel: SupplierDirectoryAccessLevel;
  fallbackSupplier?: MockSupplier;
  language: Language;
  supplierId?: string;
}

interface SupplierDirectoryListState {
  error: Error | null;
  serverFiltered: boolean;
  source: SupplierDirectorySource;
  status: SupplierDirectoryStatus;
  suppliers: MockSupplier[];
  total: number;
}

interface SupplierDirectoryDetailState {
  error: Error | null;
  missing: boolean;
  source: SupplierDirectorySource;
  status: SupplierDirectoryStatus;
  supplier: MockSupplier | undefined;
}

const fallbackListState = (language: Language): SupplierDirectoryListState => {
  const suppliers = localizedMockSuppliers(language);
  return {
    error: null,
    serverFiltered: false,
    source: "local",
    status: "ready",
    suppliers,
    total: suppliers.length,
  };
};

const fallbackDetailState = (
  fallbackSupplier: MockSupplier | undefined,
  language: Language,
): SupplierDirectoryDetailState => ({
  error: null,
  missing: !fallbackSupplier,
  source: "local",
  status: "ready",
  supplier: fallbackSupplier ? localizeSupplier(fallbackSupplier, language) : undefined,
});

const isMissingSupplierError = (error: unknown) =>
  error instanceof Error && error.message === "supplier_not_found";

export function useSupplierDirectoryList({
  accessLevel,
  language,
  query = "",
  filterQuery = null,
  limit = 50,
  offset = 0,
}: SupplierDirectoryListArgs) {
  const client = useMemo(() => createSupplierDirectoryApiClient(), []);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<SupplierDirectoryListState>(() => fallbackListState(language));

  useEffect(() => {
    if (!client.enabled) {
      setState(fallbackListState(language));
      return;
    }

    let cancelled = false;
    const previousSuppliers = state.suppliers.length > 0
      ? state.suppliers
      : localizedMockSuppliers(language);

    setState((current) => ({
      ...current,
      error: null,
      source: "api",
      status: "loading",
      suppliers: current.suppliers.length > 0 ? current.suppliers : previousSuppliers,
    }));

    void client
      .listSuppliers({
        ...(query ? { q: query } : {}),
        ...(filterQuery ?? {}),
        accessLevel,
        limit,
        offset,
      })
      .then((result) => {
        if (cancelled) return;
        setState({
          error: null,
          serverFiltered: true,
          source: "api",
          status: "ready",
          suppliers: result.suppliers.map((item) => localizeSupplierDirectoryItem(item, language)),
          total: result.total,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("supplier_directory_api_failed", error);
        setState({
          ...fallbackListState(language),
          error: error instanceof Error ? error : new Error("supplier_directory_api_failed"),
          status: "error",
        });
      });

    return () => {
      cancelled = true;
    };
    // `state.suppliers` intentionally stays outside deps. It is used only as
    // stale-while-refresh data while the API request is in flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, accessLevel, language, query, filterQuery, limit, offset, refreshToken]);

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
    refresh: () => setRefreshToken((n) => n + 1),
  };
}

export function useSupplierDirectoryDetail({
  accessLevel,
  fallbackSupplier,
  language,
  supplierId,
}: SupplierDirectoryDetailArgs) {
  const client = useMemo(() => createSupplierDirectoryApiClient(), []);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<SupplierDirectoryDetailState>(() =>
    fallbackDetailState(fallbackSupplier, language),
  );

  useEffect(() => {
    if (!supplierId) {
      setState({
        error: null,
        missing: true,
        source: "local",
        status: "ready",
        supplier: undefined,
      });
      return;
    }

    if (!client.enabled) {
      setState(fallbackDetailState(fallbackSupplier, language));
      return;
    }

    let cancelled = false;
    const fallback = fallbackSupplier ? localizeSupplier(fallbackSupplier, language) : undefined;

    setState((current) => ({
      error: null,
      missing: false,
      source: "api",
      status: "loading",
      supplier: current.supplier ?? fallback,
    }));

    void client
      .getSupplierById(supplierId, accessLevel)
      .then((item) => {
        if (cancelled) return;
        setState({
          error: null,
          missing: !item,
          source: "api",
          status: "ready",
          supplier: item ? localizeSupplierDirectoryItem(item, language) : undefined,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("supplier_directory_detail_api_failed", error);
        const missing = isMissingSupplierError(error) && !fallback;
        setState({
          error: error instanceof Error ? error : new Error("supplier_directory_detail_api_failed"),
          missing,
          source: fallback ? "local" : "api",
          status: "error",
          supplier: missing ? undefined : fallback,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [client, supplierId, accessLevel, fallbackSupplier, language, refreshToken]);

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
    refresh: () => setRefreshToken((n) => n + 1),
  };
}
