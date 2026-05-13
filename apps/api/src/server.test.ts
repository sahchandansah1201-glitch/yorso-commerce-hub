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
        "CompanyProduct",
        "MetaRegion",
        "NotificationPreference",
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
    expect(response.headers.get("access-control-allow-headers")).toContain("x-yorso-user-id");
    expect(response.headers.get("access-control-allow-headers")).toContain("x-yorso-session-id");
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
