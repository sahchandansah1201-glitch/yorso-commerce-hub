/**
 * Account API adapter.
 *
 * Production direction: `/account/*` should read/write the self-hosted YORSO
 * API. Current preview still works without that API, so this module is a
 * progressive enhancement over the local account store.
 * Fallback mode is local prototype mode, not a production backend.
 */
import type {
  AccountProfile,
  CompanyBranch,
  CompanyProduct,
  CompanyProfile,
  MetaRegion,
  NotificationPreference,
  UserProfile,
} from "@/data/mockAccount";
import { buyerSession } from "@/lib/buyer-session";

type BackendLanguage = "en" | "ru" | "es";
type BackendAccountRole = "buyer" | "supplier" | "both";
type BackendPublicationStatus = "draft" | "review" | "published" | "blocked";
type BackendQualificationStatus = "not_started" | "pending" | "qualified" | "rejected";

interface BackendUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  preferredLanguage: BackendLanguage;
  timezone: string;
  updatedAt: string;
}

interface BackendCompanyMedia {
  logoObjectKey: string | null;
  coverObjectKey: string | null;
  logoAlt: string | null;
  coverAlt: string | null;
  logoFit: "contain" | "cover";
  coverFocalX: number;
  coverFocalY: number;
}

interface BackendCompanyProfile {
  id: string;
  legalName: string;
  tradeName: string;
  accountRole: BackendAccountRole;
  countryCode: string;
  website: string | null;
  yearFounded: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  messengerHandle: string | null;
  description: string | null;
  productFocus: string[];
  certificates: string[];
  paymentTerms: string[];
  publicationStatus: BackendPublicationStatus;
  buyerQualificationStatus: BackendQualificationStatus;
  media: BackendCompanyMedia;
  updatedAt: string;
}

interface BackendAccountVersionResponse {
  accountVersion?: string;
}

interface BackendUserResponse extends BackendAccountVersionResponse {
  ok: true;
  user: BackendUserProfile;
  requestId: string;
}

interface BackendCompanyResponse extends BackendAccountVersionResponse {
  ok: true;
  company: BackendCompanyProfile;
  requestId: string;
}

interface BackendBranchesResponse extends BackendAccountVersionResponse {
  ok: true;
  branches: CompanyBranch[];
  requestId: string;
}

interface BackendProductsResponse extends BackendAccountVersionResponse {
  ok: true;
  products: CompanyProduct[];
  requestId: string;
}

interface BackendMetaRegionsResponse extends BackendAccountVersionResponse {
  ok: true;
  metaRegions: MetaRegion[];
  requestId: string;
}

interface BackendNotificationsResponse extends BackendAccountVersionResponse {
  ok: true;
  notifications: NotificationPreference[];
  requestId: string;
}

interface BackendBranchResponse extends BackendAccountVersionResponse {
  ok: true;
  branch: CompanyBranch;
  deletedId?: string;
  requestId: string;
}

interface BackendProductResponse extends BackendAccountVersionResponse {
  ok: true;
  product: CompanyProduct;
  deletedId?: string;
  requestId: string;
}

interface BackendMetaRegionResponse extends BackendAccountVersionResponse {
  ok: true;
  metaRegion: MetaRegion;
  deletedId?: string;
  requestId: string;
}

interface BackendNotificationResponse extends BackendAccountVersionResponse {
  ok: true;
  notification: NotificationPreference;
  deletedId?: string;
  requestId: string;
}

export interface AccountFileUploadPayload {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  contentBase64: string;
}

export interface AccountFileAsset {
  id: string;
  companyId: string | null;
  purpose: "company_logo" | "company_cover" | "company_document" | "supplier_certificate" | "supplier_trade_document";
  objectKey: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  storageDriver: "local" | "s3";
  createdAt: string;
}

export interface CompanyDocument {
  id: string;
  companyId: string;
  fileAssetId: string;
  title: string;
  documentType:
    | "business_license"
    | "facility_approval"
    | "haccp"
    | "msc"
    | "asc"
    | "brc"
    | "ifs"
    | "health_certificate"
    | "origin_certificate"
    | "packing_list"
    | "other";
  visibility: "private" | "buyer_qualified" | "public_teaser";
  status: "draft" | "uploaded" | "review" | "approved" | "rejected" | "expired";
  fileName: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendCompanyMediaUploadResponse extends BackendAccountVersionResponse {
  ok: true;
  asset: AccountFileAsset;
  company: BackendCompanyProfile;
  requestId: string;
}

interface BackendCompanyDocumentsResponse extends BackendAccountVersionResponse {
  ok: true;
  documents: CompanyDocument[];
  requestId: string;
}

interface BackendCompanyDocumentCreateResponse extends BackendAccountVersionResponse {
  ok: true;
  document: CompanyDocument;
  requestId: string;
}

export type AccountApiSyncState = "disabled" | "synced" | "failed";

export const ACCOUNT_API_SYNC_STORAGE_KEY = "yorso_account_api_sync_v1";
export const ACCOUNT_USER_ID_HEADER = "x-yorso-user-id";
export const ACCOUNT_SESSION_ID_HEADER = "x-yorso-session-id";
export const ACCOUNT_VERSION_HEADER = "x-yorso-account-version";
export const DEFAULT_SELF_HOSTED_ACCOUNT_USER_ID = "00000000-0000-4000-8000-000000000001";

const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  AR: "Argentina",
  BD: "Bangladesh",
  CL: "Chile",
  CN: "China",
  DE: "Germany",
  EC: "Ecuador",
  ES: "Spain",
  FO: "Faroe Islands",
  FR: "France",
  GB: "United Kingdom",
  IS: "Iceland",
  IT: "Italy",
  LT: "Lithuania",
  MA: "Morocco",
  NG: "Nigeria",
  NO: "Norway",
  PE: "Peru",
  PH: "Philippines",
  PT: "Portugal",
  RU: "Russia",
  TH: "Thailand",
  TR: "Turkey",
  US: "United States",
  VN: "Vietnam",
};

const COUNTRY_NAME_TO_CODE = Object.fromEntries(
  Object.entries(COUNTRY_CODE_TO_NAME).map(([code, name]) => [name.toLowerCase(), code]),
) as Record<string, string>;

const normalizeBaseUrl = (value: string | undefined) => value?.trim().replace(/\/+$/, "") ?? "";

export const getConfiguredAccountApiBaseUrl = () =>
  normalizeBaseUrl(import.meta.env.VITE_YORSO_API_URL as string | undefined);

export const getConfiguredAccountUserId = () =>
  buyerSession.getSession()?.userId ||
  (import.meta.env.VITE_YORSO_ACCOUNT_USER_ID as string | undefined)?.trim() ||
  DEFAULT_SELF_HOSTED_ACCOUNT_USER_ID;

const isDirectAssetUrl = (value: string) => /^(https?:|data:|blob:)/i.test(value.trim());

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

const readFileArrayBuffer = (file: File) => {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("file_read_failed"));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error("file_read_failed"));
    };
    reader.readAsArrayBuffer(file);
  });
};

export const fileToAccountUploadPayload = async (file: File): Promise<AccountFileUploadPayload> => ({
  fileName: file.name || "file",
  contentType: file.type || "application/octet-stream",
  sizeBytes: file.size,
  contentBase64: arrayBufferToBase64(await readFileArrayBuffer(file)),
});

const countryDisplayName = (code: string) => COUNTRY_CODE_TO_NAME[code.toUpperCase()] ?? code.toUpperCase();

const countryCode = (value: string) => {
  const trimmed = value.trim();
  if (/^[a-z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  return COUNTRY_NAME_TO_CODE[trimmed.toLowerCase()] ?? trimmed.slice(0, 2).toUpperCase();
};

const emptyToNull = (value: string | undefined) => {
  const next = value?.trim() ?? "";
  return next ? next : null;
};

const backendPublicationToFrontend = (
  value: BackendPublicationStatus,
): CompanyProfile["supplierPublicationStatus"] => {
  if (value === "published") return "published";
  if (value === "review") return "ready_for_review";
  return "draft";
};

const frontendPublicationToBackend = (
  value: CompanyProfile["supplierPublicationStatus"],
): BackendPublicationStatus => {
  if (value === "published") return "published";
  if (value === "ready_for_review") return "review";
  return "draft";
};

const backendQualificationToFrontend = (
  value: BackendQualificationStatus,
): CompanyProfile["buyerQualificationStatus"] => {
  if (value === "qualified") return "qualified";
  if (value === "pending") return "ready";
  return "incomplete";
};

const frontendQualificationToBackend = (
  value: CompanyProfile["buyerQualificationStatus"],
): BackendQualificationStatus => {
  if (value === "qualified") return "qualified";
  if (value === "ready") return "pending";
  return "not_started";
};

const focalPointFromY = (value: number): CompanyProfile["coverFocalPoint"] => {
  if (value <= 0.34) return "top";
  if (value >= 0.66) return "bottom";
  return "center";
};

const focalYFromPoint = (value: CompanyProfile["coverFocalPoint"]) => {
  if (value === "top") return 0.2;
  if (value === "bottom") return 0.8;
  return 0.5;
};

export const mergeBackendUser = (
  localUser: UserProfile,
  backendUser: BackendUserProfile,
): UserProfile => ({
  ...localUser,
  id: backendUser.id,
  firstName: backendUser.firstName,
  lastName: backendUser.lastName,
  email: backendUser.email,
  phone: backendUser.phone ?? "",
  language: backendUser.preferredLanguage,
  timezone: backendUser.timezone,
});

export const mergeBackendCompany = (
  localCompany: CompanyProfile,
  backendCompany: BackendCompanyProfile,
): CompanyProfile => ({
  ...localCompany,
  id: backendCompany.id,
  legalName: backendCompany.legalName,
  tradeName: backendCompany.tradeName,
  accountRole: backendCompany.accountRole,
  country: countryDisplayName(backendCompany.countryCode),
  website: backendCompany.website ?? "",
  yearFounded: backendCompany.yearFounded ?? 0,
  contactEmail: backendCompany.contactEmail ?? "",
  contactPhone: backendCompany.contactPhone ?? "",
  whatsapp: backendCompany.messengerHandle ?? "",
  description: backendCompany.description ?? "",
  productFocus: backendCompany.productFocus ?? [],
  certificates: backendCompany.certificates ?? [],
  paymentTerms: backendCompany.paymentTerms ?? [],
  supplierPublicationStatus: backendPublicationToFrontend(backendCompany.publicationStatus),
  buyerQualificationStatus: backendQualificationToFrontend(backendCompany.buyerQualificationStatus),
  logoImageUrl: backendCompany.media.logoObjectKey ?? "",
  logoAlt: backendCompany.media.logoAlt ?? "",
  logoFit: backendCompany.media.logoFit,
  coverImageUrl: backendCompany.media.coverObjectKey ?? "",
  coverAlt: backendCompany.media.coverAlt ?? "",
  coverFocalPoint: focalPointFromY(backendCompany.media.coverFocalY),
});

export const mergeBackendAccountProfile = (
  localProfile: AccountProfile,
  backendUser: BackendUserProfile,
  backendCompany: BackendCompanyProfile,
  backendSections?: {
    branches?: CompanyBranch[];
    products?: CompanyProduct[];
    metaRegions?: MetaRegion[];
    notifications?: NotificationPreference[];
  },
): AccountProfile => ({
  ...localProfile,
  user: mergeBackendUser(localProfile.user, backendUser),
  company: mergeBackendCompany(localProfile.company, backendCompany),
  branches: backendSections?.branches ?? localProfile.branches,
  products: backendSections?.products ?? localProfile.products,
  metaRegions: backendSections?.metaRegions ?? localProfile.metaRegions,
  notifications: backendSections?.notifications ?? localProfile.notifications,
});

export const mapFrontendUserUpdate = (user: UserProfile) => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: emptyToNull(user.phone),
  preferredLanguage: user.language,
  timezone: user.timezone,
});

export const mapFrontendCompanyUpdate = (company: CompanyProfile) => ({
  legalName: company.legalName,
  tradeName: company.tradeName,
  accountRole: company.accountRole,
  countryCode: countryCode(company.country),
  website: emptyToNull(company.website),
  yearFounded: company.yearFounded || null,
  contactEmail: emptyToNull(company.contactEmail),
  contactPhone: emptyToNull(company.contactPhone),
  messengerHandle: emptyToNull(company.whatsapp),
  description: emptyToNull(company.description),
  productFocus: company.productFocus,
  certificates: company.certificates,
  paymentTerms: company.paymentTerms,
  publicationStatus: frontendPublicationToBackend(company.supplierPublicationStatus),
  buyerQualificationStatus: frontendQualificationToBackend(company.buyerQualificationStatus),
  media: {
    logoObjectKey: emptyToNull(company.logoImageUrl),
    coverObjectKey: emptyToNull(company.coverImageUrl),
    logoAlt: emptyToNull(company.logoAlt),
    coverAlt: emptyToNull(company.coverAlt),
    logoFit: company.logoFit,
    coverFocalX: 0.5,
    coverFocalY: focalYFromPoint(company.coverFocalPoint),
  },
});

export const mapFrontendBranchesUpdate = (branches: CompanyBranch[]) => branches;
export const mapFrontendProductsUpdate = (products: CompanyProduct[]) => products;
export const mapFrontendMetaRegionsUpdate = (metaRegions: MetaRegion[]) =>
  metaRegions.map((metaRegion) => ({
    ...metaRegion,
    defaultCurrency: metaRegion.defaultCurrency.toUpperCase(),
  }));
export const mapFrontendNotificationsUpdate = (notifications: NotificationPreference[]) => notifications;

type BranchCreate = Omit<CompanyBranch, "id">;
type BranchUpdate = Partial<BranchCreate>;
type ProductCreate = Omit<CompanyProduct, "id">;
type ProductUpdate = Partial<ProductCreate>;
type MetaRegionCreate = Omit<MetaRegion, "id">;
type MetaRegionUpdate = Partial<MetaRegionCreate>;
type NotificationCreate = Omit<NotificationPreference, "id">;
type NotificationUpdate = Partial<NotificationCreate>;
export type AccountProfileSectionSyncTarget =
  | "personal"
  | "company"
  | "branches"
  | "products"
  | "meta-regions"
  | "notifications";

interface AccountApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  userId?: string;
  sessionId?: string;
}

const recordSyncState = (state: AccountApiSyncState, detail?: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ACCOUNT_API_SYNC_STORAGE_KEY,
    JSON.stringify({
      state,
      detail: detail ?? "",
      at: new Date().toISOString(),
    }),
  );
};

const jsonHeaders = (headers?: HeadersInit) => {
  const next = new Headers(headers);
  next.set("content-type", "application/json");
  return next;
};

export class AccountApiConflictError extends Error {
  constructor(message = "account_snapshot_conflict") {
    super(message);
    this.name = "AccountApiConflictError";
    Object.setPrototypeOf(this, AccountApiConflictError.prototype);
  }
}

export const isAccountApiConflictError = (error: unknown): error is AccountApiConflictError =>
  error instanceof AccountApiConflictError ||
  (error instanceof Error && error.name === "AccountApiConflictError");

const readJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as
      | { error?: { code?: string; message?: string } }
      | null;
    const code = body?.error?.code;
    if (response.status === 409 && code === "account_snapshot_conflict") {
      throw new AccountApiConflictError(body?.error?.message ?? code);
    }
    throw new Error(code ? `account_api_${code}` : `account_api_http_${response.status}`);
  }
  return (await response.json()) as T;
};

const omitId = <T extends { id: string }>(item: T): Omit<T, "id"> => {
  const { id, ...payload } = item;
  void id;
  return payload;
};

const isSameWorkspaceItem = <T>(left: T, right: T) =>
  JSON.stringify(left) === JSON.stringify(right);

const syncWorkspaceCollection = async <T extends { id: string }>({
  create,
  next,
  previous,
  remove,
  update,
}: {
  create: (item: T) => Promise<T>;
  next: T[];
  previous: T[];
  remove: (id: string) => Promise<T>;
  update: (item: T) => Promise<T>;
}) => {
  const previousById = new Map(previous.map((item) => [item.id, item]));
  const nextById = new Map(next.map((item) => [item.id, item]));

  for (const item of previous.filter((previousItem) => !nextById.has(previousItem.id))) {
    await remove(item.id);
  }

  const synced: T[] = [];
  for (const item of next) {
    const previousItem = previousById.get(item.id);
    if (!previousItem) {
      synced.push(await create(item));
      continue;
    }
    if (isSameWorkspaceItem(previousItem, item)) {
      synced.push(item);
      continue;
    }
    synced.push(await update(item));
  }
  return synced;
};

export function createAccountApiClient(options: AccountApiClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? getConfiguredAccountApiBaseUrl());
  const fetchImpl = options.fetchImpl ?? fetch;
  const accountUserId = options.userId?.trim() || getConfiguredAccountUserId();
  const sessionId = options.sessionId?.trim() || buyerSession.getSession()?.id || "";
  let accountVersion = "";

  const fileUrlForObjectKey = (objectKey: string): string => {
    if (!baseUrl || !objectKey.trim()) return "";
    if (isDirectAssetUrl(objectKey)) return objectKey;
    const params = new URLSearchParams({ objectKey, accountUserId });
    if (sessionId) params.set("accountSessionId", sessionId);
    return `${baseUrl}/v1/account/files/by-object-key?${params.toString()}`;
  };

  const accountHeaders = (headers?: HeadersInit) => {
    const next = jsonHeaders(headers);
    next.set(ACCOUNT_USER_ID_HEADER, accountUserId);
    if (sessionId) next.set(ACCOUNT_SESSION_ID_HEADER, sessionId);
    if (accountVersion) next.set(ACCOUNT_VERSION_HEADER, accountVersion);
    return next;
  };

  const rememberAccountVersion = (body: BackendAccountVersionResponse) => {
    if (body.accountVersion?.trim()) accountVersion = body.accountVersion.trim();
  };

  const rememberLoadedAccountVersion = (responses: BackendAccountVersionResponse[]) => {
    const versions = responses
      .map((response) => response.accountVersion?.trim() ?? "")
      .filter(Boolean);
    if (!versions.length) return;
    const uniqueVersions = new Set(versions);
    if (uniqueVersions.size > 1) throw new Error("account_snapshot_changed_during_load");
    accountVersion = versions[0];
  };

  const request = async <T extends object>(path: string, init?: RequestInit): Promise<T> => {
    if (!baseUrl) throw new Error("account_api_disabled");
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: accountHeaders(init?.headers),
    });
    const body = await readJson<T>(response);
    rememberAccountVersion(body as BackendAccountVersionResponse);
    return body;
  };

  return {
    enabled: Boolean(baseUrl),
    async load(localProfile: AccountProfile): Promise<AccountProfile> {
      const [
        userResponse,
        companyResponse,
        branchesResponse,
        productsResponse,
        metaRegionsResponse,
        notificationsResponse,
      ] = await Promise.all([
        request<BackendUserResponse>("/v1/account/me"),
        request<BackendCompanyResponse>("/v1/account/company"),
        request<BackendBranchesResponse>("/v1/account/branches"),
        request<BackendProductsResponse>("/v1/account/products"),
        request<BackendMetaRegionsResponse>("/v1/account/meta-regions"),
        request<BackendNotificationsResponse>("/v1/account/notifications"),
      ]);
      rememberLoadedAccountVersion([
        userResponse,
        companyResponse,
        branchesResponse,
        productsResponse,
        metaRegionsResponse,
        notificationsResponse,
      ]);
      return mergeBackendAccountProfile(localProfile, userResponse.user, companyResponse.company, {
        branches: branchesResponse.branches,
        products: productsResponse.products,
        metaRegions: metaRegionsResponse.metaRegions,
        notifications: notificationsResponse.notifications,
      });
    },
    async save(profile: AccountProfile): Promise<AccountProfile> {
      const userResponse = await request<BackendUserResponse>("/v1/account/me", {
        method: "PATCH",
        body: JSON.stringify(mapFrontendUserUpdate(profile.user)),
      });
      const companyResponse = await request<BackendCompanyResponse>("/v1/account/company", {
        method: "PATCH",
        body: JSON.stringify(mapFrontendCompanyUpdate(profile.company)),
      });
      const branchesResponse = await request<BackendBranchesResponse>("/v1/account/branches", {
        method: "PATCH",
        body: JSON.stringify(mapFrontendBranchesUpdate(profile.branches)),
      });
      const productsResponse = await request<BackendProductsResponse>("/v1/account/products", {
        method: "PATCH",
        body: JSON.stringify(mapFrontendProductsUpdate(profile.products)),
      });
      const metaRegionsResponse = await request<BackendMetaRegionsResponse>("/v1/account/meta-regions", {
        method: "PATCH",
        body: JSON.stringify(mapFrontendMetaRegionsUpdate(profile.metaRegions)),
      });
      const notificationsResponse = await request<BackendNotificationsResponse>("/v1/account/notifications", {
        method: "PATCH",
        body: JSON.stringify(mapFrontendNotificationsUpdate(profile.notifications)),
      });
      return mergeBackendAccountProfile(profile, userResponse.user, companyResponse.company, {
        branches: branchesResponse.branches,
        products: productsResponse.products,
        metaRegions: metaRegionsResponse.metaRegions,
        notifications: notificationsResponse.notifications,
      });
    },
    async updateUserProfile(user: UserProfile): Promise<UserProfile> {
      const response = await request<BackendUserResponse>("/v1/account/me", {
        method: "PATCH",
        body: JSON.stringify(mapFrontendUserUpdate(user)),
      });
      return mergeBackendUser(user, response.user);
    },
    async updateCompanyProfile(company: CompanyProfile): Promise<CompanyProfile> {
      const response = await request<BackendCompanyResponse>("/v1/account/company", {
        method: "PATCH",
        body: JSON.stringify(mapFrontendCompanyUpdate(company)),
      });
      return mergeBackendCompany(company, response.company);
    },
    async uploadCompanyMedia(
      slot: "logo" | "cover",
      upload: AccountFileUploadPayload & { alt?: string | null },
      localProfile: AccountProfile,
    ): Promise<{ profile: AccountProfile; asset: AccountFileAsset }> {
      const response = await request<BackendCompanyMediaUploadResponse>(
        `/v1/account/company/media/${slot}`,
        {
          method: "POST",
          body: JSON.stringify(upload),
        },
      );
      return {
        profile: mergeBackendAccountProfile(localProfile, {
          ...localProfile.user,
          preferredLanguage: localProfile.user.language,
          updatedAt: new Date().toISOString(),
        }, response.company),
        asset: response.asset,
      };
    },
    async listCompanyDocuments(): Promise<CompanyDocument[]> {
      const response = await request<BackendCompanyDocumentsResponse>("/v1/account/documents");
      return response.documents;
    },
    async createCompanyDocument(payload: {
      title: CompanyDocument["title"];
      documentType: CompanyDocument["documentType"];
      visibility?: CompanyDocument["visibility"];
      expiresAt?: string | null;
      file: AccountFileUploadPayload;
    }): Promise<CompanyDocument> {
      const response = await request<BackendCompanyDocumentCreateResponse>("/v1/account/documents", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return response.document;
    },
    async createBranch(id: string, payload: BranchCreate): Promise<CompanyBranch> {
      const response = await request<BackendBranchResponse>(`/v1/account/branches/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return response.branch;
    },
    async updateBranch(id: string, payload: BranchUpdate): Promise<CompanyBranch> {
      const response = await request<BackendBranchResponse>(`/v1/account/branches/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return response.branch;
    },
    async deleteBranch(id: string): Promise<CompanyBranch> {
      const response = await request<BackendBranchResponse>(`/v1/account/branches/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return response.branch;
    },
    async createProduct(id: string, payload: ProductCreate): Promise<CompanyProduct> {
      const response = await request<BackendProductResponse>(`/v1/account/products/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return response.product;
    },
    async updateProduct(id: string, payload: ProductUpdate): Promise<CompanyProduct> {
      const response = await request<BackendProductResponse>(`/v1/account/products/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return response.product;
    },
    async deleteProduct(id: string): Promise<CompanyProduct> {
      const response = await request<BackendProductResponse>(`/v1/account/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return response.product;
    },
    async createMetaRegion(id: string, payload: MetaRegionCreate): Promise<MetaRegion> {
      const response = await request<BackendMetaRegionResponse>(`/v1/account/meta-regions/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          defaultCurrency: payload.defaultCurrency.toUpperCase(),
        }),
      });
      return response.metaRegion;
    },
    async updateMetaRegion(id: string, payload: MetaRegionUpdate): Promise<MetaRegion> {
      const response = await request<BackendMetaRegionResponse>(`/v1/account/meta-regions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(
          payload.defaultCurrency
            ? { ...payload, defaultCurrency: payload.defaultCurrency.toUpperCase() }
            : payload,
        ),
      });
      return response.metaRegion;
    },
    async deleteMetaRegion(id: string): Promise<MetaRegion> {
      const response = await request<BackendMetaRegionResponse>(`/v1/account/meta-regions/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return response.metaRegion;
    },
    async createNotification(id: string, payload: NotificationCreate): Promise<NotificationPreference> {
      const response = await request<BackendNotificationResponse>(`/v1/account/notifications/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return response.notification;
    },
    async updateNotification(id: string, payload: NotificationUpdate): Promise<NotificationPreference> {
      const response = await request<BackendNotificationResponse>(`/v1/account/notifications/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return response.notification;
    },
    async deleteNotification(id: string): Promise<NotificationPreference> {
      const response = await request<BackendNotificationResponse>(`/v1/account/notifications/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return response.notification;
    },
    fileUrl(assetId: string): string {
      if (!baseUrl) return "";
      const params = new URLSearchParams({ accountUserId });
      if (sessionId) params.set("accountSessionId", sessionId);
      return `${baseUrl}/v1/account/files/${encodeURIComponent(assetId)}?${params.toString()}`;
    },
    fileUrlForObjectKey(objectKey: string): string {
      return fileUrlForObjectKey(objectKey);
    },
    resolveStoredFileUrl(value: string): string {
      if (!value.trim()) return "";
      if (isDirectAssetUrl(value)) return value;
      return fileUrlForObjectKey(value);
    },
  };
}

export const hydrateAccountProfileFromApi = async (
  localProfile: AccountProfile,
  client = createAccountApiClient(),
): Promise<AccountProfile | null> => {
  if (!client.enabled) {
    recordSyncState("disabled");
    return null;
  }

  try {
    const profile = await client.load(localProfile);
    recordSyncState("synced");
    return profile;
  } catch (error) {
    recordSyncState("failed", error instanceof Error ? error.message : "unknown_error");
    if (isAccountApiConflictError(error)) throw error;
    return null;
  }
};

export const syncAccountProfileToApi = async (
  profile: AccountProfile,
  client = createAccountApiClient(),
): Promise<AccountProfile | null> => {
  if (!client.enabled) {
    recordSyncState("disabled");
    return null;
  }

  try {
    const next = await client.save(profile);
    recordSyncState("synced");
    return next;
  } catch (error) {
    recordSyncState("failed", error instanceof Error ? error.message : "unknown_error");
    if (isAccountApiConflictError(error)) throw error;
    return null;
  }
};

export const syncAccountProfileSectionToApi = async (
  profile: AccountProfile,
  previousProfile: AccountProfile,
  section: AccountProfileSectionSyncTarget,
  client = createAccountApiClient(),
): Promise<AccountProfile | null> => {
  if (!client.enabled) {
    recordSyncState("disabled");
    return null;
  }

  try {
    if (section === "personal") {
      const user = await client.updateUserProfile(profile.user);
      recordSyncState("synced");
      return { ...profile, user };
    }

    if (section === "company") {
      const company = await client.updateCompanyProfile(profile.company);
      recordSyncState("synced");
      return { ...profile, company };
    }

    if (section === "branches") {
      const branches = await syncWorkspaceCollection<CompanyBranch>({
        previous: previousProfile.branches,
        next: profile.branches,
        create: (branch) => client.createBranch(branch.id, omitId(branch) as BranchCreate),
        update: (branch) => client.updateBranch(branch.id, omitId(branch) as BranchUpdate),
        remove: (id) => client.deleteBranch(id),
      });
      recordSyncState("synced");
      return { ...profile, branches };
    }

    if (section === "products") {
      const products = await syncWorkspaceCollection<CompanyProduct>({
        previous: previousProfile.products,
        next: profile.products,
        create: (product) => client.createProduct(product.id, omitId(product) as ProductCreate),
        update: (product) => client.updateProduct(product.id, omitId(product) as ProductUpdate),
        remove: (id) => client.deleteProduct(id),
      });
      recordSyncState("synced");
      return { ...profile, products };
    }

    if (section === "meta-regions") {
      const metaRegions = await syncWorkspaceCollection<MetaRegion>({
        previous: previousProfile.metaRegions,
        next: profile.metaRegions,
        create: (metaRegion) => client.createMetaRegion(metaRegion.id, omitId(metaRegion) as MetaRegionCreate),
        update: (metaRegion) => client.updateMetaRegion(metaRegion.id, omitId(metaRegion) as MetaRegionUpdate),
        remove: (id) => client.deleteMetaRegion(id),
      });
      recordSyncState("synced");
      return { ...profile, metaRegions };
    }

    const notifications = await syncWorkspaceCollection<NotificationPreference>({
      previous: previousProfile.notifications,
      next: profile.notifications,
      create: (notification) =>
        client.createNotification(notification.id, omitId(notification) as NotificationCreate),
      update: (notification) =>
        client.updateNotification(notification.id, omitId(notification) as NotificationUpdate),
      remove: (id) => client.deleteNotification(id),
    });
    recordSyncState("synced");
    return { ...profile, notifications };
  } catch (error) {
    recordSyncState("failed", error instanceof Error ? error.message : "unknown_error");
    if (isAccountApiConflictError(error)) throw error;
    return null;
  }
};
