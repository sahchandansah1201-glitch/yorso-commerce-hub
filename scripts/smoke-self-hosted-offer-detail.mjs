#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
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
  console.log("self_hosted_offer_detail_smoke=ok");
} catch (error) {
  console.error("self_hosted_offer_detail_smoke=failed");
  console.error(error instanceof Error ? error.message : String(error));
  if (childLogs.stdout.trim()) console.error(`api stdout:\n${childLogs.stdout.trim()}`);
  if (childLogs.stderr.trim()) console.error(`api stderr:\n${childLogs.stderr.trim()}`);
  process.exitCode = 1;
} finally {
  if (api.exitCode === null) {
    api.kill("SIGTERM");
    await onceExit(api, 3000).catch(() => api.kill("SIGKILL"));
  }
}

async function runSmoke(baseUrl) {
  const live = await fetch(`${baseUrl}/health/live`);
  assertStatus(live, 200, "health live");
  console.log("health_live=ok");

  const locked = await jsonRequest(baseUrl, "/v1/offers/1?accessLevel=anonymous_locked");
  assertEqual(locked.ok, true, "locked offer detail ok");
  assertEqual(locked.accessLevel, "anonymous_locked", "locked access level");
  assertEqual(locked.offer?.id, "1", "locked offer id");
  assertEqual(locked.offer?.supplier?.id, "sup-no-001", "locked supplier public id");
  assertEqual(locked.offer?.supplier?.name, null, "locked supplier name hidden");
  assertEqual(locked.offer?.supplier?.profileSlug, null, "locked supplier profile slug hidden");
  assertEqual(locked.offer?.supplier?.inBusinessSince, null, "locked supplier age hidden");
  assertEqual(locked.offer?.supplier?.responseTime, null, "locked supplier response hidden");
  assertArray(locked.offer?.supplier?.documentsReviewed, "locked supplier documents");
  assertEqual(locked.offer.supplier.documentsReviewed.length, 0, "locked supplier document count");
  assertEqual(locked.offer?.priceMin, null, "locked exact min price hidden");
  assertEqual(locked.offer?.priceMax, null, "locked exact max price hidden");
  assertEqual(locked.offer?.currency, null, "locked currency hidden");
  assertArray(locked.offer?.volumeBreaks, "locked volume breaks");
  assertEqual(locked.offer.volumeBreaks.length, 0, "locked volume breaks hidden");
  assertEqual(locked.offer?.origin, "Norway", "locked public origin");
  assertEqual(locked.offer?.priceRangeLabel, "$8.50 – $9.20", "locked public price range label");
  assertDoesNotContain(locked, "Nordfjord Sjømat AS", "locked real supplier name");
  assertDoesNotContain(locked, "nordfjord-sjomat", "locked supplier slug");
  console.log("offer_detail_locked=ok");

  const registeredLocked = await jsonRequest(baseUrl, "/v1/offers/1?accessLevel=registered_locked");
  assertEqual(registeredLocked.ok, true, "registered locked offer detail ok");
  assertEqual(registeredLocked.accessLevel, "registered_locked", "registered locked access level");
  assertEqual(registeredLocked.offer?.supplier?.name, null, "registered locked supplier hidden");
  assertEqual(registeredLocked.offer?.priceMin, null, "registered locked exact min price hidden");
  assertEqual(registeredLocked.offer?.currency, null, "registered locked currency hidden");
  assertDoesNotContain(registeredLocked, "Nordfjord Sjømat AS", "registered locked real supplier name");
  console.log("offer_detail_registered_locked=ok");

  const unlocked = await jsonRequest(baseUrl, "/v1/offers/1?accessLevel=qualified_unlocked");
  assertEqual(unlocked.ok, true, "unlocked offer detail ok");
  assertEqual(unlocked.accessLevel, "qualified_unlocked", "unlocked access level");
  assertEqual(unlocked.offer?.supplier?.name, "Nordfjord Sjømat AS", "unlocked supplier name");
  assertEqual(unlocked.offer?.supplier?.profileSlug, "nordfjord-sjomat", "unlocked supplier slug");
  assertEqual(unlocked.offer?.priceMin, 8.5, "unlocked exact min price");
  assertEqual(unlocked.offer?.priceMax, 9.2, "unlocked exact max price");
  assertEqual(unlocked.offer?.currency, "USD", "unlocked currency");
  assertArray(unlocked.offer?.volumeBreaks, "unlocked volume breaks");
  assertEqual(unlocked.offer.volumeBreaks.length, 2, "unlocked volume break count");
  console.log("offer_detail_unlocked=ok");

  const missing = await rawJsonRequest(baseUrl, "/v1/offers/missing-offer?accessLevel=qualified_unlocked");
  assertStatus(missing.response, 404, "missing offer detail");
  assertEqual(missing.body?.ok, false, "missing offer ok false");
  assertEqual(missing.body?.error?.code, "offer_not_found", "missing offer error code");
  console.log("offer_detail_not_found=ok");

  const methodGuard = await rawJsonRequest(baseUrl, "/v1/offers/1?accessLevel=qualified_unlocked", {
    method: "POST",
  });
  assertStatus(methodGuard.response, 405, "offer detail method guard");
  assertEqual(methodGuard.response.headers.get("allow"), "GET", "offer detail allow header");
  assertEqual(methodGuard.body?.error?.code, "method_not_allowed", "offer detail method error");
  console.log("offer_detail_method_guard=ok");

  const validationGuard = await rawJsonRequest(baseUrl, "/v1/offers/1?accessLevel=invalid");
  assertStatus(validationGuard.response, 400, "offer detail validation guard");
  assertEqual(validationGuard.body?.error?.code, "validation_error", "offer detail validation error");
  console.log("offer_detail_validation_guard=ok");
}

async function jsonRequest(baseUrl, pathName, init = {}) {
  const { response, body } = await rawJsonRequest(baseUrl, pathName, init);
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${pathName} failed with ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function rawJsonRequest(baseUrl, pathName, init = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: init.method ?? "GET",
    headers: { "content-type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
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

function assertDoesNotContain(value, forbidden, label) {
  const serialized = JSON.stringify(value);
  if (serialized.includes(forbidden)) {
    throw new Error(`${label}: leaked ${JSON.stringify(forbidden)}`);
  }
}
