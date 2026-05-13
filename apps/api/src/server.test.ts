import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { assertSupabaseIsPrototypeOnly, loadApiConfig } from "./config.js";
import { createApiServer } from "./server.js";

type JsonBody = Record<string, unknown>;

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
  await closeServer();
  server = createApiServer(config);

  await new Promise<void>((resolve) => {
    server?.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected server address object.");

  return fetch(`http://127.0.0.1:${address.port}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

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
      ],
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
    expect(response.headers.get("access-control-allow-headers")).toContain("x-demo-user-id");
  });

  it("returns the current demo user profile", async () => {
    const response = await request("/v1/account/me");
    const body = (await response.json()) as JsonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.user).toMatchObject({
      email: "buyer@example.com",
      preferredLanguage: "en",
    });
  });

  it("updates the current demo user profile", async () => {
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
