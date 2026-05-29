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

if (!existsSync(apiEntry)) {
  console.error("Compiled API entry is missing.");
  console.error("Run: npm run api:build");
  process.exit(1);
}

const freePort = await getFreePort();
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-admin-access-grants-smoke-"));
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
    AUTH_RATE_LIMIT_DRIVER: "memory",
    AUTH_RATE_LIMIT_FAIL_MODE: "closed",
    AUTH_SESSION_CACHE_DRIVER: "memory",
    AUTH_SESSION_CACHE_FAIL_MODE: "closed",
    YORSO_AUDIT_DRIVER: "console",
    YORSO_METRICS_DRIVER: "prometheus",
    YORSO_REQUEST_OBSERVABILITY_DRIVER: "console",
    YORSO_ERROR_OBSERVABILITY_DRIVER: "console",
    AUTH_OBSERVABILITY_DRIVER: "console",
    STORAGE_DRIVER: "local",
    STORAGE_LOCAL_ROOT: path.join(storageRoot, "uploads"),
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
  console.log("self_hosted_admin_access_grants_smoke=ok");
} catch (error) {
  console.error("self_hosted_admin_access_grants_smoke=failed");
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
  const missingSession = await fetch(`${baseUrl}/v1/admin/access-grants`);
  assertStatus(missingSession, 401, "admin access grants missing session");
  console.log("admin_access_grants_auth_guard=ok");

  const buyerHeaders = await signIn(baseUrl, "buyer@example.com");
  const buyerRead = await fetch(`${baseUrl}/v1/admin/access-grants`, { headers: buyerHeaders });
  assertStatus(buyerRead, 403, "admin access grants buyer role guard");
  assertEqual((await buyerRead.json()).error?.code, "admin_role_required", "admin access grants buyer role code");
  console.log("admin_access_grants_role_guard=ok");

  const created = await jsonRequest(baseUrl, "/v1/access/suppliers/sup-no-001/request", {
    method: "POST",
    headers: buyerHeaders,
    body: { message: "Need exact price for recurring salmon purchasing" },
  });
  assertEqual(created.request?.status, "sent", "buyer access request created");

  const adminHeaders = await signIn(baseUrl, "admin@example.com");
  const approved = await jsonRequest(
    baseUrl,
    `/v1/admin/access-requests/${encodeURIComponent(created.request.id)}/decision`,
    {
      method: "POST",
      headers: adminHeaders,
      body: { status: "approved" },
    },
  );
  assertEqual(approved.request?.status, "approved", "admin approval status");
  assertEqual(approved.grants?.length, 2, "admin approval creates two grants");

  const grantList = await jsonRequest(baseUrl, "/v1/admin/access-grants?status=active&q=sup-no-001", {
    headers: adminHeaders,
  });
  assertEqual(grantList.ok, true, "admin grants list ok");
  assertEqual(grantList.total, 1, "admin grants active total");
  assertDeepEqual(grantList.items[0].scopes.sort(), ["offer_price", "supplier_identity"], "admin grants scopes");
  assertEqual(grantList.items[0].supplier.supplierId, "sup-no-001", "admin grants supplier id");
  assertDoesNotContain(grantList, buyerHeaders["x-yorso-session-id"], "admin grants must not leak buyer session");
  console.log("admin_access_grants_list=ok");

  const offerUnlocked = await jsonRequest(baseUrl, "/v1/offers/1?accessLevel=qualified_unlocked", {
    headers: buyerHeaders,
  });
  assertEqual(offerUnlocked.offer?.supplier?.name, "Nordfjord Sjømat AS", "buyer offer unlocked before revoke");
  assertEqual(offerUnlocked.offer?.priceMin, 8.5, "buyer exact price unlocked before revoke");

  const revoke = await jsonRequest(
    baseUrl,
    `/v1/admin/access-grants/${encodeURIComponent(grantList.items[0].id)}/revoke`,
    {
      method: "POST",
      headers: adminHeaders,
      body: { reason: "Commercial access ended" },
    },
  );
  assertEqual(revoke.accessGranted, false, "admin grant revoke accessGranted false");
  assertEqual(revoke.request?.status, "revoked", "admin grant revoke request status");
  assertDeepEqual(revoke.revokedGrants.map((grant) => grant.scope).sort(), ["offer_price", "supplier_identity"], "admin grant revoked scopes");
  console.log("admin_access_grants_revoke=ok");

  const offerLockedAgain = await jsonRequest(baseUrl, "/v1/offers/1?accessLevel=qualified_unlocked", {
    headers: buyerHeaders,
  });
  assertEqual(offerLockedAgain.accessLevel, "registered_locked", "buyer offer downgraded after revoke");
  assertEqual(offerLockedAgain.offer?.supplier?.name, null, "buyer supplier masked after revoke");
  assertEqual(offerLockedAgain.offer?.priceMin, null, "buyer price masked after revoke");
  assertDoesNotContain(offerLockedAgain, "Nordfjord Sjømat AS", "revoked offer must not leak supplier");
  console.log("admin_access_grants_revoke_masks_catalog=ok");

  const expired = await jsonRequest(baseUrl, "/v1/admin/access-grants?status=expired&q=sup-no-001", {
    headers: adminHeaders,
  });
  assertEqual(expired.total, 1, "admin grants expired total");
  assertEqual(expired.items[0].isActive, false, "admin grants expired inactive");
  assertEqual(expired.items[0].request?.status, "revoked", "admin grants expired request status");
  console.log("admin_access_grants_filters=ok");

  const invalid = await fetch(`${baseUrl}/v1/admin/access-grants/not-a-uuid/revoke`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ reason: "bad id" }),
  });
  assertStatus(invalid, 404, "admin grant invalid uuid guard");
  console.log("admin_access_grants_validation_guard=ok");
}

async function signIn(baseUrl, email) {
  const response = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password: "Password1",
    }),
  });
  const body = await response.json();
  assertStatus(response, 200, `${email} sign-in`);
  return {
    "content-type": "application/json",
    "x-yorso-session-id": body.session.id,
    "x-yorso-user-id": body.session.userId,
  };
}

async function jsonRequest(baseUrl, pathName, options = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: options.method ?? "GET",
    headers: options.headers ?? { "content-type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${options.method ?? "GET"} ${pathName} failed with ${response.status}: ${text}`);
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

function assertDeepEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDoesNotContain(value, needle, label) {
  const text = JSON.stringify(value);
  if (text.includes(needle)) {
    throw new Error(`${label}: found forbidden ${JSON.stringify(needle)}`);
  }
}
