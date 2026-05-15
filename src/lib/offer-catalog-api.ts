import { mockOffers, type SeafoodOffer } from "@/data/mockOffers";
import type { AccessLevel } from "@/lib/access-level";
import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountUserId,
} from "@/lib/account-api";
import { buyerSession } from "@/lib/buyer-session";
import {
  fallbackOfferForSupplierAccess,
  supplierAccessIdForOffer,
} from "@/lib/catalog-fallback";
import { legacyOfferIdToUuid } from "@/lib/legacy-offer-id";
import { getApprovedSupplierAccessIds } from "@/lib/supplier-access-requests";

const REDACTED_SUPPLIER = "Имя поставщика скрыто";

export interface OfferCatalogSupplierInfo {
  id: string | null;
  name: string | null;
  country: string | null;
  countryCode: string | null;
  countryFlag: string | null;
  isVerified: boolean | null;
  inBusinessSince: number | null;
  responseTime: string | null;
  certifications: string[];
  documentsReviewed: string[];
  profileSlug: string | null;
}

export interface OfferCatalogItem {
  id: string;
  productName: string;
  species: string;
  latinName: string;
  category: string;
  origin: string;
  originCode: string;
  originFlag: string;
  format: SeafoodOffer["format"];
  cutType: string;
  packaging: string;
  certifications: string[];
  image: string;
  images: string[];
  gallery: SeafoodOffer["gallery"];
  photoSourceLabel: string;
  sampleAvailable: boolean;
  inspectionAvailable: boolean;
  traceability: string | null;
  freshness: string;
  moqLabel: string;
  moqValue: number | null;
  moqUnit: string | null;
  priceRangeLabel: string;
  priceUnit: string;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  supplier: OfferCatalogSupplierInfo;
  specs: SeafoodOffer["specs"];
  commercial: SeafoodOffer["commercial"];
  deliveryBasisOptions: SeafoodOffer["deliveryBasisOptions"];
  relatedArticles: SeafoodOffer["relatedArticles"];
  volumeBreaks: SeafoodOffer["volumeBreaks"];
  updatedAt: string;
  accessLevel: AccessLevel;
}

export interface OfferCatalogQuery {
  q?: string;
  category?: string;
  species?: string;
  originCode?: string;
  supplierCountryCode?: string;
  format?: SeafoodOffer["format"];
  certification?: string;
  sortBy?: "updated_at" | "category" | "origin" | "moq";
  sortDirection?: "asc" | "desc";
  accessLevel: AccessLevel;
  limit: number;
  offset: number;
}

interface OfferCatalogListResponse {
  ok: true;
  offers: OfferCatalogItem[];
  total: number;
  accessLevel: AccessLevel;
  limit: number;
  offset: number;
  requestId: string;
}

interface OfferCatalogDetailResponse {
  ok: true;
  offer: OfferCatalogItem;
  accessLevel: AccessLevel;
  requestId: string;
}

export interface OfferCatalogClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");
const readBaseUrl = () => {
  const env = import.meta.env as Record<string, string | undefined>;
  return env.VITE_YORSO_API_URL ?? "";
};

const accessLevelOrDefault = (accessLevel?: AccessLevel): AccessLevel => accessLevel ?? "anonymous_locked";

const paramsFromQuery = (query: Partial<OfferCatalogQuery>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params;
};

const offerCatalogHeaders = () => {
  const headers = new Headers();
  headers.set("accept", "application/json");
  const accountUserId = getConfiguredAccountUserId();
  if (accountUserId) headers.set(ACCOUNT_USER_ID_HEADER, accountUserId);
  const sessionId = buyerSession.getSession()?.id;
  if (sessionId) headers.set(ACCOUNT_SESSION_ID_HEADER, sessionId);
  return headers;
};

const mockMatches = (
  offer: SeafoodOffer,
  query: Partial<OfferCatalogQuery>,
  canSearchPrivateSupplier: boolean,
) => {
  if (query.category && !offer.category.toLowerCase().includes(query.category.toLowerCase())) return false;
  if (query.species && !offer.species.toLowerCase().includes(query.species.toLowerCase())) return false;
  if (query.format && offer.format !== query.format) return false;
  if (query.certification && !offer.certifications.some((cert) => cert.toLowerCase().includes(query.certification!.toLowerCase()))) {
    return false;
  }
  if (query.originCode) {
    const originCodeByName: Record<string, string> = {
      Norway: "NO",
      Ecuador: "EC",
      Iceland: "IS",
      Philippines: "PH",
      Russia: "RU",
      Argentina: "AR",
      Peru: "PE",
      Vietnam: "VN",
      Turkey: "TR",
      Morocco: "MA",
      Bangladesh: "BD",
    };
    if (originCodeByName[offer.origin] !== query.originCode.toUpperCase()) return false;
  }
  if (query.supplierCountryCode) {
    const supplierCodeByName: Record<string, string> = {
      Norway: "NO",
      Ecuador: "EC",
      Iceland: "IS",
      Philippines: "PH",
      Russia: "RU",
      Argentina: "AR",
      Peru: "PE",
      Vietnam: "VN",
      Turkey: "TR",
      Morocco: "MA",
      Bangladesh: "BD",
    };
    if (supplierCodeByName[offer.supplier.country] !== query.supplierCountryCode.toUpperCase()) return false;
  }
  if (query.q) {
    const q = query.q.toLowerCase();
    const searchable = [
      offer.productName,
      offer.species,
      offer.latinName,
      offer.category,
      offer.origin,
      offer.cutType,
      offer.packaging,
      offer.commercial.incoterm,
      offer.commercial.shipmentPort ?? "",
      ...offer.certifications,
    ];
    if (query.accessLevel === "qualified_unlocked" || canSearchPrivateSupplier) {
      searchable.push(offer.supplierName, offer.supplier.name, offer.supplier.country);
    }
    if (!searchable.some((value) => value.toLowerCase().includes(q))) return false;
  }
  return true;
};

const compareText = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });
const compareNumber = (a: number | undefined, b: number | undefined) =>
  (a ?? Number.MAX_SAFE_INTEGER) - (b ?? Number.MAX_SAFE_INTEGER);

const sortMockOffers = (offers: SeafoodOffer[], query: Partial<OfferCatalogQuery>) => {
  const sortBy = query.sortBy ?? "updated_at";
  const direction = query.sortDirection ?? "desc";
  const sign = direction === "asc" ? 1 : -1;

  return offers
    .map((offer, index) => ({ offer, index }))
    .sort((aEntry, bEntry) => {
      const a = aEntry.offer;
      const b = bEntry.offer;
      let value = 0;

      if (sortBy === "category") {
        value = compareText(`${a.category}-${a.productName}-${a.id}`, `${b.category}-${b.productName}-${b.id}`);
      } else if (sortBy === "origin") {
        value = compareText(`${a.origin}-${a.productName}-${a.id}`, `${b.origin}-${b.productName}-${b.id}`);
      } else if (sortBy === "moq") {
        value = compareNumber(a.moqValue, b.moqValue) || compareText(a.id, b.id);
      } else {
        // Local mock offers do not carry production update timestamps. Keep
        // fallback deterministic while the self-hosted API owns real ordering.
        return direction === "asc" ? bEntry.index - aEntry.index : aEntry.index - bEntry.index;
      }

      return value * sign;
    })
    .map(({ offer }) => offer);
};

export const mapOfferCatalogItemToSeafoodOffer = (item: OfferCatalogItem): SeafoodOffer => {
  const supplierName = item.supplier.name ?? REDACTED_SUPPLIER;
  return {
    id: item.id,
    productName: item.productName,
    species: item.species,
    latinName: item.latinName,
    origin: item.origin,
    originFlag: item.originFlag,
    supplierName,
    isVerified: item.supplier.isVerified ?? false,
    priceRange: item.priceRangeLabel,
    priceUnit: item.priceUnit,
    moq: item.moqLabel,
    freshness: item.freshness,
    image: item.image,
    images: item.images,
    gallery: item.gallery,
    category: item.category,
    format: item.format,
    cutType: item.cutType,
    packaging: item.packaging,
    certifications: item.certifications,
    photoSourceLabel: item.photoSourceLabel,
    sampleAvailable: item.sampleAvailable,
    inspectionAvailable: item.inspectionAvailable,
    traceability: item.traceability ?? undefined,
    priceMin: item.priceMin ?? undefined,
    priceMax: item.priceMax ?? undefined,
    currency: item.currency ?? undefined,
    priceUnitKey: "offers_priceUnit_perKg",
    moqValue: item.moqValue ?? undefined,
    moqUnitKey: item.moqUnit === "kg" ? "offers_qtyUnit_kg" : undefined,
    supplier: {
      id: item.supplier.id,
      name: supplierName,
      isVerified: item.supplier.isVerified ?? false,
      country: item.supplier.country ?? "",
      countryFlag: item.supplier.countryFlag ?? "",
      inBusinessSince: item.supplier.inBusinessSince ?? 0,
      responseTime: item.supplier.responseTime ?? "",
      certifications: item.supplier.certifications,
      documentsReviewed: item.supplier.documentsReviewed,
      profileSlug: item.supplier.profileSlug ?? "",
    },
    specs: item.specs,
    commercial: item.commercial,
    deliveryBasisOptions: item.deliveryBasisOptions,
    relatedArticles: item.relatedArticles,
    volumeBreaks: item.volumeBreaks,
    accessLevel: item.accessLevel,
  };
};

export function createOfferCatalogApiClient(options: OfferCatalogClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? readBaseUrl());
  const fetchImpl = options.fetchImpl ?? fetch;
  const enabled = Boolean(baseUrl);

  const request = async <T>(path: string): Promise<T> => {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method: "GET",
      headers: offerCatalogHeaders(),
    });
    const body = await response.json() as T & { error?: { code?: string; message?: string } };
    if (!response.ok) throw new Error(body.error?.code ?? `offer_catalog_api_${response.status}`);
    return body;
  };

  return {
    enabled,
    async listOffers(query: Partial<OfferCatalogQuery> = {}) {
      const accessLevel = accessLevelOrDefault(query.accessLevel);
      const limit = query.limit ?? 50;
      const offset = query.offset ?? 0;

      if (!enabled) {
        const approvedSupplierIds = new Set(getApprovedSupplierAccessIds());
        const filtered = sortMockOffers(
          mockOffers.filter((offer) =>
            mockMatches(
              offer,
              { ...query, accessLevel },
              approvedSupplierIds.has(supplierAccessIdForOffer(offer)),
            ),
          ),
          query,
        );
        return {
          offers: filtered
            .slice(offset, offset + limit)
            .map((offer) =>
              fallbackOfferForSupplierAccess(offer, accessLevel, approvedSupplierIds),
            ),
          total: filtered.length,
          accessLevel,
          limit,
          offset,
        };
      }

      const params = paramsFromQuery({ ...query, accessLevel, limit, offset });
      const response = await request<OfferCatalogListResponse>(`/v1/offers?${params.toString()}`);
      return {
        ...response,
        offers: response.offers.map(mapOfferCatalogItemToSeafoodOffer),
      };
    },
    async getOfferById(id: string, accessLevel: AccessLevel = "anonymous_locked") {
      if (!enabled) {
        const offer = mockOffers.find((item) => item.id === id || legacyOfferIdToUuid(item.id) === id);
        return offer
          ? fallbackOfferForSupplierAccess(
              offer,
              accessLevel,
              getApprovedSupplierAccessIds(),
            )
          : null;
      }

      const params = paramsFromQuery({ accessLevel });
      const response = await request<OfferCatalogDetailResponse>(
        `/v1/offers/${encodeURIComponent(id)}?${params.toString()}`,
      );
      return mapOfferCatalogItemToSeafoodOffer(response.offer);
    },
  };
}
