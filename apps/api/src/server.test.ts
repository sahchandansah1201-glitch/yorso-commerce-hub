import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { assertSupabaseIsPrototypeOnly, loadApiConfig } from "./config.js";
import { createApiServer } from "./server.js";

type JsonBody = Record<string, unknown>;
const testAccountUserId = "00000000-0000-4000-8000-000000000001";
const testAccountSessionId = "api-test-session";
const accountSessionHeaders = {
  "x-yorso-user-id": testAccountUserId,
  "x-yorso-session-id": testAccountSessionId,
};

const config = loadApiConfig(
  {
    NODE_ENV: "test",
    YORSO_API_PORT: "3000",
  },
  { allowLocalDefaults: true },
);

let server: Server | undefined;

async function closeServer() {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  server = undefined;
}

async function request(path: string, init?: RequestInit) {
  const fetchApi = await startTestServer();
  return fetchApi(path, init);
}

async function startTestServer() {
  await closeServer();
  server = createApiServer(config);

  await new Promise<void>((resolve) => {
    server?.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected server address object.");

  return (path: string, init?: RequestInit) =>
    fetch(`http://127.0.0.1:${address.port}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...accountSessionHeaders,
        ...(init?.headers ?? {}),
      },
    });
}

const filePayload = (content: string, fileName = "sample.txt", contentType = "text/plain") => {
  const bytes = Buffer.from(content, "utf8");
  return {
    fileName,
    contentType,
    sizeBytes: bytes.byteLength,
    contentBase64: bytes.toString("base64"),
  };
};

afterEach(async () => {
  await closeServer();
});

describe("YORSO self-hosted API skeleton", () => {
  it("serves a live health endpoint", async () => {
    const response = await request("/health/live");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("x-yorso-backend")).toBe("self-hosted");
    expect(body).toMatchObject({
      ok: true,
      service: "yorso-api",
      status: "live",
    });
    expect(body.requestId).toEqual(expect.any(String));
  });

  it("serves readiness data for self-hosted dependencies", async () => {
    const response = await request("/health/ready");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.selfHostedBackend).toBe(true);
    expect(body.supabaseProductionBackend).toBe(false);
    expect(body.dependencies).toMatchObject({
      postgresConfigured: true,
      redisConfigured: true,
      objectStorageConfigured: true,
    });
  });

  it("exposes the account-company contract summary without importing Supabase", async () => {
    const response = await request("/v1/account/company/schema");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.contract).toMatchObject({
      name: "account-company",
      version: 1,
      source: "packages/contracts/src/account-company.ts",
      dto: [
        "CompanyProfile",
        "CompanyProfileUpdate",
        "UserProfile",
        "UserProfileUpdate",
        "CompanyBranch",
        "CompanyBranchCreate",
        "CompanyBranchUpdate",
        "CompanyProduct",
        "CompanyProductCreate",
        "CompanyProductUpdate",
        "MetaRegion",
        "MetaRegionCreate",
        "MetaRegionUpdate",
        "NotificationPreference",
        "NotificationPreferenceCreate",
        "NotificationPreferenceUpdate",
        "AccountFileUploadPayload",
        "AccountFileAsset",
        "CompanyDocument",
        "CompanyDocumentCreate",
        "AccountSessionHeaders",
      ],
      headers: {
        userId: "x-yorso-user-id",
        sessionId: "x-yorso-session-id",
      },
    });
    expect(body.productionTarget).toMatchObject({
      backend: "self-hosted-yorso-api",
      database: "postgresql",
      supabase: "prototype-only",
    });
  });

  it("returns structured errors for unsupported routes and methods", async () => {
    const missing = await request("/missing");
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "not_found" },
    });

    const invalidMethod = await request("/health/live", { method: "POST" });
    expect(invalidMethod.status).toBe(405);
    expect(invalidMethod.headers.get("allow")).toBe("GET");
  });

  it("handles browser CORS preflight for account endpoints", async () => {
    const response = await request("/v1/account/company", {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:8080",
        "access-control-request-method": "PATCH",
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:8080");
    expect(response.headers.get("access-control-allow-methods")).toContain("PATCH");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    expect(response.headers.get("access-control-allow-methods")).toContain("DELETE");
    expect(response.headers.get("access-control-allow-headers")).toContain("x-yorso-user-id");
    expect(response.headers.get("access-control-allow-headers")).toContain("x-yorso-session-id");
  });

  it("lists suppliers without leaking locked identity or contacts", async () => {
    const response = await request("/v1/suppliers?q=salmon&accessLevel=anonymous_locked");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.total).toBe(1);
    expect(body.accessLevel).toBe("anonymous_locked");
    expect(body.suppliers).toEqual([
      expect.objectContaining({
        id: "sup-no-001",
        maskedName: "Norwegian salmon producer · NO-114",
        companyName: null,
        about: null,
        activeOffersCount: null,
        deliveryCountries: expect.arrayContaining([
          expect.objectContaining({ code: "DE" }),
        ]),
        totalProductsCount: null,
        website: null,
        whatsapp: null,
      }),
    ]);
    expect(JSON.stringify(body)).not.toContain("Nordfjord Sjømat AS");
    expect(JSON.stringify(body)).not.toContain("example-nordfjord.no");
    expect((body.suppliers as Array<{ deliveryCountries: unknown[] }>)[0].deliveryCountries.length).toBeLessThanOrEqual(3);
  });

  it("does not let supplier search reveal private company identity before a grant", async () => {
    const lockedResponse = await request("/v1/suppliers?q=Nordfjord&accessLevel=registered_locked");
    const lockedBody = (await lockedResponse.json()) as JsonBody;

    expect(lockedResponse.status).toBe(200);
    expect(lockedBody.total).toBe(0);
    expect(lockedBody.suppliers).toEqual([]);

    const qualifiedWithoutGrant = await request("/v1/suppliers?q=Nordfjord&accessLevel=qualified_unlocked");
    const qualifiedWithoutGrantBody = (await qualifiedWithoutGrant.json()) as JsonBody;

    expect(qualifiedWithoutGrant.status).toBe(200);
    expect(qualifiedWithoutGrantBody.total).toBe(0);
    expect(qualifiedWithoutGrantBody.suppliers).toEqual([]);
  });

  it("filters supplier directory by verification level without unlocking private fields", async () => {
    const response = await request("/v1/suppliers?verificationLevel=documents_reviewed&accessLevel=anonymous_locked&limit=2");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.suppliers).toHaveLength(2);
    expect(body.total).toBe(3);
    expect(body.suppliers).toEqual([
      expect.objectContaining({
        verificationLevel: "documents_reviewed",
        companyName: null,
      }),
      expect.objectContaining({
        verificationLevel: "documents_reviewed",
        companyName: null,
      }),
    ]);
    expect(JSON.stringify(body)).not.toContain("Nordfjord Sjømat AS");
  });

  it("sorts and paginates supplier directory on the backend", async () => {
    const response = await request(
      "/v1/suppliers?verificationLevel=documents_reviewed&accessLevel=anonymous_locked&sortBy=country&sortDirection=asc&limit=1&offset=1",
    );
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.total).toBe(3);
    expect(body.limit).toBe(1);
    expect(body.offset).toBe(1);
    expect(body.suppliers).toEqual([
      expect.objectContaining({
        countryCode: "EC",
        companyName: null,
      }),
    ]);
    expect(JSON.stringify(body)).not.toContain("Pacific Blue Shrimp S.A.");
  });

  it("downgrades qualified supplier detail requests when the account has no supplier grant", async () => {
    const response = await request("/v1/suppliers/sup-no-001?accessLevel=qualified_unlocked");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.accessLevel).toBe("registered_locked");
    expect(body.supplier).toMatchObject({
      id: "sup-no-001",
      companyName: null,
      activeOffersCount: null,
      totalProductsCount: null,
      website: null,
      whatsapp: null,
    });
    expect(JSON.stringify(body)).not.toContain("Nordfjord Sjømat AS");
    expect(JSON.stringify(body)).not.toContain("example-nordfjord.no");
  });

  it("unlocks supplier identity for qualified supplier-directory access after grant approval", async () => {
    const fetchApi = await startTestServer();
    const accessRequest = await fetchApi("/v1/access/suppliers/sup-no-001/request", {
      method: "POST",
      body: JSON.stringify({ message: "" }),
    });
    const accessRequestBody = (await accessRequest.json()) as JsonBody;
    const requestId = (accessRequestBody.request as { id: string }).id;

    const decision = await fetchApi(`/v1/access/supplier-requests/${requestId}/decision`, {
      method: "POST",
      body: JSON.stringify({ status: "approved" }),
    });
    expect(decision.status).toBe(200);

    const response = await fetchApi("/v1/suppliers/sup-no-001?accessLevel=qualified_unlocked");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.accessLevel).toBe("qualified_unlocked");
    expect(body.supplier).toMatchObject({
      id: "sup-no-001",
      companyName: "Nordfjord Sjømat AS",
      activeOffersCount: 14,
      totalProductsCount: 32,
      website: "https://example-nordfjord.no",
      whatsapp: "+47 555 0114",
    });

    const grantedSearch = await fetchApi("/v1/suppliers?q=Nordfjord&accessLevel=qualified_unlocked");
    const grantedSearchBody = (await grantedSearch.json()) as JsonBody;
    expect(grantedSearch.status).toBe(200);
    expect(grantedSearchBody.total).toBe(1);
    expect(grantedSearchBody.suppliers).toEqual([
      expect.objectContaining({
        id: "sup-no-001",
        companyName: "Nordfjord Sjømat AS",
      }),
    ]);

    const unrelatedPrivateSearch = await fetchApi("/v1/suppliers?q=Pacific%20Blue&accessLevel=qualified_unlocked");
    const unrelatedPrivateSearchBody = (await unrelatedPrivateSearch.json()) as JsonBody;
    expect(unrelatedPrivateSearch.status).toBe(200);
    expect(unrelatedPrivateSearchBody.total).toBe(0);
    expect(unrelatedPrivateSearchBody.suppliers).toEqual([]);
  });

  it("validates supplier directory query params and returns 404 for missing supplier", async () => {
    const invalid = await request("/v1/suppliers?limit=999");
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "validation_error" },
    });

    const missing = await request("/v1/suppliers/missing-supplier");
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "supplier_not_found" },
    });
  });

  it("lists offers without leaking locked supplier identity or exact price", async () => {
    const response = await request("/v1/offers?q=salmon&accessLevel=anonymous_locked");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.total).toBe(1);
    expect(body.accessLevel).toBe("anonymous_locked");
    expect(body.offers).toEqual([
      expect.objectContaining({
        id: "1",
        productName: "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade",
        priceRangeLabel: "Price on request",
        priceUnit: "",
        priceMin: null,
        priceMax: null,
        currency: null,
        volumeBreaks: [],
        supplier: expect.objectContaining({
          id: "sup-no-001",
          name: null,
          country: "Norway",
          profileSlug: null,
        }),
      }),
    ]);
    expect(JSON.stringify(body)).not.toContain("Nordfjord Sjømat AS");
    expect(JSON.stringify(body)).not.toContain("$8.50");
    expect(JSON.stringify(body)).not.toContain("$9.20");
  });

  it("does not let locked offer search reveal supplier identity", async () => {
    const lockedResponse = await request("/v1/offers?q=Nordfjord&accessLevel=registered_locked");
    const lockedBody = (await lockedResponse.json()) as JsonBody;

    expect(lockedResponse.status).toBe(200);
    expect(lockedBody.total).toBe(0);
    expect(lockedBody.offers).toEqual([]);

    const unlockedResponse = await request("/v1/offers?q=Nordfjord&accessLevel=qualified_unlocked");
    const unlockedBody = (await unlockedResponse.json()) as JsonBody;

    expect(unlockedResponse.status).toBe(200);
    expect(unlockedBody.total).toBe(0);
    expect(unlockedBody.offers).toEqual([]);

    const publicQualifiedResponse = await request("/v1/offers?q=salmon&accessLevel=qualified_unlocked");
    const publicQualifiedBody = (await publicQualifiedResponse.json()) as JsonBody;

    expect(publicQualifiedResponse.status).toBe(200);
    expect(publicQualifiedBody.total).toBe(1);
    expect(publicQualifiedBody.offers).toEqual([
      expect.objectContaining({
        id: "1",
        priceMin: null,
        supplier: expect.objectContaining({ name: null }),
      }),
    ]);
  });

  it("unlocks offer exact price and supplier identity for qualified access", async () => {
    const fetchApi = await startTestServer();
    const accessRequest = await fetchApi("/v1/access/suppliers/sup-no-001/request", {
      method: "POST",
      body: JSON.stringify({ message: "" }),
    });
    const accessRequestBody = (await accessRequest.json()) as JsonBody;
    const requestId = (accessRequestBody.request as { id: string }).id;

    const decision = await fetchApi(`/v1/access/supplier-requests/${requestId}/decision`, {
      method: "POST",
      body: JSON.stringify({ status: "approved" }),
    });
    expect(decision.status).toBe(200);

    const response = await fetchApi("/v1/offers/1?accessLevel=qualified_unlocked");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.offer).toMatchObject({
      id: "1",
      priceMin: 8.5,
      priceMax: 9.2,
      currency: "USD",
      supplier: {
        id: "sup-no-001",
        name: "Nordfjord Sjømat AS",
        profileSlug: "nordfjord-sjomat",
      },
    });

    const grantedSearch = await fetchApi("/v1/offers?q=Nordfjord&accessLevel=qualified_unlocked");
    const grantedSearchBody = (await grantedSearch.json()) as JsonBody;
    expect(grantedSearch.status).toBe(200);
    expect(grantedSearchBody.total).toBe(1);
    expect(grantedSearchBody.offers).toEqual([
      expect.objectContaining({
        id: "1",
        priceMin: 8.5,
        supplier: expect.objectContaining({ name: "Nordfjord Sjømat AS" }),
      }),
    ]);

    const unrelatedPrivateSearch = await fetchApi("/v1/offers?q=Pacific%20Blue&accessLevel=qualified_unlocked");
    const unrelatedPrivateSearchBody = (await unrelatedPrivateSearch.json()) as JsonBody;
    expect(unrelatedPrivateSearch.status).toBe(200);
    expect(unrelatedPrivateSearchBody.total).toBe(0);
    expect(unrelatedPrivateSearchBody.offers).toEqual([]);
  });

  it("downgrades qualified offer detail requests when the account has no supplier grant", async () => {
    const response = await request("/v1/offers/1?accessLevel=qualified_unlocked");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.accessLevel).toBe("registered_locked");
    expect(body.offer).toMatchObject({
      priceRangeLabel: "Price on request",
      priceUnit: "",
      priceMin: null,
      priceMax: null,
      currency: null,
      volumeBreaks: [],
      supplier: expect.objectContaining({
        name: null,
        profileSlug: null,
      }),
    });
    expect(body.offer.deliveryBasisOptions).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "FOB", priceRange: "Price on request", priceUnit: "" }),
      expect.objectContaining({ code: "CIF", priceRange: "Price on request", priceUnit: "" }),
    ]));
    expect(JSON.stringify(body)).not.toContain("Nordfjord Sjømat AS");
    expect(JSON.stringify(body)).not.toContain("$8.50");
    expect(JSON.stringify(body)).not.toContain("$9.20");
  });

  it("returns locked offer detail without private supplier identity or exact price fields", async () => {
    const response = await request("/v1/offers/1?accessLevel=registered_locked");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.accessLevel).toBe("registered_locked");
    expect(body.offer).toMatchObject({
      id: "1",
      productName: "Atlantic Salmon Fillet Skin-On Pin Bone Out Premium Grade",
      origin: "Norway",
      priceRangeLabel: "Price on request",
      priceUnit: "",
      priceMin: null,
      priceMax: null,
      currency: null,
      volumeBreaks: [],
      supplier: expect.objectContaining({
        id: "sup-no-001",
        name: null,
        profileSlug: null,
        inBusinessSince: null,
        responseTime: null,
        documentsReviewed: [],
      }),
    });
    expect(JSON.stringify(body)).not.toContain("Nordfjord Sjømat AS");
    expect(JSON.stringify(body)).not.toContain("nordfjord-sjomat");
    expect(JSON.stringify(body)).not.toContain("$8.50");
    expect(JSON.stringify(body)).not.toContain("$9.20");
  });

  it("filters and validates offer catalog query params", async () => {
    const filtered = await request("/v1/offers?category=Shrimp&originCode=EC&supplierCountryCode=EC&format=Frozen&certification=BAP&accessLevel=anonymous_locked");
    const filteredBody = (await filtered.json()) as JsonBody;

    expect(filtered.status).toBe(200);
    expect(filteredBody.total).toBe(1);
    expect(filteredBody.offers[0]).toMatchObject({ id: "2", category: "Shrimp" });

    const invalid = await request("/v1/offers?limit=999");
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "validation_error" },
    });

    const missing = await request("/v1/offers/missing-offer");
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "offer_not_found" },
    });

    const invalidDetail = await request("/v1/offers/1?accessLevel=invalid");
    expect(invalidDetail.status).toBe(400);
    await expect(invalidDetail.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "validation_error" },
    });

    const invalidMethod = await request("/v1/offers/1", { method: "POST" });
    expect(invalidMethod.status).toBe(405);
    expect(invalidMethod.headers.get("allow")).toBe("GET");
    await expect(invalidMethod.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "method_not_allowed" },
    });
  });

  it("sorts and paginates offer catalog on the backend", async () => {
    const response = await request(
      "/v1/offers?accessLevel=anonymous_locked&sortBy=origin&sortDirection=asc&limit=1&offset=1",
    );
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.total).toBe(4);
    expect(body.limit).toBe(1);
    expect(body.offset).toBe(1);
    expect(body.offers).toEqual([
      expect.objectContaining({
        id: "3",
        originCode: "IS",
        priceMin: null,
        supplier: expect.objectContaining({ name: null }),
      }),
    ]);
  });

  it("creates supplier price access requests, decisions and approval notifications", async () => {
    const fetchApi = await startTestServer();

    const initialRead = await fetchApi("/v1/access/suppliers/sup-no-001/request");
    const initialBody = (await initialRead.json()) as JsonBody;
    expect(initialRead.status).toBe(200);
    expect(initialBody).toMatchObject({
      ok: true,
      request: null,
      accessGranted: false,
    });

    const created = await fetchApi("/v1/access/suppliers/sup-no-001/request", {
      method: "POST",
      body: JSON.stringify({ message: "Need exact price for May shipment" }),
    });
    const createdBody = (await created.json()) as JsonBody;
    expect(created.status).toBe(201);
    expect(createdBody.request).toMatchObject({
      buyerUserId: testAccountUserId,
      supplierId: "sup-no-001",
      status: "sent",
      intent: "exact_price",
    });
    expect(createdBody.accessGranted).toBe(false);

    const requestId = String((createdBody.request as JsonBody).id);
    const pending = await fetchApi(`/v1/access/supplier-requests/${requestId}/decision`, {
      method: "POST",
      body: JSON.stringify({ status: "pending" }),
    });
    const pendingBody = (await pending.json()) as JsonBody;
    expect(pending.status).toBe(200);
    expect(pendingBody.request).toMatchObject({ id: requestId, status: "pending" });
    expect(pendingBody.notification).toBeNull();

    const approved = await fetchApi(`/v1/access/supplier-requests/${requestId}/decision`, {
      method: "POST",
      body: JSON.stringify({ status: "approved" }),
    });
    const approvedBody = (await approved.json()) as JsonBody;
    expect(approved.status).toBe(200);
    expect(approvedBody.request).toMatchObject({ id: requestId, status: "approved" });
    expect(approvedBody.grants).toEqual([
      expect.objectContaining({ scope: "supplier_identity", supplierId: "sup-no-001" }),
      expect.objectContaining({ scope: "offer_price", supplierId: "sup-no-001" }),
    ]);
    expect(approvedBody.notification).toMatchObject({
      type: "price_access_approved",
      status: "unread",
    });

    const finalRead = await fetchApi("/v1/access/suppliers/sup-no-001/request");
    const finalBody = (await finalRead.json()) as JsonBody;
    expect(finalRead.status).toBe(200);
    expect(finalBody).toMatchObject({
      accessGranted: true,
      request: expect.objectContaining({ status: "approved" }),
    });

    const notifications = await fetchApi("/v1/access/notifications");
    const notificationsBody = (await notifications.json()) as JsonBody;
    expect(notifications.status).toBe(200);
    expect(notificationsBody.notifications).toEqual([
      expect.objectContaining({
        supplierId: "sup-no-001",
        type: "price_access_approved",
        status: "unread",
      }),
    ]);

    const notificationId = String((notificationsBody.notifications as JsonBody[])[0].id);
    const acknowledged = await fetchApi("/v1/access/notifications", {
      method: "PATCH",
      body: JSON.stringify({ notificationIds: [notificationId] }),
    });
    const acknowledgedBody = (await acknowledged.json()) as JsonBody;
    expect(acknowledged.status).toBe(200);
    expect(acknowledgedBody).toMatchObject({
      ok: true,
      markedReadCount: 1,
      notifications: [
        expect.objectContaining({
          id: notificationId,
          status: "read",
          readAt: expect.any(String),
        }),
      ],
    });

    const invalidAck = await fetchApi("/v1/access/notifications", {
      method: "PATCH",
      body: JSON.stringify({ notificationIds: ["not-a-uuid"] }),
    });
    expect(invalidAck.status).toBe(400);
    await expect(invalidAck.json()).resolves.toMatchObject({
      error: { code: "validation_error" },
    });
  });

  it("validates supplier access session, payload and missing decisions", async () => {
    const missingSession = await request("/v1/access/suppliers/sup-no-001/request", {
      headers: { "x-yorso-user-id": "" },
    });
    expect(missingSession.status).toBe(401);
    await expect(missingSession.json()).resolves.toMatchObject({
      error: { code: "account_session_required" },
    });

    const invalidDecision = await request("/v1/access/supplier-requests/not-created/decision", {
      method: "POST",
      body: JSON.stringify({ status: "approved" }),
    });
    expect(invalidDecision.status).toBe(404);
    await expect(invalidDecision.json()).resolves.toMatchObject({
      error: { code: "supplier_access_request_not_found" },
    });

    const invalidPayload = await request("/v1/access/suppliers/sup-no-001/request", {
      method: "POST",
      body: JSON.stringify({ message: "x".repeat(1001) }),
    });
    expect(invalidPayload.status).toBe(400);
    await expect(invalidPayload.json()).resolves.toMatchObject({
      error: { code: "validation_error" },
    });
  });

  it("requires an explicit account session boundary for account endpoints", async () => {
    const missing = await request("/v1/account/me", {
      headers: { "x-yorso-user-id": "" },
    });
    const missingBody = (await missing.json()) as JsonBody;
    expect(missing.status).toBe(401);
    expect(missingBody).toMatchObject({
      ok: false,
      error: { code: "account_session_required" },
    });

    const invalid = await request("/v1/account/me", {
      headers: { "x-yorso-user-id": "not-a-uuid" },
    });
    const invalidBody = (await invalid.json()) as JsonBody;
    expect(invalid.status).toBe(401);
    expect(invalidBody).toMatchObject({
      ok: false,
      error: { code: "account_session_invalid" },
    });
  });

  it("returns the current account user profile", async () => {
    const response = await request("/v1/account/me");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.user).toMatchObject({
      email: "buyer@example.com",
      preferredLanguage: "en",
    });
  });

  it("updates the current account user profile", async () => {
    const response = await request("/v1/account/me", {
      method: "PATCH",
      body: JSON.stringify({
        firstName: "Updated",
        lastName: "Buyer",
        email: "updated.buyer@example.com",
        phone: null,
        preferredLanguage: "ru",
        timezone: "Europe/Moscow",
      }),
    });
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.user).toMatchObject({
      firstName: "Updated",
      email: "updated.buyer@example.com",
      phone: null,
      preferredLanguage: "ru",
    });
  });

  it("returns the current company profile", async () => {
    const response = await request("/v1/account/company");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.company).toMatchObject({
      tradeName: "Demo Seafood",
      accountRole: "both",
      countryCode: "NO",
    });
  });

  it("updates the company profile through contract validation", async () => {
    const response = await request("/v1/account/company", {
      method: "PATCH",
      body: JSON.stringify({
        tradeName: "Updated Buyer Export",
        countryCode: "ES",
        productFocus: ["Tuna", "Mackerel"],
        media: {
          logoObjectKey: "companies/demo/updated-logo.webp",
          coverObjectKey: "companies/demo/updated-cover.webp",
          logoAlt: "Updated logo",
          coverAlt: "Updated cover",
          logoFit: "cover",
          coverFocalX: 0.2,
          coverFocalY: 0.7,
        },
      }),
    });
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.company).toMatchObject({
      tradeName: "Updated Buyer Export",
      countryCode: "ES",
      productFocus: ["Tuna", "Mackerel"],
      media: {
        logoFit: "cover",
        coverFocalY: 0.7,
      },
    });
  });

  it("returns and replaces company branches", async () => {
    const current = await request("/v1/account/branches");
    expect(current.status).toBe(200);
    await expect(current.json()).resolves.toMatchObject({
      ok: true,
      branches: expect.any(Array),
    });

    const response = await request("/v1/account/branches", {
      method: "PATCH",
      body: JSON.stringify([
        {
          id: "br_api",
          name: "API Loading Point",
          type: "loading_point",
          country: "Spain",
          region: "Galicia",
          city: "Vigo",
          addressLine: "Terminal 9",
          defaultIncoterms: "FCA",
          portOrPickupPoint: "Vigo terminal",
          notes: "Saved from API test.",
        },
      ]),
    });
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.branches).toEqual([
      expect.objectContaining({
        id: "br_api",
        defaultIncoterms: "FCA",
      }),
    ]);
  });

  it("returns and replaces company products", async () => {
    const response = await request("/v1/account/products", {
      method: "PATCH",
      body: JSON.stringify([
        {
          id: "p_api",
          commercialName: "API Mackerel",
          latinName: "Scomber scombrus",
          category: "Pelagic",
          state: "frozen",
          format: "WR 300-500 g",
          role: "selling",
          monthlyVolume: "200 t",
          certificates: ["MSC"],
          targetCountries: ["Nigeria", "Vietnam"],
        },
      ]),
    });
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.products).toEqual([
      expect.objectContaining({
        id: "p_api",
        role: "selling",
      }),
    ]);
  });

  it("returns and replaces company meta-regions", async () => {
    const response = await request("/v1/account/meta-regions", {
      method: "PATCH",
      body: JSON.stringify([
        {
          id: "mr_api",
          name: "API Iberia",
          countries: ["Spain", "Portugal"],
          logisticsReason: "same_sales_market",
          defaultCurrency: "EUR",
          notes: "Shared buyer market.",
          usedFor: ["notifications", "supplier_matching"],
        },
      ]),
    });
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.metaRegions).toEqual([
      expect.objectContaining({
        id: "mr_api",
        defaultCurrency: "EUR",
      }),
    ]);
  });

  it("returns and replaces notification preferences", async () => {
    const response = await request("/v1/account/notifications", {
      method: "PATCH",
      body: JSON.stringify([
        {
          id: "n_api",
          channel: "email",
          enabled: true,
          events: ["price_access_approved", "rfq_response"],
          frequency: "daily",
        },
      ]),
    });
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.notifications).toEqual([
      expect.objectContaining({
        id: "n_api",
        frequency: "daily",
      }),
    ]);
  });

  it("supports owner-scoped row-level CRUD for account workspace sections", async () => {
    const fetchApi = await startTestServer();

    const branchCreate = await fetchApi("/v1/account/branches/br_row", {
      method: "POST",
      body: JSON.stringify({
        name: "Row Branch",
        type: "loading_point",
        country: "Norway",
        region: "More og Romsdal",
        city: "Alesund",
        addressLine: "Terminal 33",
        defaultIncoterms: "FOB",
        portOrPickupPoint: "Alesund",
        notes: "Created through row-level endpoint.",
      }),
    });
    const branchCreateBody = (await branchCreate.json()) as JsonBody;
    expect(branchCreate.status).toBe(201);
    expect(branchCreateBody.branch).toMatchObject({ id: "br_row", city: "Alesund" });

    const branchConflict = await fetchApi("/v1/account/branches/br_row", {
      method: "POST",
      body: JSON.stringify({
        name: "Row Branch Duplicate",
        type: "loading_point",
        country: "Norway",
        region: "",
        city: "Alesund",
        addressLine: "",
        defaultIncoterms: "FOB",
        portOrPickupPoint: "",
        notes: "",
      }),
    });
    expect(branchConflict.status).toBe(409);
    await expect(branchConflict.json()).resolves.toMatchObject({
      error: { code: "workspace_item_conflict" },
    });

    const branchPatch = await fetchApi("/v1/account/branches/br_row", {
      method: "PATCH",
      body: JSON.stringify({ city: "Bergen", notes: "Updated row." }),
    });
    const branchPatchBody = (await branchPatch.json()) as JsonBody;
    expect(branchPatch.status).toBe(200);
    expect(branchPatchBody.branch).toMatchObject({ id: "br_row", city: "Bergen", notes: "Updated row." });

    const productCreate = await fetchApi("/v1/account/products/p_row", {
      method: "POST",
      body: JSON.stringify({
        commercialName: "Row Salmon",
        latinName: "Salmo salar",
        category: "Salmon",
        state: "fresh",
        format: "HOG 4-6 kg",
        role: "selling",
        monthlyVolume: "33 t",
        certificates: ["ASC"],
        targetCountries: ["France"],
      }),
    });
    expect(productCreate.status).toBe(201);
    const productPatch = await fetchApi("/v1/account/products/p_row", {
      method: "PATCH",
      body: JSON.stringify({ monthlyVolume: "44 t", targetCountries: ["France", "Germany"] }),
    });
    const productPatchBody = (await productPatch.json()) as JsonBody;
    expect(productPatch.status).toBe(200);
    expect(productPatchBody.product).toMatchObject({ id: "p_row", monthlyVolume: "44 t" });

    const metaRegionCreate = await fetchApi("/v1/account/meta-regions/mr_row", {
      method: "POST",
      body: JSON.stringify({
        name: "Row Baltic",
        countries: ["Germany", "Poland"],
        logisticsReason: "same_warehouse_route",
        defaultCurrency: "EUR",
        notes: "Row-level meta-region.",
        usedFor: ["notifications", "landed_cost"],
      }),
    });
    expect(metaRegionCreate.status).toBe(201);
    const metaRegionDelete = await fetchApi("/v1/account/meta-regions/mr_row", { method: "DELETE" });
    const metaRegionDeleteBody = (await metaRegionDelete.json()) as JsonBody;
    expect(metaRegionDelete.status).toBe(200);
    expect(metaRegionDeleteBody).toMatchObject({ deletedId: "mr_row" });

    const notificationCreate = await fetchApi("/v1/account/notifications/n_row", {
      method: "POST",
      body: JSON.stringify({
        channel: "email",
        enabled: true,
        events: ["price_access_approved"],
        frequency: "daily",
      }),
    });
    expect(notificationCreate.status).toBe(201);
    const notificationInvalidPatch = await fetchApi("/v1/account/notifications/n_row", {
      method: "PATCH",
      body: JSON.stringify({ events: [] }),
    });
    expect(notificationInvalidPatch.status).toBe(400);
    await expect(notificationInvalidPatch.json()).resolves.toMatchObject({
      error: { code: "validation_error" },
    });

    const branchDelete = await fetchApi("/v1/account/branches/br_row", { method: "DELETE" });
    expect(branchDelete.status).toBe(200);
    const branchMissing = await fetchApi("/v1/account/branches/br_row");
    expect(branchMissing.status).toBe(404);
    await expect(branchMissing.json()).resolves.toMatchObject({
      error: { code: "workspace_item_not_found" },
    });
  });

  it("uploads company logo media through the self-hosted file route and updates company media", async () => {
    const fetchApi = await startTestServer();
    const response = await fetchApi("/v1/account/company/media/logo", {
      method: "POST",
      body: JSON.stringify({
        ...filePayload("logo-bytes", "logo.svg", "image/svg+xml"),
        alt: "Uploaded company logo",
      }),
    });
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(201);
    expect(body.asset).toMatchObject({
      purpose: "company_logo",
      originalFileName: "logo.svg",
      contentType: "image/svg+xml",
      sizeBytes: 10,
      storageDriver: "local",
    });
    expect(String((body.asset as JsonBody).checksumSha256)).toMatch(/^[a-f0-9]{64}$/);
    expect(body.company).toMatchObject({
      media: {
        logoAlt: "Uploaded company logo",
        logoObjectKey: expect.stringContaining("company_logo"),
      },
    });

    const objectKey = String((body.asset as JsonBody).objectKey);
    const file = await fetchApi(`/v1/account/files/by-object-key?objectKey=${encodeURIComponent(objectKey)}`);
    expect(file.status).toBe(200);
    expect(file.headers.get("content-type")).toBe("image/svg+xml");
    expect(await file.text()).toBe("logo-bytes");

    const address = server?.address();
    if (!address || typeof address === "string") throw new Error("Expected server address object.");
    const fileViaQuerySession = await fetch(
      `http://127.0.0.1:${address.port}/v1/account/files/by-object-key?objectKey=${encodeURIComponent(objectKey)}&accountUserId=${encodeURIComponent(testAccountUserId)}&accountSessionId=${encodeURIComponent(testAccountSessionId)}`,
    );
    expect(fileViaQuerySession.status).toBe(200);
    expect(await fileViaQuerySession.text()).toBe("logo-bytes");
  });

  it("creates company documents and serves the stored file back to the account user", async () => {
    const fetchApi = await startTestServer();
    const created = await fetchApi("/v1/account/documents", {
      method: "POST",
      body: JSON.stringify({
        title: "HACCP certificate",
        documentType: "haccp",
        visibility: "buyer_qualified",
        expiresAt: "2027-05-13",
        file: filePayload("document-bytes", "haccp.pdf", "application/pdf"),
      }),
    });
    const createdBody = (await created.json()) as JsonBody;
    const document = createdBody.document as JsonBody;

    expect(created.status).toBe(201);
    expect(document).toMatchObject({
      title: "HACCP certificate",
      documentType: "haccp",
      visibility: "buyer_qualified",
      status: "uploaded",
      fileName: "haccp.pdf",
      contentType: "application/pdf",
    });

    const listed = await fetchApi("/v1/account/documents");
    const listedBody = (await listed.json()) as JsonBody;
    expect(listed.status).toBe(200);
    expect(listedBody.documents).toEqual([
      expect.objectContaining({
        id: document.id,
        fileAssetId: document.fileAssetId,
      }),
    ]);

    const file = await fetchApi(`/v1/account/files/${document.fileAssetId}`);
    expect(file.status).toBe(200);
    expect(file.headers.get("content-type")).toBe("application/pdf");
    expect(file.headers.get("cache-control")).toContain("private");
    expect(await file.text()).toBe("document-bytes");
  });

  it("rejects invalid company update payloads", async () => {
    const response = await request("/v1/account/company", {
      method: "PATCH",
      body: JSON.stringify({
        countryCode: "NOR",
        website: "not-a-url",
      }),
    });
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "validation_error" },
    });
  });

  it("rejects invalid workspace section payloads", async () => {
    const response = await request("/v1/account/notifications", {
      method: "PATCH",
      body: JSON.stringify([
        {
          id: "n_invalid",
          channel: "email",
          enabled: true,
          events: [],
          frequency: "instant",
        },
      ]),
    });
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "validation_error" },
    });
  });

  it("rejects malformed file upload payloads before writing storage metadata", async () => {
    const response = await request("/v1/account/documents", {
      method: "POST",
      body: JSON.stringify({
        title: "Broken upload",
        documentType: "other",
        visibility: "private",
        file: {
          ...filePayload("too-short"),
          sizeBytes: 999,
        },
      }),
    });
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "upload_size_mismatch" },
    });
  });

  it("rejects malformed JSON bodies", async () => {
    const response = await request("/v1/account/company", {
      method: "PATCH",
      body: "{bad-json",
    });
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "invalid_json" },
    });
  });

  it("rejects Supabase production env values", () => {
    const productionConfig = loadApiConfig(
      {
        NODE_ENV: "production",
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      },
      { allowLocalDefaults: true },
    );

    expect(() => assertSupabaseIsPrototypeOnly(productionConfig)).toThrow(/Supabase env values/);
  });
});
