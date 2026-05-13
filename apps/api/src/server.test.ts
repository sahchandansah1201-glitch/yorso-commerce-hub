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

  return fetch(`http://127.0.0.1:${address.port}${path}`, init);
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
      dto: ["CompanyProfile", "CompanyProfileUpdate", "UserProfile"],
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
