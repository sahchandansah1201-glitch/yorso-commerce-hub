import { mockSuppliers } from "@/data/mockSuppliers";
import {
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  getConfiguredAccountUserId,
} from "@/lib/account-api";
import { buyerSession } from "@/lib/buyer-session";
import { getApprovedSupplierAccessIds } from "@/lib/supplier-access-requests";

export type SupplierDirectoryAccessLevel = "anonymous_locked" | "registered_locked" | "qualified_unlocked";

export interface SupplierDirectoryItem {
  id: string;
  maskedName: string;
  companyName: string | null;
  country: string;
  countryCode: string;
  city: string;
  supplierType: (typeof mockSuppliers)[number]["supplierType"];
  inBusinessSinceYear: number;
  productFocus: (typeof mockSuppliers)[number]["productFocus"];
  certifications: string[];
  certificationBadges: Array<{ code: string; label: string; logo: string | null }>;
  activeOffersCount: number | null;
  shortDescription: string;
  about: string | null;
  responseSignal: (typeof mockSuppliers)[number]["responseSignal"];
  documentReadiness: (typeof mockSuppliers)[number]["documentReadiness"];
  verificationLevel: (typeof mockSuppliers)[number]["verificationLevel"];
  heroImage: string;
  logoImage: string | null;
  deliveryCountries: (typeof mockSuppliers)[number]["deliveryCountries"];
  deliveryCountriesTotal: number | null;
  totalProductsCount: number | null;
  productCatalogPreview: (typeof mockSuppliers)[number]["productCatalogPreview"];
  website: string | null;
  whatsapp: string | null;
  updatedAt: string;
  accessLevel: SupplierDirectoryAccessLevel;
}

export interface SupplierDirectoryQuery {
  q?: string;
  species?: string;
  countryCode?: string;
  supplierType?: SupplierDirectoryItem["supplierType"];
  verificationLevel?: SupplierDirectoryItem["verificationLevel"];
  certification?: string;
  sortBy?: "updated_at" | "country" | "verification" | "response";
  sortDirection?: "asc" | "desc";
  accessLevel: SupplierDirectoryAccessLevel;
  limit: number;
  offset: number;
}

interface SupplierDirectoryListResponse {
  ok: true;
  suppliers: SupplierDirectoryItem[];
  total: number;
  accessLevel: SupplierDirectoryAccessLevel;
  limit: number;
  offset: number;
  requestId: string;
}

interface SupplierDirectoryDetailResponse {
  ok: true;
  supplier: SupplierDirectoryItem;
  accessLevel: SupplierDirectoryAccessLevel;
  requestId: string;
}

export interface SupplierDirectoryClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");
const readBaseUrl = () => {
  const env = import.meta.env as Record<string, string | undefined>;
  return env.VITE_YORSO_API_URL ?? "";
};

const supplierDirectoryHeaders = () => {
  const headers = new Headers({ accept: "application/json" });
  const userId = getConfiguredAccountUserId();
  if (userId) headers.set(ACCOUNT_USER_ID_HEADER, userId);
  const sessionId = buyerSession.getSession()?.id;
  if (sessionId) headers.set(ACCOUNT_SESSION_ID_HEADER, sessionId);
  return headers;
};

const accessLevelOrDefault = (accessLevel?: SupplierDirectoryAccessLevel): SupplierDirectoryAccessLevel =>
  accessLevel ?? "anonymous_locked";

const paramsFromQuery = (query: Partial<SupplierDirectoryQuery>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params;
};

const shapeMockSupplier = (
  supplier: (typeof mockSuppliers)[number],
  accessLevel: SupplierDirectoryAccessLevel,
  approvedSupplierIds: ReadonlySet<string> | string[] = [],
): SupplierDirectoryItem => {
  const approved = "has" in approvedSupplierIds
    ? approvedSupplierIds.has(supplier.id)
    : approvedSupplierIds.includes(supplier.id);
  const unlocked = accessLevel === "qualified_unlocked" || approved;
  const effectiveAccess: SupplierDirectoryAccessLevel = unlocked ? "qualified_unlocked" : accessLevel;
  return {
    id: supplier.id,
    maskedName: supplier.maskedName,
    companyName: unlocked ? supplier.companyName : null,
    country: supplier.country,
    countryCode: supplier.countryCode,
    city: supplier.city,
    supplierType: supplier.supplierType,
    inBusinessSinceYear: supplier.inBusinessSinceYear,
    productFocus: supplier.productFocus,
    certifications: supplier.certifications,
    certificationBadges: supplier.certificationBadges.map((badge) => ({
      code: badge.code,
      label: badge.label,
      logo: badge.logo ?? null,
    })),
    activeOffersCount: unlocked ? supplier.activeOffersCount : null,
    shortDescription: supplier.shortDescription,
    about: unlocked ? supplier.about : null,
    responseSignal: supplier.responseSignal,
    documentReadiness: supplier.documentReadiness,
    verificationLevel: supplier.verificationLevel,
    heroImage: supplier.heroImage,
    logoImage: supplier.logoImage ?? null,
    deliveryCountries: supplier.deliveryCountries,
    deliveryCountriesTotal: unlocked ? supplier.deliveryCountriesTotal : null,
    totalProductsCount: unlocked ? supplier.totalProductsCount : null,
    productCatalogPreview: unlocked ? supplier.productCatalogPreview : supplier.productCatalogPreview.slice(0, 3),
    website: unlocked ? supplier.website ?? null : null,
    whatsapp: unlocked ? supplier.whatsapp ?? null : null,
    updatedAt: "2026-05-14T00:00:00.000Z",
    accessLevel: effectiveAccess,
  };
};

const mockMatches = (
  supplier: (typeof mockSuppliers)[number],
  query: Partial<SupplierDirectoryQuery>,
  approvedSupplierIds: ReadonlySet<string> | string[] = [],
) => {
  if (query.countryCode && supplier.countryCode !== query.countryCode.toUpperCase()) return false;
  if (query.supplierType && supplier.supplierType !== query.supplierType) return false;
  if (query.verificationLevel && supplier.verificationLevel !== query.verificationLevel) return false;
  if (query.certification && !supplier.certifications.some((cert) => cert.toLowerCase().includes(query.certification!.toLowerCase()))) {
    return false;
  }
  if (query.species && !supplier.productFocus.some((item) => item.species.toLowerCase().includes(query.species!.toLowerCase()))) {
    return false;
  }
  if (query.q) {
    const q = query.q.toLowerCase();
    const approved = "has" in approvedSupplierIds
      ? approvedSupplierIds.has(supplier.id)
      : approvedSupplierIds.includes(supplier.id);
    const searchable = [
      supplier.maskedName,
      supplier.country,
      supplier.city,
      supplier.supplierType,
      supplier.shortDescription,
      ...supplier.certifications,
      ...supplier.productFocus.flatMap((item) => [item.species, item.forms]),
    ];
    if (query.accessLevel === "qualified_unlocked" || approved) {
      searchable.push(supplier.companyName, supplier.about);
    }
    if (!searchable.some((value) => value.toLowerCase().includes(q))) return false;
  }
  return true;
};

const verificationRank: Record<SupplierDirectoryItem["verificationLevel"], number> = {
  documents_reviewed: 0,
  basic: 1,
  unverified: 2,
};

const responseRank: Record<SupplierDirectoryItem["responseSignal"], number> = {
  fast: 0,
  normal: 1,
  slow: 2,
};

const compareText = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });

const sortMockSuppliers = (
  suppliers: Array<(typeof mockSuppliers)[number]>,
  query: Partial<SupplierDirectoryQuery>,
) => {
  const sortBy = query.sortBy ?? "updated_at";
  const direction = query.sortDirection ?? "desc";
  const sign = direction === "asc" ? 1 : -1;

  return suppliers
    .map((supplier, index) => ({ supplier, index }))
    .sort((aEntry, bEntry) => {
    const a = aEntry.supplier;
    const b = bEntry.supplier;
    let value = 0;
    if (sortBy === "country") {
      value = compareText(`${a.countryCode}-${a.city}-${a.id}`, `${b.countryCode}-${b.city}-${b.id}`);
    } else if (sortBy === "verification") {
      value = verificationRank[a.verificationLevel] - verificationRank[b.verificationLevel] || compareText(a.id, b.id);
    } else if (sortBy === "response") {
      value = responseRank[a.responseSignal] - responseRank[b.responseSignal] || compareText(a.id, b.id);
    } else {
      // Local mock records do not carry real update timestamps. Keep fallback
      // deterministic while the self-hosted API owns the production ordering.
      return direction === "asc" ? bEntry.index - aEntry.index : aEntry.index - bEntry.index;
    }
    return value * sign;
  })
    .map(({ supplier }) => supplier);
};

export function createSupplierDirectoryApiClient(options: SupplierDirectoryClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? readBaseUrl());
  const fetchImpl = options.fetchImpl ?? fetch;
  const enabled = Boolean(baseUrl);

  const request = async <T>(path: string): Promise<T> => {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method: "GET",
      headers: supplierDirectoryHeaders(),
    });
    const body = await response.json() as T & { error?: { code?: string; message?: string } };
    if (!response.ok) throw new Error(body.error?.code ?? `supplier_directory_api_${response.status}`);
    return body;
  };

  return {
    enabled,
    async listSuppliers(query: Partial<SupplierDirectoryQuery> = {}) {
      const accessLevel = accessLevelOrDefault(query.accessLevel);
      const limit = query.limit ?? 20;
      const offset = query.offset ?? 0;

      if (!enabled) {
        const approvedSupplierIds = new Set(getApprovedSupplierAccessIds());
        const filtered = sortMockSuppliers(
          mockSuppliers.filter((supplier) => mockMatches(supplier, query, approvedSupplierIds)),
          query,
        );
        return {
          suppliers: filtered.slice(offset, offset + limit).map((supplier) => (
            shapeMockSupplier(supplier, accessLevel, approvedSupplierIds)
          )),
          total: filtered.length,
          accessLevel,
          limit,
          offset,
        };
      }

      const params = paramsFromQuery({ ...query, accessLevel, limit, offset });
      const response = await request<SupplierDirectoryListResponse>(`/v1/suppliers?${params.toString()}`);
      return response;
    },
    async getSupplierById(id: string, accessLevel: SupplierDirectoryAccessLevel = "anonymous_locked") {
      if (!enabled) {
        const approvedSupplierIds = new Set(getApprovedSupplierAccessIds());
        const supplier = mockSuppliers.find((item) => item.id === id);
        return supplier ? shapeMockSupplier(supplier, accessLevel, approvedSupplierIds) : null;
      }

      const params = paramsFromQuery({ accessLevel });
      const response = await request<SupplierDirectoryDetailResponse>(
        `/v1/suppliers/${encodeURIComponent(id)}?${params.toString()}`,
      );
      return response.supplier;
    },
  };
}
