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

const primaryUserId =
  process.env.YORSO_WORKSPACE_POSTGRES_SMOKE_USER_ID?.trim() || "00000000-0000-4000-8000-000000000032";
const primaryCompanyId =
  process.env.YORSO_WORKSPACE_POSTGRES_SMOKE_COMPANY_ID?.trim() || "11111111-1111-4111-8111-111111111132";
const otherUserId =
  process.env.YORSO_WORKSPACE_POSTGRES_SMOKE_OTHER_USER_ID?.trim() || "00000000-0000-4000-8000-000000000033";
const otherCompanyId =
  process.env.YORSO_WORKSPACE_POSTGRES_SMOKE_OTHER_COMPANY_ID?.trim() || "11111111-1111-4111-8111-111111111133";
const smokeSessionId = "self-hosted-workspace-postgres-smoke";

if (!databaseUrl) {
  console.log("self_hosted_workspace_postgres_smoke=skipped");
  console.log("reason=MIGRATION_DATABASE_URL is not set");
  process.exit(0);
}

if (!existsSync(apiEntry)) {
  console.error("Compiled API entry is missing.");
  console.error("Run: npm run api:build");
  process.exit(1);
}

const freePort = await getFreePort();
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-workspace-postgres-smoke-"));
const baseUrl = `http://127.0.0.1:${freePort}`;
const childLogs = { stdout: "", stderr: "" };
let api;
let db;

try {
  await applyLiveMigrations();
  db = await connectDatabase(databaseUrl);
  await seedSmokeAccounts(db);
  api = startApi({ freePort, storageRoot, databaseUrl });
  await waitForApi(baseUrl, api);
  await runWorkspaceSmoke(baseUrl, db);
  console.log("self_hosted_workspace_postgres_smoke=ok");
} catch (error) {
  console.error("self_hosted_workspace_postgres_smoke=failed");
  console.error(error instanceof Error ? error.message : String(error));
  if (childLogs.stdout.trim()) console.error(`api stdout:\n${childLogs.stdout.trim()}`);
  if (childLogs.stderr.trim()) console.error(`api stderr:\n${childLogs.stderr.trim()}`);
  process.exitCode = 1;
} finally {
  if (api && api.exitCode === null) {
    api.kill("SIGTERM");
    await onceExit(api, 3000).catch(() => api?.kill("SIGKILL"));
  }
  await db?.end().catch(() => undefined);
  await rm(storageRoot, { recursive: true, force: true });
}

async function applyLiveMigrations() {
  const migration = spawn("npm", ["run", "db:migrations:apply:live"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      MIGRATION_DATABASE_URL: databaseUrl,
      MIGRATION_APPLIED_BY: process.env.MIGRATION_APPLIED_BY || "workspace-postgres-smoke",
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

async function connectDatabase(connectionString) {
  const client = new Client({ connectionString, application_name: "yorso-workspace-postgres-smoke" });
  await client.connect();
  return client;
}

async function seedSmokeAccounts(client) {
  await client.query("begin");
  try {
    await upsertUserAndCompany(client, {
      userId: primaryUserId,
      companyId: primaryCompanyId,
      email: "workspace.primary.32@yorso.local",
      firstName: "Workspace",
      lastName: "Primary",
      legalName: "Workspace Primary Seafood LLC",
      tradeName: "Workspace Primary Seafood",
    });
    await upsertUserAndCompany(client, {
      userId: otherUserId,
      companyId: otherCompanyId,
      email: "workspace.other.32@yorso.local",
      firstName: "Workspace",
      lastName: "Other",
      legalName: "Workspace Other Seafood LLC",
      tradeName: "Workspace Other Seafood",
    });
    await clearWorkspaceRows(client, [primaryCompanyId, otherCompanyId], [primaryUserId, otherUserId]);
    await seedSupplierDirectoryRows(client);
    await client.query("commit");
    console.log("workspace_seed=ok");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  }
}

async function upsertUserAndCompany(client, input) {
  await client.query(
    `
      insert into yorso_users (
        id, first_name, last_name, email, phone, preferred_language, timezone, created_at, updated_at
      )
      values ($1, $2, $3, $4, '+1 555 0032', 'en', 'Europe/Moscow', now(), now())
      on conflict (id) do update
      set first_name = excluded.first_name,
          last_name = excluded.last_name,
          email = excluded.email,
          phone = excluded.phone,
          preferred_language = excluded.preferred_language,
          timezone = excluded.timezone,
          updated_at = now()
    `,
    [input.userId, input.firstName, input.lastName, input.email],
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
        $1, $2, $3, $4, 'both', 'NO',
        'https://example.com/workspace-smoke', 2026, $5,
        '+47 32 32 32 32', '+47 32 32 32 32', 'Workspace smoke account for live PostgreSQL checks.',
        array['Atlantic Salmon', 'Cod', 'Shrimp'], array['ASC', 'MSC', 'HACCP'], array['30/70'],
        'draft', 'not_started', now(), now()
      )
      on conflict (id) do update
      set owner_user_id = excluded.owner_user_id,
          legal_name = excluded.legal_name,
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
    [input.companyId, input.userId, input.legalName, input.tradeName, input.email],
  );
}

async function clearWorkspaceRows(client, companyIds, userIds) {
  await client.query("delete from yorso_access_notifications where buyer_user_id = any($1::uuid[])", [userIds]);
  await client.query("delete from yorso_access_events where buyer_user_id = any($1::uuid[]) or actor_user_id = any($1::uuid[])", [userIds]);
  await client.query("delete from yorso_access_grants where buyer_user_id = any($1::uuid[]) or granted_by_user_id = any($1::uuid[])", [userIds]);
  await client.query("delete from yorso_supplier_access_requests where buyer_user_id = any($1::uuid[]) or decided_by_user_id = any($1::uuid[])", [userIds]);
  await client.query("delete from yorso_notification_preferences where user_id = any($1::uuid[])", [userIds]);
  await client.query("delete from yorso_company_meta_regions where company_id = any($1::uuid[])", [companyIds]);
  await client.query("delete from yorso_company_products where company_id = any($1::uuid[])", [companyIds]);
  await client.query("delete from yorso_company_branches where company_id = any($1::uuid[])", [companyIds]);
}

async function seedSupplierDirectoryRows(client) {
  await client.query("delete from yorso_suppliers_directory where id in ('pg32_supplier_salmon')");
  await client.query(
    `
      insert into yorso_suppliers_directory (
        id, company_id, company_name, masked_name, country, country_code, city,
        supplier_type, in_business_since_year, product_focus, certifications,
        certification_badges, active_offers_count, short_description, about,
        response_signal, document_readiness, verification_level, hero_image,
        logo_image, delivery_countries, delivery_countries_total,
        total_products_count, product_catalog_preview, website, whatsapp,
        publication_status, created_at, updated_at
      )
      values (
        'pg32_supplier_salmon', $1, 'Postgres Smoke Salmon AS',
        'Norwegian salmon supplier · PG-032', 'Norway', 'NO', 'Alesund',
        'producer', 2012,
        $2::jsonb, array['ASC', 'HACCP'],
        $3::jsonb, 11, 'PostgreSQL smoke supplier for self-hosted supplier directory.',
        'Private supplier identity and contact details for PostgreSQL smoke.',
        'fast', 'ready', 'documents_reviewed', '/offers/salmon.webp',
        null, $4::jsonb, 6, 18, $5::jsonb,
        'https://postgres-smoke-supplier.example', '+47 32 00 00 32',
        'published', now(), now()
      )
    `,
    [
      primaryCompanyId,
      JSON.stringify([{ species: "Atlantic Salmon", forms: "HOG, fillet" }]),
      JSON.stringify([{ code: "ASC", label: "ASC", logo: null }]),
      JSON.stringify([{ code: "DE", name: "Germany" }, { code: "FR", name: "France" }]),
      JSON.stringify([{ name: "Smoke Salmon HOG", species: "Atlantic Salmon", form: "HOG", image: "/offers/salmon.webp" }]),
    ],
  );
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
      VITE_SUPABASE_URL: "",
      VITE_SUPABASE_PUBLISHABLE_KEY: "",
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

async function runWorkspaceSmoke(baseUrl, client) {
  const live = await fetch(`${baseUrl}/health/live`);
  assertStatus(live, 200, "health live");
  console.log("health_live=ok");

  const suppliersLocked = await jsonRequest(baseUrl, "/v1/suppliers?q=salmon&accessLevel=anonymous_locked");
  assertEqual(
    suppliersLocked.suppliers?.some((item) => item.id === "pg32_supplier_salmon"),
    true,
    "supplier directory locked row present",
  );
  const smokeSupplierLocked = suppliersLocked.suppliers.find((item) => item.id === "pg32_supplier_salmon");
  assertEqual(smokeSupplierLocked.companyName, null, "supplier locked companyName");
  assertEqual(smokeSupplierLocked.website, null, "supplier locked website");
  console.log("supplier_directory_locked=ok");

  const supplierBeforeGrant = await jsonRequest(baseUrl, "/v1/suppliers/pg32_supplier_salmon?accessLevel=qualified_unlocked");
  assertEqual(supplierBeforeGrant.accessLevel, "registered_locked", "supplier detail requires grant");
  assertEqual(supplierBeforeGrant.supplier?.companyName, null, "supplier identity hidden before grant");
  assertEqual(supplierBeforeGrant.supplier?.website, null, "supplier website hidden before grant");
  console.log("supplier_directory_requires_grant=ok");

  const supplierAccessRequest = await jsonRequest(baseUrl, "/v1/access/suppliers/pg32_supplier_salmon/request", {
    method: "POST",
    body: { message: "" },
  });
  assertEqual(supplierAccessRequest.request?.status, "sent", "supplier access request sent");
  const supplierAccessApproval = await jsonRequest(
    baseUrl,
    `/v1/access/supplier-requests/${encodeURIComponent(supplierAccessRequest.request.id)}/decision`,
    {
      method: "POST",
      body: { status: "approved" },
    },
  );
  assertEqual(supplierAccessApproval.request?.status, "approved", "supplier access request approved");

  const supplierUnlocked = await jsonRequest(baseUrl, "/v1/suppliers/pg32_supplier_salmon?accessLevel=qualified_unlocked");
  assertEqual(supplierUnlocked.accessLevel, "qualified_unlocked", "supplier unlocked access level");
  assertEqual(supplierUnlocked.supplier?.companyName, "Postgres Smoke Salmon AS", "supplier unlocked companyName");
  assertEqual(supplierUnlocked.supplier?.website, "https://postgres-smoke-supplier.example", "supplier unlocked website");
  console.log("supplier_directory_unlocked=ok");

  const branches = [
    {
      id: "pg32_branch_alesund",
      name: "Alesund Loading Point",
      type: "loading_point",
      country: "Norway",
      region: "More og Romsdal",
      city: "Alesund",
      addressLine: "Harbor 32",
      defaultIncoterms: "FOB",
      portOrPickupPoint: "Alesund port",
      notes: "Batch 32 workspace smoke branch.",
    },
    {
      id: "pg32_branch_rotterdam",
      name: "Rotterdam Cold Store",
      type: "warehouse",
      country: "Netherlands",
      region: "South Holland",
      city: "Rotterdam",
      addressLine: "Cold Lane 32",
      defaultIncoterms: "FCA",
      portOrPickupPoint: "Rotterdam warehouse",
      notes: "Transit warehouse for EU distribution.",
    },
  ];
  const branchesUpdate = await jsonRequest(baseUrl, "/v1/account/branches", { method: "PATCH", body: branches });
  assertEqual(branchesUpdate.branches?.length, 2, "branch replace count");
  assertEqual(branchesUpdate.branches?.[0]?.id, "pg32_branch_alesund", "branch order");
  console.log("branches_replace=ok");

  const branchesRead = await jsonRequest(baseUrl, "/v1/account/branches");
  assertEqual(branchesRead.branches?.map((item) => item.id).join(","), "pg32_branch_alesund,pg32_branch_rotterdam", "branch read ids");
  console.log("branches_read=ok");

  const branchRowCreate = await jsonRequest(baseUrl, "/v1/account/branches/pg32_branch_row", {
    method: "POST",
    body: {
      name: "Batch 33 Row Branch",
      type: "loading_point",
      country: "Norway",
      region: "More og Romsdal",
      city: "Alesund",
      addressLine: "Row Terminal 33",
      defaultIncoterms: "FOB",
      portOrPickupPoint: "Alesund row terminal",
      notes: "Created through row-level endpoint.",
    },
  });
  assertEqual(branchRowCreate.branch?.id, "pg32_branch_row", "row branch create id");
  console.log("branch_row_create=ok");

  const branchRowPatch = await jsonRequest(baseUrl, "/v1/account/branches/pg32_branch_row", {
    method: "PATCH",
    body: { city: "Bergen", defaultIncoterms: "FCA" },
  });
  assertEqual(branchRowPatch.branch?.city, "Bergen", "row branch patch city");
  console.log("branch_row_patch=ok");

  const products = [
    {
      id: "pg32_product_salmon",
      commercialName: "Batch 32 Atlantic Salmon",
      latinName: "Salmo salar",
      category: "Salmon",
      state: "fresh",
      format: "HOG 4-6 kg",
      role: "selling",
      monthlyVolume: "120 t",
      certificates: ["ASC", "HACCP"],
      targetCountries: ["Germany", "France"],
    },
    {
      id: "pg32_product_cod",
      commercialName: "Batch 32 Cod H&G",
      latinName: "Gadus morhua",
      category: "Whitefish",
      state: "frozen",
      format: "H&G 2-4 kg",
      role: "both",
      monthlyVolume: "80 t",
      certificates: ["MSC"],
      targetCountries: ["Spain", "Portugal"],
    },
  ];
  const productsUpdate = await jsonRequest(baseUrl, "/v1/account/products", { method: "PATCH", body: products });
  assertEqual(productsUpdate.products?.length, 2, "product replace count");
  assertEqual(productsUpdate.products?.[1]?.targetCountries?.includes("Portugal"), true, "product target country");
  console.log("products_replace=ok");

  const productRowPatch = await jsonRequest(baseUrl, "/v1/account/products/pg32_product_salmon", {
    method: "PATCH",
    body: {
      monthlyVolume: "150 t",
      targetCountries: ["Germany", "France", "Poland"],
    },
  });
  assertEqual(productRowPatch.product?.monthlyVolume, "150 t", "row product patch volume");
  console.log("product_row_patch=ok");

  const metaRegions = [
    {
      id: "pg32_meta_baltic",
      name: "Batch 32 Baltic Cold Route",
      countries: ["Germany", "Poland", "Lithuania"],
      logisticsReason: "same_warehouse_route",
      defaultCurrency: "EUR",
      notes: "Grouped by cold-chain warehouse route.",
      usedFor: ["notifications", "landed_cost", "supplier_matching"],
    },
    {
      id: "pg32_meta_iberia",
      name: "Batch 32 Iberia Buyers",
      countries: ["Spain", "Portugal"],
      logisticsReason: "same_sales_market",
      defaultCurrency: "EUR",
      notes: "Grouped by sales market.",
      usedFor: ["price_access", "campaigns"],
    },
  ];
  const metaUpdate = await jsonRequest(baseUrl, "/v1/account/meta-regions", { method: "PATCH", body: metaRegions });
  assertEqual(metaUpdate.metaRegions?.length, 2, "meta-region replace count");
  assertEqual(metaUpdate.metaRegions?.[0]?.defaultCurrency, "EUR", "meta-region currency");
  console.log("meta_regions_replace=ok");

  const metaRegionRowDelete = await jsonRequest(baseUrl, "/v1/account/meta-regions/pg32_meta_iberia", { method: "DELETE" });
  assertEqual(metaRegionRowDelete.deletedId, "pg32_meta_iberia", "row meta-region delete id");
  console.log("meta_region_row_delete=ok");

  const notifications = [
    {
      id: "pg32_email",
      channel: "email",
      enabled: true,
      events: ["price_access_approved", "new_matching_product", "country_news"],
      frequency: "daily",
    },
    {
      id: "pg32_agent",
      channel: "agent",
      enabled: false,
      events: [],
      frequency: "weekly",
    },
  ];
  const notificationsUpdate = await jsonRequest(baseUrl, "/v1/account/notifications", {
    method: "PATCH",
    body: notifications,
  });
  assertEqual(notificationsUpdate.notifications?.length, 2, "notification replace count");
  assertEqual(notificationsUpdate.notifications?.[0]?.events?.includes("country_news"), true, "notification event");
  console.log("notifications_replace=ok");

  const invalidNotification = await fetch(`${baseUrl}/v1/account/notifications`, {
    method: "PATCH",
    headers: accountHeaders(primaryUserId),
    body: JSON.stringify([
      {
        id: "pg32_invalid_enabled_empty",
        channel: "email",
        enabled: true,
        events: [],
        frequency: "daily",
      },
    ]),
  });
  assertStatus(invalidNotification, 400, "invalid notification validation");
  const invalidBody = await invalidNotification.json();
  assertEqual(invalidBody.error?.code, "validation_error", "invalid notification error code");
  console.log("notifications_validation_guard=ok");

  const notificationRowCreate = await jsonRequest(baseUrl, "/v1/account/notifications/pg32_row_in_app", {
    method: "POST",
    body: {
      channel: "in_app",
      enabled: true,
      events: ["document_readiness"],
      frequency: "instant",
    },
  });
  assertEqual(notificationRowCreate.notification?.id, "pg32_row_in_app", "row notification create id");
  console.log("notification_row_create=ok");

  await assertDatabaseCounts(client, {
    companyId: primaryCompanyId,
    userId: primaryUserId,
    branches: 3,
    products: 2,
    metaRegions: 1,
    notifications: 3,
  });
  console.log("workspace_db_counts=ok");

  const otherBranches = await jsonRequest(baseUrl, "/v1/account/branches", { userId: otherUserId });
  assertEqual(otherBranches.branches?.length, 0, "other user branch isolation");
  const otherProducts = await jsonRequest(baseUrl, "/v1/account/products", { userId: otherUserId });
  assertEqual(otherProducts.products?.length, 0, "other user product isolation");
  const otherMetaRegions = await jsonRequest(baseUrl, "/v1/account/meta-regions", { userId: otherUserId });
  assertEqual(otherMetaRegions.metaRegions?.length, 0, "other user meta-region isolation");
  const otherNotifications = await jsonRequest(baseUrl, "/v1/account/notifications", { userId: otherUserId });
  assertEqual(otherNotifications.notifications?.length, 0, "other user notification isolation");
  console.log("workspace_owner_isolation=ok");

  const branchesEmpty = await jsonRequest(baseUrl, "/v1/account/branches", { method: "PATCH", body: [] });
  assertEqual(branchesEmpty.branches?.length, 0, "branch empty replace count");
  const branchCountAfterEmpty = await countRows(client, "yorso_company_branches", "company_id", primaryCompanyId);
  assertEqual(branchCountAfterEmpty, 0, "branch empty replace DB count");
  console.log("branches_empty_replace=ok");
}

async function assertDatabaseCounts(client, expected) {
  const counts = {
    branches: await countRows(client, "yorso_company_branches", "company_id", expected.companyId),
    products: await countRows(client, "yorso_company_products", "company_id", expected.companyId),
    metaRegions: await countRows(client, "yorso_company_meta_regions", "company_id", expected.companyId),
    notifications: await countRows(client, "yorso_notification_preferences", "user_id", expected.userId),
  };

  for (const [key, expectedValue] of Object.entries(expected)) {
    if (key === "companyId" || key === "userId") continue;
    assertEqual(counts[key], expectedValue, `${key} DB count`);
  }
}

async function countRows(client, table, column, value) {
  const allowedTables = new Set([
    "yorso_company_branches",
    "yorso_company_products",
    "yorso_company_meta_regions",
    "yorso_notification_preferences",
  ]);
  const allowedColumns = new Set(["company_id", "user_id"]);
  if (!allowedTables.has(table) || !allowedColumns.has(column)) {
    throw new Error(`Unsafe countRows target: ${table}.${column}`);
  }

  const result = await client.query(`select count(*)::int as count from ${table} where ${column} = $1`, [value]);
  return result.rows[0]?.count;
}

async function jsonRequest(baseUrl, pathName, init = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: init.method ?? "GET",
    headers: accountHeaders(init.userId ?? primaryUserId),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${init.method ?? "GET"} ${pathName} failed with ${response.status}: ${text}`);
  }
  return response.json();
}

function accountHeaders(userId) {
  return {
    "content-type": "application/json",
    "x-yorso-user-id": userId,
    "x-yorso-session-id": smokeSessionId,
  };
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
