import { useEffect, useMemo, useState } from "react";
import type { MockSupplier } from "@/data/mockSuppliers";
import { localizeSupplier } from "@/data/mockSuppliersI18n";
import type { Language } from "@/i18n/translations";
import {
  localPreviewSupplierLogisticsFacts,
  localPreviewSupplierProductionFacts,
} from "@/lib/supplier-dossier-facts";
import {
  createSupplierDirectoryApiClient,
  type SupplierDirectoryAccessLevel,
  type SupplierDirectoryQuery,
} from "@/lib/supplier-directory-api";
import {
  localizedMockSuppliers,
  localizeSupplierDirectoryItem,
} from "@/lib/supplier-directory-view";
import {
  getApprovedSupplierAccessIds,
  SUPPLIER_ACCESS_CHANGE_EVENT,
} from "@/lib/supplier-access-requests";

export type SupplierDirectorySource = "api" | "local";
export type SupplierDirectoryStatus = "idle" | "loading" | "ready" | "error";

interface SupplierDirectoryListArgs {
  accessLevel: SupplierDirectoryAccessLevel;
  language: Language;
  query?: string;
  filterQuery?: Pick<Partial<SupplierDirectoryQuery>, "species" | "certification" | "verificationLevel"> | null;
  sortBy?: SupplierDirectoryQuery["sortBy"];
  sortDirection?: SupplierDirectoryQuery["sortDirection"];
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

const supplierAccessLevel = (
  supplier: MockSupplier,
  accessLevel: SupplierDirectoryAccessLevel,
  approvedSupplierIds: ReadonlySet<string>,
): SupplierDirectoryAccessLevel =>
  accessLevel === "qualified_unlocked" || approvedSupplierIds.has(supplier.id)
    ? "qualified_unlocked"
    : accessLevel;

const withSupplierAccessLevel = (
  supplier: MockSupplier,
  language: Language,
  accessLevel: SupplierDirectoryAccessLevel,
  approvedSupplierIds: ReadonlySet<string>,
) => localizeSupplier(
  {
    ...supplier,
    accessLevel: supplierAccessLevel(supplier, accessLevel, approvedSupplierIds),
    productionFacts: supplier.productionFacts ?? localPreviewSupplierProductionFacts(supplier.id),
    logisticsFacts: supplier.logisticsFacts ?? localPreviewSupplierLogisticsFacts(supplier.id),
  },
  language,
);

const fallbackListState = (
  language: Language,
  accessLevel: SupplierDirectoryAccessLevel,
): SupplierDirectoryListState => {
  const approvedSupplierIds = new Set(getApprovedSupplierAccessIds());
  const suppliers = localizedMockSuppliers(language).map((supplier) => ({
    ...supplier,
    accessLevel: supplierAccessLevel(supplier, accessLevel, approvedSupplierIds),
  }));
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
  accessLevel: SupplierDirectoryAccessLevel,
): SupplierDirectoryDetailState => ({
  error: null,
  missing: !fallbackSupplier,
  source: "local",
  status: "ready",
  supplier: fallbackSupplier
    ? withSupplierAccessLevel(
      fallbackSupplier,
      language,
      accessLevel,
      new Set(getApprovedSupplierAccessIds()),
    )
    : undefined,
});

const emptyApiListState = (
  status: SupplierDirectoryStatus = "idle",
  error: Error | null = null,
): SupplierDirectoryListState => ({
  error,
  serverFiltered: true,
  source: "api",
  status,
  suppliers: [],
  total: 0,
});

const emptyApiDetailState = (
  status: SupplierDirectoryStatus = "idle",
  error: Error | null = null,
  missing = false,
): SupplierDirectoryDetailState => ({
  error,
  missing,
  source: "api",
  status,
  supplier: undefined,
});

const isMissingSupplierError = (error: unknown) =>
  error instanceof Error && error.message === "supplier_not_found";

export function useSupplierDirectoryList({
  accessLevel,
  language,
  query = "",
  filterQuery = null,
  sortBy = "updated_at",
  sortDirection = "desc",
  limit = 50,
  offset = 0,
}: SupplierDirectoryListArgs) {
  const client = useMemo(() => createSupplierDirectoryApiClient(), []);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<SupplierDirectoryListState>(() =>
    client.enabled ? emptyApiListState() : fallbackListState(language, accessLevel),
  );
  const requestAccessLevel: SupplierDirectoryAccessLevel =
    client.enabled && accessLevel !== "anonymous_locked"
      ? "qualified_unlocked"
      : accessLevel;

  useEffect(() => {
    if (!client.enabled) {
      setState(fallbackListState(language, accessLevel));
      return;
    }

    let cancelled = false;

    setState((current) => ({
      ...current,
      error: null,
      serverFiltered: true,
      source: "api",
      status: "loading",
      suppliers: current.source === "api" ? current.suppliers : [],
      total: current.source === "api" ? current.total : 0,
    }));

    void client
      .listSuppliers({
        ...(query ? { q: query } : {}),
        ...(filterQuery ?? {}),
        sortBy,
        sortDirection,
        accessLevel: requestAccessLevel,
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
        setState((current) => ({
          error: error instanceof Error ? error : new Error("supplier_directory_api_failed"),
          serverFiltered: true,
          source: "api",
          status: "error",
          suppliers: current.source === "api" ? current.suppliers : [],
          total: current.source === "api" ? current.total : 0,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [client, accessLevel, requestAccessLevel, language, query, filterQuery, sortBy, sortDirection, limit, offset, refreshToken]);

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
    client.enabled
      ? emptyApiDetailState()
      : fallbackDetailState(fallbackSupplier, language, accessLevel),
  );
  const requestAccessLevel: SupplierDirectoryAccessLevel =
    client.enabled && accessLevel !== "anonymous_locked"
      ? "qualified_unlocked"
      : accessLevel;

  useEffect(() => {
    if (!supplierId) {
      setState({
        error: null,
        missing: true,
        source: client.enabled ? "api" : "local",
        status: "ready",
        supplier: undefined,
      });
      return;
    }

    if (!client.enabled) {
      setState(fallbackDetailState(fallbackSupplier, language, accessLevel));
      return;
    }

    let cancelled = false;

    setState((current) => ({
      error: null,
      missing: false,
      source: "api",
      status: "loading",
      supplier: current.source === "api" ? current.supplier : undefined,
    }));

    void client
      .getSupplierById(supplierId, requestAccessLevel)
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
        const missing = isMissingSupplierError(error);
        setState((current) => ({
          error: error instanceof Error ? error : new Error("supplier_directory_detail_api_failed"),
          missing,
          source: "api",
          status: "error",
          supplier: missing ? undefined : current.source === "api" ? current.supplier : undefined,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [client, supplierId, accessLevel, requestAccessLevel, fallbackSupplier, language, refreshToken]);

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
