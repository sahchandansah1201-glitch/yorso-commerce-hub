import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockAccountProfile } from "@/data/mockAccount";
import {
  ACCOUNT_API_SYNC_STORAGE_KEY,
  createAccountApiClient,
  hydrateAccountProfileFromApi,
  mapFrontendCompanyUpdate,
  mapFrontendUserUpdate,
  mergeBackendAccountProfile,
  syncAccountProfileToApi,
} from "@/lib/account-api";

const backendUser = {
  id: "00000000-0000-4000-8000-000000000001",
  firstName: "Backend",
  lastName: "Buyer",
  email: "backend.buyer@example.com",
  phone: null,
  preferredLanguage: "ru" as const,
  timezone: "Europe/Moscow",
  updatedAt: "2026-05-13T08:00:00.000Z",
};

const backendCompany = {
  id: "11111111-1111-4111-8111-111111111111",
  legalName: "Backend Seafood LLC",
  tradeName: "Backend Seafood",
  accountRole: "supplier" as const,
  countryCode: "NO",
  website: null,
  yearFounded: null,
  contactEmail: "backend@example.com",
  contactPhone: "+47 11 22 33 44",
  messengerHandle: null,
  description: "Company loaded from the self-hosted account API.",
  productFocus: ["Salmon", "Cod"],
  certificates: ["ASC"],
  paymentTerms: ["LC"],
  publicationStatus: "review" as const,
  buyerQualificationStatus: "pending" as const,
  media: {
    logoObjectKey: "https://cdn.example.com/logo.webp",
    coverObjectKey: "https://cdn.example.com/cover.webp",
    logoAlt: "Backend logo",
    coverAlt: "Backend cover",
    logoFit: "cover" as const,
    coverFocalX: 0.5,
    coverFocalY: 0.8,
  },
  updatedAt: "2026-05-13T08:00:00.000Z",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("account API adapter", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("merges backend account data into the existing frontend profile without losing local sections", () => {
    const merged = mergeBackendAccountProfile(mockAccountProfile, backendUser, backendCompany);

    expect(merged.user).toMatchObject({
      id: backendUser.id,
      firstName: "Backend",
      phone: "",
      language: "ru",
    });
    expect(merged.company).toMatchObject({
      id: backendCompany.id,
      tradeName: "Backend Seafood",
      country: "Norway",
      website: "",
      supplierPublicationStatus: "ready_for_review",
      buyerQualificationStatus: "ready",
      coverFocalPoint: "bottom",
    });
    expect(merged.products).toHaveLength(mockAccountProfile.products.length);
    expect(merged.branches).toHaveLength(mockAccountProfile.branches.length);
  });

  it("maps frontend profile values to backend PATCH DTOs", () => {
    const userUpdate = mapFrontendUserUpdate(mockAccountProfile.user);
    const companyUpdate = mapFrontendCompanyUpdate(mockAccountProfile.company);

    expect(userUpdate).toMatchObject({
      firstName: "Anna",
      preferredLanguage: "en",
      timezone: "Europe/Madrid",
    });
    expect(companyUpdate).toMatchObject({
      legalName: "Atlantic Bridge Seafoods S.L.",
      countryCode: "ES",
      publicationStatus: "review",
      buyerQualificationStatus: "pending",
      media: {
        logoObjectKey: null,
        coverObjectKey: null,
        coverFocalY: 0.5,
      },
    });
  });

  it("loads /v1/account/me and /v1/account/company from the configured self-hosted API", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ ok: true, user: backendUser, requestId: "r1" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, company: backendCompany, requestId: "r2" }));
    const client = createAccountApiClient({ baseUrl: "http://localhost:3000", fetchImpl });

    const profile = await client.load(mockAccountProfile);
    const [, firstRequest] = fetchImpl.mock.calls[0] as [string, RequestInit];

    expect(fetchImpl).toHaveBeenNthCalledWith(1, "http://localhost:3000/v1/account/me", expect.any(Object));
    expect(new Headers(firstRequest.headers).get("content-type")).toBe("application/json");
    expect(fetchImpl).toHaveBeenNthCalledWith(2, "http://localhost:3000/v1/account/company", expect.any(Object));
    expect(profile.company.tradeName).toBe("Backend Seafood");
  });

  it("saves user and company profile updates to the self-hosted API", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ ok: true, user: backendUser, requestId: "r1" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, company: backendCompany, requestId: "r2" }));
    const client = createAccountApiClient({ baseUrl: "http://localhost:3000", fetchImpl });

    await client.save(mockAccountProfile);

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3000/v1/account/me",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("firstName"),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3000/v1/account/company",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("countryCode"),
      }),
    );
  });

  it("keeps local prototype mode when API URL is not configured", async () => {
    const client = createAccountApiClient({ baseUrl: "" });

    const hydrated = await hydrateAccountProfileFromApi(mockAccountProfile, client);
    const synced = await syncAccountProfileToApi(mockAccountProfile, client);

    expect(hydrated).toBeNull();
    expect(synced).toBeNull();
    expect(localStorage.getItem(ACCOUNT_API_SYNC_STORAGE_KEY)).toContain("disabled");
  });

  it("records failed API sync without throwing into the UI flow", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ ok: false }, 500));
    const client = createAccountApiClient({ baseUrl: "http://localhost:3000", fetchImpl });

    const synced = await syncAccountProfileToApi(mockAccountProfile, client);

    expect(synced).toBeNull();
    expect(localStorage.getItem(ACCOUNT_API_SYNC_STORAGE_KEY)).toContain("failed");
  });
});
