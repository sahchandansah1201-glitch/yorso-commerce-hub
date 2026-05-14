import { useEffect, useMemo, useState } from "react";
import type { SeafoodOffer } from "@/data/mockOffers";
import type { CatalogFilterState } from "@/components/catalog/CatalogFilters";
import type { AccessLevel } from "@/lib/access-level";
import { fallbackOffersForLevel } from "@/lib/catalog-fallback";
import {
  createOfferCatalogApiClient,
  type OfferCatalogQuery,
} from "@/lib/offer-catalog-api";

export type OfferCatalogSource = "api" | "local";
export type OfferCatalogStatus = "idle" | "loading" | "ready" | "error";

interface UseOfferCatalogListArgs {
  filters: CatalogFilterState;
  level: AccessLevel;
  limit?: number;
  offset?: number;
}

interface OfferCatalogListState {
  error: Error | null;
  offers: SeafoodOffer[];
  serverFiltered: boolean;
  source: OfferCatalogSource;
  status: OfferCatalogStatus;
  total: number;
}

const COUNTRY_CODE_BY_NAME: Record<string, string> = {
  Argentina: "AR",
  Bangladesh: "BD",
  Ecuador: "EC",
  Iceland: "IS",
  Morocco: "MA",
  Norway: "NO",
  Peru: "PE",
  Philippines: "PH",
  Russia: "RU",
  Turkey: "TR",
  Vietnam: "VN",
};

const fallbackListState = (level: AccessLevel): OfferCatalogListState => {
  const offers = fallbackOffersForLevel(level);
  return {
    error: null,
    offers,
    serverFiltered: false,
    source: "local",
    status: "ready",
    total: offers.length,
  };
};

export const offerCatalogApiQueryFromFilters = (
  filters: CatalogFilterState,
  level: AccessLevel,
  limit = 50,
  offset = 0,
): Partial<OfferCatalogQuery> => ({
  ...(filters.q ? { q: filters.q } : {}),
  ...(filters.category ? { category: filters.category } : {}),
  ...(filters.origin && COUNTRY_CODE_BY_NAME[filters.origin]
    ? { originCode: COUNTRY_CODE_BY_NAME[filters.origin] }
    : {}),
  ...(filters.supplierCountry && COUNTRY_CODE_BY_NAME[filters.supplierCountry]
    ? { supplierCountryCode: COUNTRY_CODE_BY_NAME[filters.supplierCountry] }
    : {}),
  ...(filters.state ? { format: filters.state as OfferCatalogQuery["format"] } : {}),
  ...(filters.certification ? { certification: filters.certification } : {}),
  accessLevel: level,
  limit,
  offset,
});

const matchesText = (value: string | undefined | null, query: string) =>
  Boolean(value && value.toLowerCase().includes(query));

export const offerMatchesClientFilters = (
  offer: SeafoodOffer,
  filters: CatalogFilterState,
  allowSupplierName: boolean,
  serverFiltered: boolean,
): boolean => {
  if (!serverFiltered && filters.q) {
    const q = filters.q.toLowerCase();
    const fields = [
      offer.productName,
      offer.species,
      offer.latinName,
      offer.origin,
      offer.supplier.country,
    ];
    if (allowSupplierName) fields.push(offer.supplier.name);
    if (!fields.some((field) => matchesText(field, q))) return false;
  }

  if (!serverFiltered) {
    if (filters.category && offer.category !== filters.category) return false;
    if (filters.origin && offer.origin !== filters.origin) return false;
    if (filters.supplierCountry && offer.supplier.country !== filters.supplierCountry) return false;
    if (filters.certification && !(offer.certifications ?? []).includes(filters.certification)) return false;
    if (filters.state && offer.format !== filters.state) return false;
  }

  // These filters are not yet backend query params. Keep them client-side even
  // in API mode, but only use supplier name after qualified access.
  if (filters.supplier && allowSupplierName && offer.supplier.name !== filters.supplier) return false;
  if (filters.basis && !offer.deliveryBasisOptions.some((b) => b.code === filters.basis)) return false;
  if (filters.paymentTerms && !offer.commercial.paymentTerms.includes(filters.paymentTerms)) return false;
  if (filters.cutType && !offer.cutType.toLowerCase().includes(filters.cutType.toLowerCase())) return false;
  if (filters.currency && (offer.currency ?? "USD") !== filters.currency) return false;
  if (filters.latinName && offer.latinName !== filters.latinName) return false;
  return true;
};

export function useOfferCatalogList({
  filters,
  level,
  limit = 50,
  offset = 0,
}: UseOfferCatalogListArgs) {
  const client = useMemo(() => createOfferCatalogApiClient(), []);
  const [refreshToken, setRefreshToken] = useState(0);
  const [state, setState] = useState<OfferCatalogListState>(() => fallbackListState(level));
  const {
    category,
    certification,
    origin,
    q,
    state: productState,
    supplierCountry,
  } = filters;
  const apiQuery = useMemo(
    () => offerCatalogApiQueryFromFilters({
      basis: null,
      category,
      certification,
      currency: null,
      cutType: null,
      latinName: null,
      origin,
      paymentTerms: null,
      q,
      state: productState,
      supplier: null,
      supplierCountry,
    }, level, limit, offset),
    [
      category,
      certification,
      origin,
      q,
      productState,
      supplierCountry,
      level,
      limit,
      offset,
    ],
  );

  useEffect(() => {
    if (!client.enabled) {
      setState(fallbackListState(level));
      return;
    }

    let cancelled = false;
    const fallback = fallbackListState(level);

    setState((current) => ({
      ...current,
      error: null,
      offers: current.offers.length > 0 ? current.offers : fallback.offers,
      serverFiltered: current.serverFiltered,
      source: "api",
      status: "loading",
      total: current.total || fallback.total,
    }));

    void client
      .listOffers(apiQuery)
      .then((result) => {
        if (cancelled) return;
        setState({
          error: null,
          offers: result.offers,
          serverFiltered: true,
          source: "api",
          status: "ready",
          total: result.total,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("offer_catalog_api_failed", error);
        setState({
          ...fallback,
          error: error instanceof Error ? error : new Error("offer_catalog_api_failed"),
          status: "error",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [client, apiQuery, level, refreshToken]);

  return {
    ...state,
    apiEnabled: client.enabled,
    retry: () => setRefreshToken((n) => n + 1),
    usingFallback: state.status === "error",
  };
}
