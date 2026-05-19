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
  console.log("self_hosted_auth_api_smoke=ok");
} catch (error) {
  console.error("self_hosted_auth_api_smoke=failed");
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
  const signIn = await jsonRequest(baseUrl, "/v1/auth/sign-in", {
    method: "POST",
    body: {
      email: "buyer@example.com",
      password: "Password1",
    },
  });
  assertEqual(signIn.ok, true, "sign-in ok");
  assertEqual(signIn.session?.userId, "00000000-0000-4000-8000-000000000001", "sign-in user id");
  assertEqual(signIn.session?.email, "buyer@example.com", "sign-in email");
  assertString(signIn.session?.id, "sign-in session id");
  console.log("auth_sign_in=ok");

  const session = await jsonRequest(baseUrl, "/v1/auth/session", {
    headers: {
      "x-yorso-session-id": signIn.session.id,
    },
  });
  assertEqual(session.session?.id, signIn.session.id, "session id");
  assertEqual(session.session?.displayName, "Demo Buyer", "session display name");
  console.log("auth_session=ok");

  const invalidCredentials = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "buyer@example.com",
      password: "wrong-password",
    }),
  });
  assertStatus(invalidCredentials, 401, "invalid credentials guard");
  const invalidCredentialsBody = await invalidCredentials.json();
  assertEqual(invalidCredentialsBody.error?.code, "auth_invalid_credentials", "invalid credentials code");
  console.log("auth_invalid_credentials_guard=ok");

  const invalidPayload = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "bad", password: "short" }),
  });
  assertStatus(invalidPayload, 400, "auth validation guard");
  const invalidPayloadBody = await invalidPayload.json();
  assertEqual(invalidPayloadBody.error?.code, "validation_error", "auth validation code");
  console.log("auth_validation_guard=ok");

  const signOut = await jsonRequest(baseUrl, "/v1/auth/sign-out", {
    method: "POST",
    headers: {
      "x-yorso-session-id": signIn.session.id,
    },
  });
  assertEqual(signOut.signedOut, true, "sign-out result");
  console.log("auth_sign_out=ok");

  const afterSignOut = await fetch(`${baseUrl}/v1/auth/session`, {
    headers: {
      "x-yorso-session-id": signIn.session.id,
    },
  });
  assertStatus(afterSignOut, 401, "post sign-out session guard");
  const afterSignOutBody = await afterSignOut.json();
  assertEqual(afterSignOutBody.error?.code, "auth_session_invalid", "post sign-out session code");
  console.log("auth_sign_out_revokes_session=ok");

  const revokedHeaders = {
    "x-yorso-user-id": signIn.session.userId,
    "x-yorso-session-id": signIn.session.id,
  };

  const accountAfterSignOut = await fetch(`${baseUrl}/v1/account/me`, {
    headers: revokedHeaders,
  });
  assertStatus(accountAfterSignOut, 401, "revoked session account guard");
  const accountAfterSignOutBody = await accountAfterSignOut.json();
  assertEqual(accountAfterSignOutBody.error?.code, "account_session_invalid", "revoked session account code");
  console.log("auth_sign_out_blocks_account=ok");

  const notificationsAfterSignOut = await fetch(`${baseUrl}/v1/access/notifications`, {
    headers: revokedHeaders,
  });
  assertStatus(notificationsAfterSignOut, 401, "revoked session access notification guard");
  const notificationsAfterSignOutBody = await notificationsAfterSignOut.json();
  assertEqual(notificationsAfterSignOutBody.error?.code, "account_session_invalid", "revoked session access code");
  console.log("auth_sign_out_blocks_access=ok");

  const authenticatedCatalogAfterSignOut = await fetch(
    `${baseUrl}/v1/offers?q=salmon&accessLevel=qualified_unlocked`,
    { headers: revokedHeaders },
  );
  assertStatus(authenticatedCatalogAfterSignOut, 401, "revoked session offer catalog guard");
  const authenticatedCatalogAfterSignOutBody = await authenticatedCatalogAfterSignOut.json();
  assertEqual(
    authenticatedCatalogAfterSignOutBody.error?.code,
    "account_session_invalid",
    "revoked session offer catalog code",
  );
  console.log("auth_sign_out_blocks_offer_unlock=ok");

  const publicCatalogWithoutSession = await jsonRequest(
    baseUrl,
    "/v1/offers?q=salmon&accessLevel=qualified_unlocked",
  );
  assertEqual(publicCatalogWithoutSession.offers?.[0]?.priceMin, null, "public catalog price remains locked");
  assertEqual(publicCatalogWithoutSession.offers?.[0]?.supplier?.name, null, "public catalog supplier remains locked");
  assertNotIncludes(JSON.stringify(publicCatalogWithoutSession), "Nordfjord Sjømat AS", "public catalog supplier leak");
  assertNotIncludes(JSON.stringify(publicCatalogWithoutSession), "$8.50", "public catalog price leak");
  console.log("auth_sign_out_preserves_public_catalog=ok");
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
    throw new Error(`${label}: expected HTTP ${expected}, got ${response.status}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertString(value, label) {
  if (typeof value !== "string" || value.length < 32) {
    throw new Error(`${label}: expected a session-like string`);
  }
}

function assertNotIncludes(value, expectedMissing, label) {
  if (value.includes(expectedMissing)) {
    throw new Error(`${label}: expected not to include ${JSON.stringify(expectedMissing)}`);
  }
}
