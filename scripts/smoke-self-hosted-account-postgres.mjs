#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const apiEntry = path.join(repoRoot, "apps/api/dist/index.js");
const databaseUrl = process.env.MIGRATION_DATABASE_URL?.trim();
const smokeUserId = process.env.YORSO_POSTGRES_SMOKE_USER_ID?.trim() || "00000000-0000-4000-8000-000000000031";
const smokeCompanyId = process.env.YORSO_POSTGRES_SMOKE_COMPANY_ID?.trim() || "11111111-1111-4111-8111-111111111131";
const smokeSessionId = "self-hosted-postgres-account-smoke";
const accountHeaders = {
  "content-type": "application/json",
  "x-yorso-user-id": smokeUserId,
  "x-yorso-session-id": smokeSessionId,
};

if (!databaseUrl) {
  console.log("self_hosted_account_postgres_smoke=skipped");
  console.log("reason=MIGRATION_DATABASE_URL is not set");
  process.exit(0);
}

if (!existsSync(apiEntry)) {
  console.error("Compiled API entry is missing.");
  console.error("Run: npm run api:build");
  process.exit(1);
}

const freePort = await getFreePort();
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-account-postgres-smoke-"));
const baseUrl = `http://127.0.0.1:${freePort}`;
const childLogs = { stdout: "", stderr: "" };
let api;

try {
  await applyLiveMigrations();
  await seedSmokeAccount(databaseUrl);
  api = startApi({ freePort, storageRoot, databaseUrl });
  await waitForApi(baseUrl, api);
  await runSmoke(baseUrl);
  console.log("self_hosted_account_postgres_smoke=ok");
} catch (error) {
  console.error("self_hosted_account_postgres_smoke=failed");
  console.error(error instanceof Error ? error.message : String(error));
  if (childLogs.stdout.trim()) console.error(`api stdout:\n${childLogs.stdout.trim()}`);
  if (childLogs.stderr.trim()) console.error(`api stderr:\n${childLogs.stderr.trim()}`);
  process.exitCode = 1;
} finally {
  if (api && api.exitCode === null) {
    api.kill("SIGTERM");
    await onceExit(api, 3000).catch(() => api?.kill("SIGKILL"));
  }
  await rm(storageRoot, { recursive: true, force: true });
}

async function applyLiveMigrations() {
  const migration = spawn("npm", ["run", "db:migrations:apply:live"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      MIGRATION_DATABASE_URL: databaseUrl,
      MIGRATION_APPLIED_BY: process.env.MIGRATION_APPLIED_BY || "account-postgres-smoke",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const output = { stdout: "", stderr: "" };
  migration.stdout?.on("data", (chunk) => {
    output.stdout += chunk.toString();
  });
  migration.stderr?.on("data", (chunk) => {
    output.stderr += chunk.toString();
  });

  const result = await onceExit(migration, 120_000);
  if (result.code !== 0) {
    throw new Error(
      [
        "Live migration apply failed.",
        output.stdout.trim() ? `stdout:\n${output.stdout.trim()}` : "",
        output.stderr.trim() ? `stderr:\n${output.stderr.trim()}` : "",
      ].filter(Boolean).join("\n"),
    );
  }
  console.log("live_migrations_apply=ok");
}

async function seedSmokeAccount(connectionString) {
  const client = new Client({ connectionString, application_name: "yorso-account-postgres-smoke-seed" });
  await client.connect();
  try {
    await client.query("begin");
    await client.query(
      `
        insert into yorso_users (
          id, first_name, last_name, email, phone, preferred_language, timezone, created_at, updated_at
        )
        values ($1, 'Postgres', 'Smoke', 'postgres.smoke.31@yorso.local', '+1 555 0031', 'en', 'Europe/Moscow', now(), now())
        on conflict (id) do update
        set first_name = excluded.first_name,
            last_name = excluded.last_name,
            email = excluded.email,
            phone = excluded.phone,
            preferred_language = excluded.preferred_language,
            timezone = excluded.timezone,
            updated_at = now()
      `,
      [smokeUserId],
    );
    await client.query(
      `
        insert into yorso_companies (
          id, owner_user_id, legal_name, trade_name, account_role, country_code,
          website, year_founded, contact_email, contact_phone, messenger_handle,
          description, product_focus, certificates, payment_terms,
          publication_status, buyer_qualification_status, created_at, updated_at
        )
        values (
          $1, $2, 'Postgres Smoke Seafood LLC', 'Postgres Smoke Seafood', 'both', 'NO',
          'https://example.com/postgres-smoke', 2026, 'postgres.smoke@yorso.local',
          '+47 31 31 31 31', '+47 31 31 31 31', 'Smoke account for live PostgreSQL self-hosted API checks.',
          array['Atlantic Salmon', 'Cod'], array['ASC', 'MSC'], array['30/70'],
          'draft', 'not_started', now(), now()
        )
        on conflict (id) do update
        set legal_name = excluded.legal_name,
            trade_name = excluded.trade_name,
            account_role = excluded.account_role,
            country_code = excluded.country_code,
            website = excluded.website,
            year_founded = excluded.year_founded,
            contact_email = excluded.contact_email,
            contact_phone = excluded.contact_phone,
            messenger_handle = excluded.messenger_handle,
            description = excluded.description,
            product_focus = excluded.product_focus,
            certificates = excluded.certificates,
            payment_terms = excluded.payment_terms,
            publication_status = excluded.publication_status,
            buyer_qualification_status = excluded.buyer_qualification_status,
            updated_at = now()
      `,
      [smokeCompanyId, smokeUserId],
    );
    await client.query("commit");
    console.log("smoke_seed=ok");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

function startApi({ freePort, storageRoot, databaseUrl }) {
  const child = spawn(process.execPath, [apiEntry], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: "test",
      YORSO_API_HOST: "127.0.0.1",
      YORSO_API_PORT: String(freePort),
      YORSO_PUBLIC_APP_URL: "http://localhost:8080",
      ACCOUNT_REPOSITORY: "postgres",
      DATABASE_URL: databaseUrl,
      STORAGE_DRIVER: "local",
      STORAGE_LOCAL_ROOT: path.join(storageRoot, "uploads"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk) => {
    childLogs.stdout += chunk.toString();
  });
  child.stderr?.on("data", (chunk) => {
    childLogs.stderr += chunk.toString();
  });

  return child;
}

async function runSmoke(baseUrl) {
  const live = await fetch(`${baseUrl}/health/live`);
  assertStatus(live, 200, "health live");
  console.log("health_live=ok");

  const missingSession = await fetch(`${baseUrl}/v1/account/company`);
  assertStatus(missingSession, 401, "missing account session");
  const missingSessionBody = await missingSession.json();
  assertEqual(missingSessionBody.error?.code, "account_session_required", "missing session error code");
  console.log("session_required_guard=ok");

  const me = await jsonRequest(baseUrl, "/v1/account/me");
  assertEqual(me.user?.id, smokeUserId, "account me user id");
  assertEqual(me.user?.email, "postgres.smoke.31@yorso.local", "seeded user email");
  console.log("account_me=ok");

  const companyUpdate = await jsonRequest(baseUrl, "/v1/account/company", {
    method: "PATCH",
    body: {
      tradeName: "Postgres Smoke Batch 31 Seafood",
      productFocus: ["Atlantic Salmon", "Cod", "Postgres smoke"],
      certificates: ["ASC", "MSC", "HACCP"],
    },
  });
  assertEqual(companyUpdate.company?.id, smokeCompanyId, "company id");
  assertEqual(companyUpdate.company?.tradeName, "Postgres Smoke Batch 31 Seafood", "company tradeName update");
  console.log("company_patch=ok");

  const productPayload = [
    {
      id: "pg_smoke_31",
      commercialName: "Postgres Smoke Cod",
      latinName: "Gadus morhua",
      category: "Whitefish",
      state: "frozen",
      format: "H&G 2-4 kg",
      role: "selling",
      monthlyVolume: "31 t",
      certificates: ["MSC"],
      targetCountries: ["Norway", "Spain"],
    },
  ];
  const productsUpdate = await jsonRequest(baseUrl, "/v1/account/products", {
    method: "PATCH",
    body: productPayload,
  });
  assertEqual(productsUpdate.products?.length, 1, "product replace count");
  assertEqual(productsUpdate.products?.[0]?.id, "pg_smoke_31", "product replace id");
  console.log("products_replace=ok");

  const logoBytes = Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"><text>PG31</text></svg>");
  const logoUpload = await jsonRequest(baseUrl, "/v1/account/company/media/logo", {
    method: "POST",
    body: {
      fileName: "postgres-smoke-logo.svg",
      contentType: "image/svg+xml",
      sizeBytes: logoBytes.byteLength,
      contentBase64: logoBytes.toString("base64"),
      alt: "Postgres smoke logo",
    },
  });
  assertEqual(logoUpload.asset?.companyId, smokeCompanyId, "logo company id");
  assertEqual(logoUpload.asset?.purpose, "company_logo", "logo purpose");
  console.log("logo_upload=ok");

  const logoRead = await fetch(
    `${baseUrl}/v1/account/files/${encodeURIComponent(logoUpload.asset.id)}?accountUserId=${encodeURIComponent(smokeUserId)}&accountSessionId=${encodeURIComponent(smokeSessionId)}`,
  );
  assertStatus(logoRead, 200, "logo file read");
  assertEqual(await logoRead.text(), logoBytes.toString(), "logo bytes");
  console.log("logo_read=ok");

  const wrongUserRead = await fetch(
    `${baseUrl}/v1/account/files/${encodeURIComponent(logoUpload.asset.id)}?accountUserId=${encodeURIComponent("99999999-9999-4999-8999-999999999999")}&accountSessionId=${encodeURIComponent(smokeSessionId)}`,
  );
  assertStatus(wrongUserRead, 404, "wrong user file read");
  console.log("file_owner_guard=ok");

  const documentBytes = Buffer.from("Postgres smoke HACCP certificate");
  const documentCreate = await jsonRequest(baseUrl, "/v1/account/documents", {
    method: "POST",
    body: {
      title: "Postgres Smoke HACCP",
      documentType: "haccp",
      visibility: "private",
      expiresAt: null,
      file: {
        fileName: "postgres-smoke-haccp.pdf",
        contentType: "application/pdf",
        sizeBytes: documentBytes.byteLength,
        contentBase64: documentBytes.toString("base64"),
      },
    },
  });
  assertEqual(documentCreate.document?.companyId, smokeCompanyId, "document company id");
  assertEqual(documentCreate.document?.status, "uploaded", "document status");
  console.log("document_upload=ok");

  const documents = await jsonRequest(baseUrl, "/v1/account/documents");
  assertEqual(documents.documents?.some((document) => document.title === "Postgres Smoke HACCP"), true, "document listed");
  console.log("documents_list=ok");
}

async function jsonRequest(baseUrl, pathName, init = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: init.method ?? "GET",
    headers: accountHeaders,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${init.method ?? "GET"} ${pathName} failed with ${response.status}: ${text}`);
  }
  return response.json();
}

async function waitForApi(baseUrl, child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`API process exited before healthcheck. code=${child.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health/live`);
      if (response.ok) return;
    } catch {
      // Keep polling while the API process starts.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${baseUrl}/health/live`);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === "string") {
          reject(new Error("Could not reserve a local TCP port."));
          return;
        }
        resolve(address.port);
      });
    });
  });
}

function onceExit(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for process exit.")), timeoutMs);
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertStatus(response, expected, label) {
  if (response.status !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, got ${response.status}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
