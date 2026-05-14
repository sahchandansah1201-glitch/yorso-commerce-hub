#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const apiEntry = path.join(repoRoot, "apps/api/dist/index.js");
const smokeUserId = "00000000-0000-4000-8000-000000000001";
const smokeSessionId = "self-hosted-account-smoke";
const accountHeaders = {
  "content-type": "application/json",
  "x-yorso-user-id": smokeUserId,
  "x-yorso-session-id": smokeSessionId,
};

if (!existsSync(apiEntry)) {
  console.error("Compiled API entry is missing.");
  console.error("Run: npm run api:build");
  process.exit(1);
}

const freePort = await getFreePort();
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-account-api-smoke-"));
const baseUrl = `http://127.0.0.1:${freePort}`;
const childLogs = { stdout: "", stderr: "" };
const api = spawn(process.execPath, [apiEntry], {
  cwd: repoRoot,
  env: {
    ...process.env,
    NODE_ENV: "test",
    YORSO_API_HOST: "127.0.0.1",
    YORSO_API_PORT: String(freePort),
    YORSO_PUBLIC_APP_URL: "http://localhost:8080",
    ACCOUNT_REPOSITORY: "memory",
    STORAGE_DRIVER: "local",
    STORAGE_LOCAL_ROOT: path.join(storageRoot, "uploads"),
    VITE_SUPABASE_URL: "",
    VITE_SUPABASE_PUBLISHABLE_KEY: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

api.stdout?.on("data", (chunk) => {
  childLogs.stdout += chunk.toString();
});
api.stderr?.on("data", (chunk) => {
  childLogs.stderr += chunk.toString();
});

try {
  await waitForApi(baseUrl, api);
  await runSmoke(baseUrl);
  console.log("self_hosted_account_api_smoke=ok");
} catch (error) {
  console.error("self_hosted_account_api_smoke=failed");
  console.error(error instanceof Error ? error.message : String(error));
  if (childLogs.stdout.trim()) console.error(`api stdout:\n${childLogs.stdout.trim()}`);
  if (childLogs.stderr.trim()) console.error(`api stderr:\n${childLogs.stderr.trim()}`);
  process.exitCode = 1;
} finally {
  if (api.exitCode === null) {
    api.kill("SIGTERM");
    await onceExit(api, 3000).catch(() => api.kill("SIGKILL"));
  }
  await rm(storageRoot, { recursive: true, force: true });
}

async function runSmoke(baseUrl) {
  const live = await fetch(`${baseUrl}/health/live`);
  assertStatus(live, 200, "health live");
  console.log("health_live=ok");

  const suppliersLocked = await jsonRequest(baseUrl, "/v1/suppliers?q=salmon&accessLevel=anonymous_locked");
  assertEqual(suppliersLocked.ok, true, "supplier list ok");
  assertEqual(suppliersLocked.suppliers?.[0]?.companyName, null, "locked supplier company hidden");
  assertEqual(suppliersLocked.suppliers?.[0]?.website, null, "locked supplier website hidden");
  console.log("supplier_directory_locked=ok");

  const certifiedSuppliers = await jsonRequest(
    baseUrl,
    "/v1/suppliers?verificationLevel=documents_reviewed&accessLevel=anonymous_locked&limit=2",
  );
  assertEqual(certifiedSuppliers.ok, true, "certified supplier list ok");
  assertEqual(certifiedSuppliers.suppliers?.length, 2, "certified supplier page size");
  assertEqual(certifiedSuppliers.total, 3, "certified supplier total");
  assertEqual(certifiedSuppliers.suppliers?.[0]?.companyName, null, "certified locked supplier hidden identity");
  console.log("supplier_directory_verified_filter=ok");

  const supplierBeforeGrant = await jsonRequest(baseUrl, "/v1/suppliers/sup-no-001?accessLevel=qualified_unlocked");
  assertEqual(supplierBeforeGrant.accessLevel, "registered_locked", "supplier detail requires grant");
  assertEqual(supplierBeforeGrant.supplier?.companyName, null, "supplier identity hidden before grant");
  assertEqual(supplierBeforeGrant.supplier?.website, null, "supplier website hidden before grant");
  console.log("supplier_directory_requires_grant=ok");

  const supplierPrivateSearchBeforeGrant = await jsonRequest(
    baseUrl,
    "/v1/suppliers?q=Nordfjord&accessLevel=qualified_unlocked",
  );
  assertEqual(supplierPrivateSearchBeforeGrant.total, 0, "supplier private search requires grant");
  console.log("supplier_directory_private_search_requires_grant=ok");

  const offersLocked = await jsonRequest(baseUrl, "/v1/offers?q=salmon&accessLevel=anonymous_locked");
  assertEqual(offersLocked.ok, true, "offer list ok");
  assertEqual(offersLocked.offers?.[0]?.supplier?.name, null, "locked offer supplier hidden");
  assertEqual(offersLocked.offers?.[0]?.priceMin, null, "locked offer exact min price hidden");
  assertEqual(offersLocked.offers?.[0]?.currency, null, "locked offer currency hidden");
  console.log("offer_catalog_locked=ok");

  const offerPrivateSearch = await jsonRequest(baseUrl, "/v1/offers?q=Nordfjord&accessLevel=anonymous_locked");
  assertEqual(offerPrivateSearch.total, 0, "locked offer search must not match private supplier identity");
  console.log("offer_catalog_private_search_guard=ok");

  const offerPrivateSearchBeforeGrant = await jsonRequest(
    baseUrl,
    "/v1/offers?q=Nordfjord&accessLevel=qualified_unlocked",
  );
  assertEqual(offerPrivateSearchBeforeGrant.total, 0, "qualified offer private search requires grant");
  console.log("offer_catalog_private_search_requires_grant=ok");

  const offerListBeforeGrant = await jsonRequest(baseUrl, "/v1/offers?q=salmon&accessLevel=qualified_unlocked");
  assertEqual(offerListBeforeGrant.total, 1, "qualified offer public search total before grant");
  assertEqual(offerListBeforeGrant.offers?.[0]?.priceMin, null, "qualified offer list price hidden before grant");
  assertEqual(offerListBeforeGrant.offers?.[0]?.supplier?.name, null, "qualified offer list supplier hidden before grant");
  console.log("offer_catalog_list_requires_grant=ok");

  const offerFiltered = await jsonRequest(
    baseUrl,
    "/v1/offers?category=Shrimp&originCode=EC&supplierCountryCode=EC&format=Frozen&certification=BAP&accessLevel=anonymous_locked",
  );
  assertEqual(offerFiltered.total, 1, "offer catalog filtered total");
  assertEqual(offerFiltered.offers?.[0]?.id, "2", "offer catalog filtered id");
  console.log("offer_catalog_filters=ok");

  const offerBeforeGrant = await jsonRequest(baseUrl, "/v1/offers/1?accessLevel=qualified_unlocked");
  assertEqual(offerBeforeGrant.accessLevel, "registered_locked", "qualified offer detail requires supplier access grant");
  assertEqual(offerBeforeGrant.offer?.supplier?.name, null, "offer detail supplier hidden before grant");
  assertEqual(offerBeforeGrant.offer?.priceMin, null, "offer detail price hidden before grant");
  console.log("offer_catalog_requires_grant=ok");

  const accessInitial = await jsonRequest(baseUrl, "/v1/access/suppliers/sup-no-001/request");
  assertEqual(accessInitial.request, null, "supplier access initial request");
  assertEqual(accessInitial.accessGranted, false, "supplier access initial grant");
  console.log("supplier_access_initial=ok");

  const accessRequest = await jsonRequest(baseUrl, "/v1/access/suppliers/sup-no-001/request", {
    method: "POST",
    body: { message: "" },
  });
  assertEqual(accessRequest.request?.supplierId, "sup-no-001", "supplier access request supplier id");
  assertEqual(accessRequest.request?.status, "sent", "supplier access request sent status");
  console.log("supplier_access_request=ok");

  const accessPending = await jsonRequest(
    baseUrl,
    `/v1/access/supplier-requests/${encodeURIComponent(accessRequest.request.id)}/decision`,
    {
      method: "POST",
      body: { status: "pending" },
    },
  );
  assertEqual(accessPending.request?.status, "pending", "supplier access pending status");
  assertEqual(accessPending.notification, null, "supplier access pending notification");
  console.log("supplier_access_pending=ok");

  const accessApproved = await jsonRequest(
    baseUrl,
    `/v1/access/supplier-requests/${encodeURIComponent(accessRequest.request.id)}/decision`,
    {
      method: "POST",
      body: { status: "approved" },
    },
  );
  assertEqual(accessApproved.request?.status, "approved", "supplier access approved status");
  assertEqual(accessApproved.grants?.length, 2, "supplier access grants");
  assertEqual(accessApproved.notification?.type, "price_access_approved", "supplier access notification type");
  console.log("supplier_access_approved=ok");

  const accessFinal = await jsonRequest(baseUrl, "/v1/access/suppliers/sup-no-001/request");
  assertEqual(accessFinal.accessGranted, true, "supplier access grant after approval");
  assertEqual(accessFinal.request?.status, "approved", "supplier access final status");
  console.log("supplier_access_grant=ok");

  const supplierUnlocked = await jsonRequest(baseUrl, "/v1/suppliers/sup-no-001?accessLevel=qualified_unlocked");
  assertEqual(supplierUnlocked.accessLevel, "qualified_unlocked", "unlocked supplier access level");
  assertEqual(supplierUnlocked.supplier?.companyName, "Nordfjord Sjømat AS", "unlocked supplier identity");
  assertEqual(supplierUnlocked.supplier?.website, "https://example-nordfjord.no", "unlocked supplier website");
  console.log("supplier_directory_unlocked=ok");

  const supplierPrivateSearchAfterGrant = await jsonRequest(
    baseUrl,
    "/v1/suppliers?q=Nordfjord&accessLevel=qualified_unlocked",
  );
  assertEqual(supplierPrivateSearchAfterGrant.total, 1, "granted supplier private search total");
  assertEqual(
    supplierPrivateSearchAfterGrant.suppliers?.[0]?.companyName,
    "Nordfjord Sjømat AS",
    "granted supplier private search identity",
  );
  console.log("supplier_directory_granted_private_search=ok");

  const supplierPrivateSearchWithoutGrant = await jsonRequest(
    baseUrl,
    "/v1/suppliers?q=Pacific%20Blue&accessLevel=qualified_unlocked",
  );
  assertEqual(supplierPrivateSearchWithoutGrant.total, 0, "ungranted supplier private search remains hidden");
  console.log("supplier_directory_ungranted_private_search_guard=ok");

  const offerUnlocked = await jsonRequest(baseUrl, "/v1/offers/1?accessLevel=qualified_unlocked");
  assertEqual(offerUnlocked.offer?.supplier?.name, "Nordfjord Sjømat AS", "unlocked offer supplier identity");
  assertEqual(offerUnlocked.offer?.priceMin, 8.5, "unlocked offer exact price");
  console.log("offer_catalog_unlocked=ok");

  const offerPrivateSearchAfterGrant = await jsonRequest(
    baseUrl,
    "/v1/offers?q=Nordfjord&accessLevel=qualified_unlocked",
  );
  assertEqual(offerPrivateSearchAfterGrant.total, 1, "granted offer private search total");
  assertEqual(
    offerPrivateSearchAfterGrant.offers?.[0]?.supplier?.name,
    "Nordfjord Sjømat AS",
    "granted offer private search supplier identity",
  );
  assertEqual(offerPrivateSearchAfterGrant.offers?.[0]?.priceMin, 8.5, "granted offer private search exact price");
  console.log("offer_catalog_granted_private_search=ok");

  const offerPrivateSearchWithoutGrant = await jsonRequest(
    baseUrl,
    "/v1/offers?q=Pacific%20Blue&accessLevel=qualified_unlocked",
  );
  assertEqual(offerPrivateSearchWithoutGrant.total, 0, "ungranted offer private search remains hidden");
  console.log("offer_catalog_ungranted_private_search_guard=ok");

  const accessNotifications = await jsonRequest(baseUrl, "/v1/access/notifications");
  assertEqual(accessNotifications.notifications?.length, 1, "supplier access notifications list");
  assertEqual(accessNotifications.notifications?.[0]?.type, "price_access_approved", "supplier access notification listed");
  console.log("supplier_access_notifications=ok");

  const missingSession = await fetch(`${baseUrl}/v1/account/company`);
  assertStatus(missingSession, 401, "missing account session");
  const missingSessionBody = await missingSession.json();
  assertEqual(missingSessionBody.error?.code, "account_session_required", "missing session error code");
  console.log("session_required_guard=ok");

  const me = await jsonRequest(baseUrl, "/v1/account/me");
  assertEqual(me.ok, true, "account me ok");
  assertEqual(me.user?.id, smokeUserId, "account me user id");
  console.log("account_me=ok");

  const companyPatch = {
    tradeName: "Smoke Batch 30 Seafood",
    productFocus: ["Atlantic Salmon", "Cod", "Self-hosted smoke"],
    certificates: ["ASC", "MSC", "HACCP"],
  };
  const companyUpdate = await jsonRequest(baseUrl, "/v1/account/company", {
    method: "PATCH",
    body: companyPatch,
  });
  assertEqual(companyUpdate.company?.tradeName, companyPatch.tradeName, "company tradeName update");
  assertEqual(companyUpdate.company?.productFocus?.includes("Self-hosted smoke"), true, "company productFocus update");
  console.log("company_patch=ok");

  const products = await jsonRequest(baseUrl, "/v1/account/products");
  assertEqual(products.ok, true, "products ok");
  assertArray(products.products, "products list");
  const nextProducts = [
    ...products.products,
    {
      id: "p_smoke_30",
      commercialName: "Smoke Test Haddock",
      latinName: "Melanogrammus aeglefinus",
      category: "Whitefish",
      state: "frozen",
      format: "H&G 1-2 kg",
      role: "buying",
      monthlyVolume: "12 t",
      certificates: ["MSC"],
      targetCountries: ["Norway", "Iceland"],
    },
  ];
  const productsUpdate = await jsonRequest(baseUrl, "/v1/account/products", {
    method: "PATCH",
    body: nextProducts,
  });
  assertEqual(productsUpdate.products?.some((item) => item.id === "p_smoke_30"), true, "product replace");
  console.log("products_replace=ok");

  const branchCreate = await jsonRequest(baseUrl, "/v1/account/branches/br_smoke_33", {
    method: "POST",
    body: {
      name: "Smoke Row Loading Point",
      type: "loading_point",
      country: "Norway",
      region: "More og Romsdal",
      city: "Alesund",
      addressLine: "Terminal 33",
      defaultIncoterms: "FOB",
      portOrPickupPoint: "Alesund",
      notes: "Created through row-level smoke.",
    },
  });
  assertEqual(branchCreate.branch?.id, "br_smoke_33", "row branch create id");
  console.log("branch_row_create=ok");

  const branchConflict = await fetch(`${baseUrl}/v1/account/branches/br_smoke_33`, {
    method: "POST",
    headers: accountHeaders,
    body: JSON.stringify({
      name: "Smoke Row Loading Point Duplicate",
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
  assertStatus(branchConflict, 409, "row branch conflict");
  console.log("branch_row_conflict_guard=ok");

  const productPatch = await jsonRequest(baseUrl, "/v1/account/products/p_smoke_30", {
    method: "PATCH",
    body: {
      monthlyVolume: "18 t",
      targetCountries: ["Norway", "Iceland", "Spain"],
    },
  });
  assertEqual(productPatch.product?.monthlyVolume, "18 t", "row product patch");
  console.log("product_row_patch=ok");

  const metaRegionCreate = await jsonRequest(baseUrl, "/v1/account/meta-regions/mr_smoke_33", {
    method: "POST",
    body: {
      name: "Smoke Row Baltic",
      countries: ["Germany", "Poland"],
      logisticsReason: "same_warehouse_route",
      defaultCurrency: "EUR",
      notes: "Created through row-level smoke.",
      usedFor: ["notifications", "landed_cost"],
    },
  });
  assertEqual(metaRegionCreate.metaRegion?.id, "mr_smoke_33", "row meta-region create");
  console.log("meta_region_row_create=ok");

  const notificationCreate = await jsonRequest(baseUrl, "/v1/account/notifications/n_smoke_33", {
    method: "POST",
    body: {
      channel: "agent",
      enabled: false,
      events: [],
      frequency: "weekly",
    },
  });
  assertEqual(notificationCreate.notification?.channel, "agent", "row notification create");
  const notificationInvalid = await fetch(`${baseUrl}/v1/account/notifications/n_smoke_33`, {
    method: "PATCH",
    headers: accountHeaders,
    body: JSON.stringify({
      enabled: true,
      events: [],
    }),
  });
  assertStatus(notificationInvalid, 400, "row notification validation");
  console.log("notification_row_validation_guard=ok");

  const branchDelete = await jsonRequest(baseUrl, "/v1/account/branches/br_smoke_33", {
    method: "DELETE",
  });
  assertEqual(branchDelete.deletedId, "br_smoke_33", "row branch delete id");
  console.log("branch_row_delete=ok");

  const logoBytes = Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"><text>YORSO</text></svg>");
  const logoUpload = await jsonRequest(baseUrl, "/v1/account/company/media/logo", {
    method: "POST",
    body: {
      fileName: "smoke-logo.svg",
      contentType: "image/svg+xml",
      sizeBytes: logoBytes.byteLength,
      contentBase64: logoBytes.toString("base64"),
      alt: "Smoke logo",
    },
  });
  assertEqual(logoUpload.ok, true, "logo upload ok");
  assertEqual(logoUpload.asset?.purpose, "company_logo", "logo upload purpose");
  assertEqual(logoUpload.company?.media?.logoObjectKey, logoUpload.asset?.objectKey, "logo object key persisted");
  console.log("logo_upload=ok");

  const logoByAsset = await fetch(
    `${baseUrl}/v1/account/files/${encodeURIComponent(logoUpload.asset.id)}?accountUserId=${encodeURIComponent(smokeUserId)}&accountSessionId=${encodeURIComponent(smokeSessionId)}`,
  );
  assertStatus(logoByAsset, 200, "logo read by asset id");
  assertEqual(await logoByAsset.text(), logoBytes.toString(), "logo bytes by asset id");
  console.log("logo_read_by_asset=ok");

  const wrongUserLogo = await fetch(
    `${baseUrl}/v1/account/files/${encodeURIComponent(logoUpload.asset.id)}?accountUserId=${encodeURIComponent("99999999-9999-4999-8999-999999999999")}&accountSessionId=${encodeURIComponent(smokeSessionId)}`,
  );
  assertStatus(wrongUserLogo, 404, "wrong user file isolation");
  console.log("file_owner_guard=ok");

  const logoByObjectKey = await fetch(
    `${baseUrl}/v1/account/files/by-object-key?objectKey=${encodeURIComponent(logoUpload.asset.objectKey)}&accountUserId=${encodeURIComponent(smokeUserId)}&accountSessionId=${encodeURIComponent(smokeSessionId)}`,
  );
  assertStatus(logoByObjectKey, 200, "logo read by object key");
  assertEqual(await logoByObjectKey.text(), logoBytes.toString(), "logo bytes by object key");
  console.log("logo_read_by_object_key=ok");

  const documentBytes = Buffer.from("Smoke HACCP certificate");
  const documentCreate = await jsonRequest(baseUrl, "/v1/account/documents", {
    method: "POST",
    body: {
      title: "Smoke HACCP Certificate",
      documentType: "haccp",
      visibility: "private",
      expiresAt: null,
      file: {
        fileName: "smoke-haccp.pdf",
        contentType: "application/pdf",
        sizeBytes: documentBytes.byteLength,
        contentBase64: documentBytes.toString("base64"),
      },
    },
  });
  assertEqual(documentCreate.ok, true, "document create ok");
  assertEqual(documentCreate.document?.documentType, "haccp", "document type");
  assertEqual(documentCreate.document?.status, "uploaded", "document status");
  console.log("document_upload=ok");

  const documents = await jsonRequest(baseUrl, "/v1/account/documents");
  assertEqual(documents.ok, true, "documents ok");
  assertEqual(
    documents.documents?.some((document) => document.title === "Smoke HACCP Certificate"),
    true,
    "document listed",
  );
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
    const timeout = setTimeout(() => reject(new Error("Timed out waiting for API process exit.")), timeoutMs);
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

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label}: expected array, got ${typeof value}`);
  }
}
