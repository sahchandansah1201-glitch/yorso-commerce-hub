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
const redisPort = await getFreePort();
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
    AUTH_RATE_LIMIT_DRIVER: "audit_log",
    AUTH_RATE_LIMIT_FAIL_MODE: "open",
    AUTH_SESSION_CACHE_DRIVER: "redis",
    AUTH_SESSION_CACHE_FAIL_MODE: "closed",
    AUTH_SESSION_CACHE_TTL_MS: "300000",
    AUTH_SESSION_CACHE_KEY_PREFIX: "yorso:auth:fail-closed-smoke",
    REDIS_URL: `redis://127.0.0.1:${redisPort}`,
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
  console.log("self_hosted_session_cache_fail_closed_smoke=ok");
} catch (error) {
  console.error("self_hosted_session_cache_fail_closed_smoke=failed");
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
  const signIn = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "buyer@example.com",
      password: "Password1",
    }),
  });
  assertStatus(signIn, 503, "sign-in fail-closed when Redis session cache is unavailable");
  const signInBody = await signIn.json();
  assertEqual(signInBody.error?.code, "auth_session_cache_unavailable", "sign-in session cache error");
  console.log("auth_session_cache_fail_closed_sign_in=ok");

  const session = {
    id: "session-cache-fail-closed-smoke-session",
    userId: "00000000-0000-4000-8000-000000000001",
  };
  const sessionHeaders = {
    "x-yorso-user-id": session.userId,
    "x-yorso-session-id": session.id,
  };

  const sessionRead = await fetch(`${baseUrl}/v1/auth/session`, {
    headers: {
      "x-yorso-session-id": session.id,
    },
  });
  assertStatus(sessionRead, 503, "session read fail-closed when Redis session cache is unavailable");
  const sessionReadBody = await sessionRead.json();
  assertEqual(sessionReadBody.error?.code, "auth_session_cache_unavailable", "session read cache error");
  console.log("auth_session_cache_fail_closed_session=ok");

  const protectedAccount = await fetch(`${baseUrl}/v1/account/me`, {
    headers: sessionHeaders,
  });
  assertStatus(protectedAccount, 401, "protected account route fails closed");
  const protectedAccountBody = await protectedAccount.json();
  assertEqual(protectedAccountBody.error?.code, "account_session_invalid", "protected account session code");
  console.log("auth_session_cache_fail_closed_account=ok");

  const authenticatedCatalog = await fetch(`${baseUrl}/v1/offers?q=salmon&accessLevel=qualified_unlocked`, {
    headers: sessionHeaders,
  });
  assertStatus(authenticatedCatalog, 401, "authenticated catalog unlock fails closed");
  const authenticatedCatalogBody = await authenticatedCatalog.json();
  assertEqual(authenticatedCatalogBody.error?.code, "account_session_invalid", "authenticated catalog session code");
  console.log("auth_session_cache_fail_closed_catalog=ok");

  const publicCatalog = await jsonRequest(baseUrl, "/v1/offers?q=salmon&accessLevel=qualified_unlocked");
  assertEqual(publicCatalog.offers?.[0]?.priceMin, null, "public catalog price remains locked");
  assertEqual(publicCatalog.offers?.[0]?.supplier?.name, null, "public catalog supplier remains locked");
  assertNotIncludes(JSON.stringify(publicCatalog), "Nordfjord Sjømat AS", "public catalog supplier leak");
  assertNotIncludes(JSON.stringify(publicCatalog), "$8.50", "public catalog price leak");
  console.log("auth_session_cache_fail_closed_public_catalog=ok");
}

async function jsonRequest(baseUrl, pathName, init = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method: init.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
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
    throw new Error(`${label}: expected status ${expected}, got ${response.status}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertNotIncludes(value, fragment, label) {
  if (value.includes(fragment)) {
    throw new Error(`${label}: unexpected ${JSON.stringify(fragment)}`);
  }
}
