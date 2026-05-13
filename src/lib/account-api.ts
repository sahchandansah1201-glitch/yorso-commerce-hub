/**
 * Account API adapter.
 *
 * Production direction: `/account/*` should read/write the self-hosted YORSO
 * API. Current preview still works without that API, so this module is a
 * progressive enhancement over the local account store.
 * Fallback mode is local prototype mode, not a production backend.
 */
import type { AccountProfile, CompanyProfile, UserProfile } from "@/data/mockAccount";

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

interface BackendUserResponse {
  ok: true;
  user: BackendUserProfile;
  requestId: string;
}

interface BackendCompanyResponse {
  ok: true;
  company: BackendCompanyProfile;
  requestId: string;
}

export type AccountApiSyncState = "disabled" | "synced" | "failed";

export const ACCOUNT_API_SYNC_STORAGE_KEY = "yorso_account_api_sync_v1";

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
): AccountProfile => ({
  ...localProfile,
  user: mergeBackendUser(localProfile.user, backendUser),
  company: mergeBackendCompany(localProfile.company, backendCompany),
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

interface AccountApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
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

const readJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) throw new Error(`account_api_http_${response.status}`);
  return (await response.json()) as T;
};

export function createAccountApiClient(options: AccountApiClientOptions = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? getConfiguredAccountApiBaseUrl());
  const fetchImpl = options.fetchImpl ?? fetch;

  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    if (!baseUrl) throw new Error("account_api_disabled");
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: jsonHeaders(init?.headers),
    });
    return readJson<T>(response);
  };

  return {
    enabled: Boolean(baseUrl),
    async load(localProfile: AccountProfile): Promise<AccountProfile> {
      const [userResponse, companyResponse] = await Promise.all([
        request<BackendUserResponse>("/v1/account/me"),
        request<BackendCompanyResponse>("/v1/account/company"),
      ]);
      return mergeBackendAccountProfile(localProfile, userResponse.user, companyResponse.company);
    },
    async save(profile: AccountProfile): Promise<AccountProfile> {
      const [userResponse, companyResponse] = await Promise.all([
        request<BackendUserResponse>("/v1/account/me", {
          method: "PATCH",
          body: JSON.stringify(mapFrontendUserUpdate(profile.user)),
        }),
        request<BackendCompanyResponse>("/v1/account/company", {
          method: "PATCH",
          body: JSON.stringify(mapFrontendCompanyUpdate(profile.company)),
        }),
      ]);
      return mergeBackendAccountProfile(profile, userResponse.user, companyResponse.company);
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
    return null;
  }
};
