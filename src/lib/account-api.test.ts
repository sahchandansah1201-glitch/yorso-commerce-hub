import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockAccountProfile } from "@/data/mockAccount";
import {
  ACCOUNT_API_SYNC_STORAGE_KEY,
  ACCOUNT_SESSION_ID_HEADER,
  ACCOUNT_USER_ID_HEADER,
  ACCOUNT_VERSION_HEADER,
  AccountApiConflictError,
  DEFAULT_SELF_HOSTED_ACCOUNT_USER_ID,
  createAccountApiClient,
  fileToAccountUploadPayload,
  hydrateAccountProfileFromApi,
  mapFrontendBranchesUpdate,
  mapFrontendCompanyUpdate,
  mapFrontendMetaRegionsUpdate,
  mapFrontendNotificationsUpdate,
  mapFrontendProductsUpdate,
  mapFrontendUserUpdate,
  mergeBackendAccountProfile,
  syncAccountProfileSectionToApi,
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

const backendBranches = [
  {
    ...mockAccountProfile.branches[0],
    name: "Backend Branch",
  },
];
const backendProducts = [
  {
    ...mockAccountProfile.products[0],
    commercialName: "Backend Cod",
  },
];
const backendMetaRegions = [
  {
    ...mockAccountProfile.metaRegions[0],
    name: "Backend Region",
  },
];
const backendNotifications = [
  {
    ...mockAccountProfile.notifications[0],
    frequency: "weekly" as const,
  },
];

const backendAsset = {
  id: "22222222-2222-4222-8222-222222222222",
  companyId: backendCompany.id,
  purpose: "company_logo" as const,
  objectKey: "companies/111/company_logo/logo.svg",
  originalFileName: "logo.svg",
  contentType: "image/svg+xml",
  sizeBytes: 10,
  checksumSha256: "a".repeat(64),
  storageDriver: "local" as const,
  createdAt: "2026-05-13T08:00:00.000Z",
};

const backendDocument = {
  id: "33333333-3333-4333-8333-333333333333",
  companyId: backendCompany.id,
  fileAssetId: backendAsset.id,
  title: "HACCP certificate",
  documentType: "haccp" as const,
  visibility: "buyer_qualified" as const,
  status: "uploaded" as const,
  fileName: "haccp.pdf",
  contentType: "application/pdf",
  sizeBytes: 10,
  checksumSha256: "b".repeat(64),
  expiresAt: null,
  createdAt: "2026-05-13T08:00:00.000Z",
  updatedAt: "2026-05-13T08:00:00.000Z",
};

const mockLoadResponses = () =>
  vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(jsonResponse({ ok: true, user: backendUser, requestId: "r1" }))
    .mockResolvedValueOnce(jsonResponse({ ok: true, company: backendCompany, requestId: "r2" }))
    .mockResolvedValueOnce(jsonResponse({ ok: true, branches: backendBranches, requestId: "r3" }))
    .mockResolvedValueOnce(jsonResponse({ ok: true, products: backendProducts, requestId: "r4" }))
    .mockResolvedValueOnce(jsonResponse({ ok: true, metaRegions: backendMetaRegions, requestId: "r5" }))
    .mockResolvedValueOnce(jsonResponse({ ok: true, notifications: backendNotifications, requestId: "r6" }));

describe("account API adapter", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const createAuthenticatedAccountClient = (fetchImpl: typeof fetch) =>
    createAccountApiClient({
      baseUrl: "http://localhost:3000",
      fetchImpl,
      sessionId: "session-account-test",
      userId: DEFAULT_SELF_HOSTED_ACCOUNT_USER_ID,
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
    const branchUpdate = mapFrontendBranchesUpdate(mockAccountProfile.branches);
    const productUpdate = mapFrontendProductsUpdate(mockAccountProfile.products);
    const metaRegionUpdate = mapFrontendMetaRegionsUpdate([
      { ...mockAccountProfile.metaRegions[0], defaultCurrency: "eur" },
    ]);
    const notificationUpdate = mapFrontendNotificationsUpdate(mockAccountProfile.notifications);

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
    expect(branchUpdate[0].defaultIncoterms).toBe("EXW");
    expect(productUpdate[0].commercialName).toBe("Atlantic Cod H&G");
    expect(metaRegionUpdate[0].defaultCurrency).toBe("EUR");
    expect(notificationUpdate[0].events).toContain("price_access_approved");
  });

  it("loads all account workspace sections from the configured self-hosted API", async () => {
    const fetchImpl = mockLoadResponses();
    const client = createAuthenticatedAccountClient(fetchImpl);

    const profile = await client.load(mockAccountProfile);
    const [, firstRequest] = fetchImpl.mock.calls[0] as [string, RequestInit];

    expect(fetchImpl).toHaveBeenNthCalledWith(1, "http://localhost:3000/v1/account/me", expect.any(Object));
    expect(new Headers(firstRequest.headers).get("content-type")).toBe("application/json");
    expect(new Headers(firstRequest.headers).get(ACCOUNT_USER_ID_HEADER)).toBe(DEFAULT_SELF_HOSTED_ACCOUNT_USER_ID);
    expect(fetchImpl).toHaveBeenNthCalledWith(2, "http://localhost:3000/v1/account/company", expect.any(Object));
    expect(fetchImpl).toHaveBeenNthCalledWith(3, "http://localhost:3000/v1/account/branches", expect.any(Object));
    expect(fetchImpl).toHaveBeenNthCalledWith(4, "http://localhost:3000/v1/account/products", expect.any(Object));
    expect(fetchImpl).toHaveBeenNthCalledWith(5, "http://localhost:3000/v1/account/meta-regions", expect.any(Object));
    expect(fetchImpl).toHaveBeenNthCalledWith(6, "http://localhost:3000/v1/account/notifications", expect.any(Object));
    expect(profile.company.tradeName).toBe("Backend Seafood");
    expect(profile.branches[0].name).toBe("Backend Branch");
    expect(profile.products[0].commercialName).toBe("Backend Cod");
    expect(profile.metaRegions[0].name).toBe("Backend Region");
    expect(profile.notifications[0].frequency).toBe("weekly");
  });

  it("does not use the deterministic demo account id for an enabled self-hosted account client without a session user", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const client = createAccountApiClient({ baseUrl: "http://localhost:3000", fetchImpl });

    await expect(client.load(mockAccountProfile)).rejects.toThrow("account_api_session_required");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends the latest account version precondition after loading account data", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ ok: true, user: backendUser, accountVersion: "account-v1", requestId: "r1" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, company: backendCompany, accountVersion: "account-v1", requestId: "r2" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, branches: backendBranches, accountVersion: "account-v1", requestId: "r3" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, products: backendProducts, accountVersion: "account-v1", requestId: "r4" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, metaRegions: backendMetaRegions, accountVersion: "account-v1", requestId: "r5" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, notifications: backendNotifications, accountVersion: "account-v1", requestId: "r6" }))
      .mockResolvedValueOnce(jsonResponse({
        ok: true,
        user: { ...backendUser, firstName: "Versioned" },
        accountVersion: "account-v2",
        requestId: "r7",
      }))
      .mockResolvedValueOnce(jsonResponse({
        ok: true,
        company: { ...backendCompany, tradeName: "Versioned Company" },
        accountVersion: "account-v3",
        requestId: "r8",
      }));
    const client = createAuthenticatedAccountClient(fetchImpl);
    await client.load(mockAccountProfile);

    await syncAccountProfileSectionToApi(
      {
        ...mockAccountProfile,
        user: { ...mockAccountProfile.user, firstName: "Versioned" },
      },
      mockAccountProfile,
      "personal",
      client,
    );
    await syncAccountProfileSectionToApi(
      {
        ...mockAccountProfile,
        company: { ...mockAccountProfile.company, tradeName: "Versioned Company" },
      },
      mockAccountProfile,
      "company",
      client,
    );

    const [, userPatch] = fetchImpl.mock.calls[6] as [string, RequestInit];
    const [, companyPatch] = fetchImpl.mock.calls[7] as [string, RequestInit];
    expect(new Headers(userPatch.headers).get(ACCOUNT_VERSION_HEADER)).toBe("account-v1");
    expect(new Headers(companyPatch.headers).get(ACCOUNT_VERSION_HEADER)).toBe("account-v2");
  });

  it("rethrows stale account snapshot conflicts for account section saves", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({
        ok: false,
        error: {
          code: "account_snapshot_conflict",
          message: "Account data changed since it was loaded.",
        },
      }, 409),
    );
    const client = createAuthenticatedAccountClient(fetchImpl);

    await expect(
      syncAccountProfileSectionToApi(
        {
          ...mockAccountProfile,
          user: { ...mockAccountProfile.user, firstName: "Stale" },
        },
        mockAccountProfile,
        "personal",
        client,
      ),
    ).rejects.toBeInstanceOf(AccountApiConflictError);
    expect(JSON.parse(localStorage.getItem(ACCOUNT_API_SYNC_STORAGE_KEY) ?? "{}")).toMatchObject({
      state: "failed",
      detail: "Account data changed since it was loaded.",
    });
  });

  it("saves all account workspace sections to the self-hosted API", async () => {
    const fetchImpl = mockLoadResponses();
    const client = createAuthenticatedAccountClient(fetchImpl);

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
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      "http://localhost:3000/v1/account/branches",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("defaultIncoterms"),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      4,
      "http://localhost:3000/v1/account/products",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("commercialName"),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      5,
      "http://localhost:3000/v1/account/meta-regions",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("defaultCurrency"),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      6,
      "http://localhost:3000/v1/account/notifications",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("price_access_approved"),
      }),
    );
  });

  it("syncs the personal section through only /v1/account/me", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({
        ok: true,
        requestId: "r-user-section",
        user: { ...backendUser, firstName: "Alicia" },
      }));
    const client = createAuthenticatedAccountClient(fetchImpl);
    const nextProfile = {
      ...mockAccountProfile,
      user: { ...mockAccountProfile.user, firstName: "Alicia" },
    };

    const synced = await syncAccountProfileSectionToApi(
      nextProfile,
      mockAccountProfile,
      "personal",
      client,
    );

    expect(synced?.user.firstName).toBe("Alicia");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/v1/account/me",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("\"firstName\":\"Alicia\""),
      }),
    );
  });

  it("syncs the company section through only /v1/account/company", async () => {
    const nextCompany = {
      ...mockAccountProfile.company,
      tradeName: "Scoped Company Update",
    };
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({
        ok: true,
        requestId: "r-company-section",
        company: { ...backendCompany, tradeName: nextCompany.tradeName },
      }));
    const client = createAuthenticatedAccountClient(fetchImpl);
    const nextProfile = {
      ...mockAccountProfile,
      company: nextCompany,
    };

    const synced = await syncAccountProfileSectionToApi(
      nextProfile,
      mockAccountProfile,
      "company",
      client,
    );

    expect(synced?.company.tradeName).toBe("Scoped Company Update");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/v1/account/company",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("\"tradeName\":\"Scoped Company Update\""),
      }),
    );
  });

  it("syncs branch changes through row-level create/update/delete endpoints", async () => {
    const existingBranch = mockAccountProfile.branches[0];
    const deletedBranch = mockAccountProfile.branches[1];
    const newBranch = {
      ...existingBranch,
      id: "br_new",
      name: "New loading point",
      city: "Bergen",
    };
    const changedBranch = {
      ...existingBranch,
      city: "Alesund",
      notes: "Section-scoped update.",
    };
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ ok: true, branch: deletedBranch, deletedId: deletedBranch.id, requestId: "r-delete" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, branch: changedBranch, requestId: "r-update" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, branch: newBranch, requestId: "r-create" }));
    const client = createAuthenticatedAccountClient(fetchImpl);
    const previousProfile = {
      ...mockAccountProfile,
      branches: [existingBranch, deletedBranch],
    };
    const nextProfile = {
      ...mockAccountProfile,
      branches: [changedBranch, newBranch],
    };

    const synced = await syncAccountProfileSectionToApi(
      nextProfile,
      previousProfile,
      "branches",
      client,
    );

    expect(synced?.branches).toEqual([changedBranch, newBranch]);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `http://localhost:3000/v1/account/branches/${deletedBranch.id}`,
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `http://localhost:3000/v1/account/branches/${existingBranch.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("\"city\":\"Alesund\""),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      "http://localhost:3000/v1/account/branches/br_new",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("\"name\":\"New loading point\""),
      }),
    );
    expect(fetchImpl.mock.calls.map(([input]) => String(input))).not.toContain(
      "http://localhost:3000/v1/account/branches",
    );
  });

  it("syncs product, meta-region and notification edits through row-level endpoints", async () => {
    const changedProduct = {
      ...mockAccountProfile.products[0],
      monthlyVolume: "48 t / month",
    };
    const changedRegion = {
      ...mockAccountProfile.metaRegions[0],
      defaultCurrency: "USD",
    };
    const changedNotification = {
      ...mockAccountProfile.notifications[0],
      frequency: "daily" as const,
    };

    const productFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ ok: true, product: changedProduct, requestId: "r-product" }));
    const metaFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ ok: true, metaRegion: changedRegion, requestId: "r-meta" }));
    const notificationFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({
        ok: true,
        notification: changedNotification,
        requestId: "r-notification",
      }));

    const productClient = createAuthenticatedAccountClient(productFetch);
    const metaClient = createAuthenticatedAccountClient(metaFetch);
    const notificationClient = createAuthenticatedAccountClient(notificationFetch);

    await syncAccountProfileSectionToApi(
      { ...mockAccountProfile, products: [changedProduct] },
      { ...mockAccountProfile, products: [mockAccountProfile.products[0]] },
      "products",
      productClient,
    );
    await syncAccountProfileSectionToApi(
      { ...mockAccountProfile, metaRegions: [changedRegion] },
      { ...mockAccountProfile, metaRegions: [mockAccountProfile.metaRegions[0]] },
      "meta-regions",
      metaClient,
    );
    await syncAccountProfileSectionToApi(
      { ...mockAccountProfile, notifications: [changedNotification] },
      { ...mockAccountProfile, notifications: [mockAccountProfile.notifications[0]] },
      "notifications",
      notificationClient,
    );

    expect(productFetch).toHaveBeenCalledWith(
      `http://localhost:3000/v1/account/products/${changedProduct.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("\"monthlyVolume\":\"48 t / month\""),
      }),
    );
    expect(metaFetch).toHaveBeenCalledWith(
      `http://localhost:3000/v1/account/meta-regions/${changedRegion.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("\"defaultCurrency\":\"USD\""),
      }),
    );
    expect(notificationFetch).toHaveBeenCalledWith(
      `http://localhost:3000/v1/account/notifications/${changedNotification.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("\"frequency\":\"daily\""),
      }),
    );
    expect(productFetch.mock.calls.map(([input]) => String(input))).not.toContain(
      "http://localhost:3000/v1/account/products",
    );
    expect(metaFetch.mock.calls.map(([input]) => String(input))).not.toContain(
      "http://localhost:3000/v1/account/meta-regions",
    );
    expect(notificationFetch.mock.calls.map(([input]) => String(input))).not.toContain(
      "http://localhost:3000/v1/account/notifications",
    );
  });

  it("uploads company media through the self-hosted API adapter", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        ok: true,
        asset: backendAsset,
        company: {
          ...backendCompany,
          media: {
            ...backendCompany.media,
            logoObjectKey: backendAsset.objectKey,
            logoAlt: "Uploaded logo",
          },
        },
        requestId: "r-file",
      }),
    );
    const client = createAccountApiClient({
      baseUrl: "http://localhost:3000",
      fetchImpl,
      userId: "44444444-4444-4444-8444-444444444444",
      sessionId: "session-media-test",
    });

    const result = await client.uploadCompanyMedia(
      "logo",
      {
        fileName: "logo.svg",
        contentType: "image/svg+xml",
        sizeBytes: 10,
        contentBase64: "bG9nby1ieXRlcw==",
        alt: "Uploaded logo",
      },
      mockAccountProfile,
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/v1/account/company/media/logo",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("contentBase64"),
      }),
    );
    const [, uploadRequest] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(new Headers(uploadRequest.headers).get(ACCOUNT_USER_ID_HEADER)).toBe("44444444-4444-4444-8444-444444444444");
    expect(new Headers(uploadRequest.headers).get(ACCOUNT_SESSION_ID_HEADER)).toBe("session-media-test");
    expect(result.asset.objectKey).toContain("company_logo");
    expect(result.profile.company.logoImageUrl).toBe(backendAsset.objectKey);
  });

  it("lists, creates and resolves company document file URLs through the self-hosted API adapter", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ ok: true, documents: [backendDocument], accountVersion: "account-v1", requestId: "r-docs" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, document: backendDocument, accountVersion: "account-v2", requestId: "r-doc" }));
    const client = createAuthenticatedAccountClient(fetchImpl);

    await expect(client.listCompanyDocuments()).resolves.toEqual([backendDocument]);
    await expect(
      client.createCompanyDocument({
        title: "HACCP certificate",
        documentType: "haccp",
        visibility: "buyer_qualified",
        file: {
          fileName: "haccp.pdf",
          contentType: "application/pdf",
          sizeBytes: 10,
          contentBase64: "ZG9jdW1lbnQ=",
        },
      }),
    ).resolves.toMatchObject({
      title: "HACCP certificate",
      status: "uploaded",
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(1, "http://localhost:3000/v1/account/documents", expect.any(Object));
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3000/v1/account/documents",
      expect.objectContaining({ method: "POST" }),
    );
    const [, createRequest] = fetchImpl.mock.calls[1] as [string, RequestInit];
    expect(new Headers(createRequest.headers).get(ACCOUNT_VERSION_HEADER)).toBe("account-v1");
    expect(client.fileUrl(backendAsset.id)).toBe(
      "http://localhost:3000/v1/account/files/22222222-2222-4222-8222-222222222222?accountUserId=00000000-0000-4000-8000-000000000001&accountSessionId=session-account-test",
    );
    expect(client.fileUrlForObjectKey(backendAsset.objectKey)).toBe(
      "http://localhost:3000/v1/account/files/by-object-key?objectKey=companies%2F111%2Fcompany_logo%2Flogo.svg&accountUserId=00000000-0000-4000-8000-000000000001&accountSessionId=session-account-test",
    );
    expect(client.resolveStoredFileUrl("https://cdn.example.com/logo.webp")).toBe(
      "https://cdn.example.com/logo.webp",
    );
  });

  it("calls row-level workspace endpoints through the self-hosted API adapter", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ ok: true, branch: { ...backendBranches[0], id: "br_row" }, requestId: "r-branch" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, product: { ...backendProducts[0], monthlyVolume: "44 t" }, requestId: "r-product" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, metaRegion: { ...backendMetaRegions[0], defaultCurrency: "EUR" }, requestId: "r-meta" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, notification: { ...backendNotifications[0], enabled: false }, requestId: "r-notification" }));
    const client = createAuthenticatedAccountClient(fetchImpl);

    await expect(client.createBranch("br_row", {
      name: "Backend Branch",
      type: "warehouse",
      country: "Norway",
      region: "More og Romsdal",
      city: "Alesund",
      addressLine: "Terminal 33",
      defaultIncoterms: "FOB",
      portOrPickupPoint: "Alesund",
      notes: "Row endpoint.",
    })).resolves.toMatchObject({ id: "br_row" });
    await expect(client.updateProduct("p_row", { monthlyVolume: "44 t" })).resolves.toMatchObject({ monthlyVolume: "44 t" });
    await expect(client.createMetaRegion("mr_row", {
      name: "Backend Region",
      countries: ["Germany", "Poland"],
      logisticsReason: "same_warehouse_route",
      defaultCurrency: "eur",
      notes: "Row endpoint.",
      usedFor: ["notifications"],
    })).resolves.toMatchObject({ defaultCurrency: "EUR" });
    await expect(client.deleteNotification("n_row")).resolves.toMatchObject({ enabled: false });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3000/v1/account/branches/br_row",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3000/v1/account/products/p_row",
      expect.objectContaining({ method: "PATCH", body: "{\"monthlyVolume\":\"44 t\"}" }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      "http://localhost:3000/v1/account/meta-regions/mr_row",
      expect.objectContaining({ method: "POST", body: expect.stringContaining("\"defaultCurrency\":\"EUR\"") }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      4,
      "http://localhost:3000/v1/account/notifications/n_row",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("converts browser File objects into account upload payloads", async () => {
    const payload = await fileToAccountUploadPayload(
      new File(["logo-bytes"], "logo.svg", { type: "image/svg+xml" }),
    );

    expect(payload).toEqual({
      fileName: "logo.svg",
      contentType: "image/svg+xml",
      sizeBytes: 10,
      contentBase64: "bG9nby1ieXRlcw==",
    });
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
    const client = createAuthenticatedAccountClient(fetchImpl);

    const synced = await syncAccountProfileToApi(mockAccountProfile, client);

    expect(synced).toBeNull();
    expect(localStorage.getItem(ACCOUNT_API_SYNC_STORAGE_KEY)).toContain("failed");
  });
});
