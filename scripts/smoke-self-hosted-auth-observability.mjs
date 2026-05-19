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
    AUTH_RATE_LIMIT_DRIVER: "audit_log",
    AUTH_RATE_LIMIT_FAIL_MODE: "open",
    AUTH_SESSION_CACHE_DRIVER: "memory",
    AUTH_SESSION_CACHE_FAIL_MODE: "closed",
    AUTH_SESSION_CACHE_TTL_MS: "300000",
    AUTH_SESSION_CACHE_KEY_PREFIX: "yorso:auth-observability",
    AUTH_OBSERVABILITY_DRIVER: "console",
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
  console.log("self_hosted_auth_observability_smoke=ok");
} catch (error) {
  console.error("self_hosted_auth_observability_smoke=failed");
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
  const failedSignIn = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "wrong@example.com",
      password: "bad-password",
    }),
  });
  assertStatus(failedSignIn, 401, "failed sign-in");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const warmup = await fetch(`${baseUrl}/v1/auth/sign-in`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "limited@example.com",
        password: "bad-password",
      }),
    });
    assertStatus(warmup, 401, `rate-limit warmup ${attempt + 1}`);
  }
  const limited = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "limited@example.com",
      password: "bad-password",
    }),
  });
  assertStatus(limited, 429, "rate-limited sign-in");

  const signIn = await jsonRequest(baseUrl, "/v1/auth/sign-in", {
    method: "POST",
    body: {
      email: "buyer@example.com",
      password: "Password1",
    },
  });
  assertString(signIn.session?.id, "sign-in session id");

  const signOut = await jsonRequest(baseUrl, "/v1/auth/sign-out", {
    method: "POST",
    headers: {
      "x-yorso-session-id": signIn.session.id,
    },
  });
  assertEqual(signOut.signedOut, true, "sign-out result");

  const invalidSession = await fetch(`${baseUrl}/v1/auth/session`, {
    headers: {
      "x-yorso-session-id": signIn.session.id,
    },
  });
  assertStatus(invalidSession, 401, "invalid session after sign-out");

  await delay(100);
  const events = authTelemetryEvents();
  assertEvent(events, "auth.sign_in.failed");
  console.log("auth_observability_sign_in_failed=ok");
  assertEvent(events, "auth.sign_in.rate_limited");
  console.log("auth_observability_rate_limited=ok");
  assertEvent(events, "auth.sign_in.succeeded");
  console.log("auth_observability_sign_in_succeeded=ok");
  assertEvent(events, "auth.sign_out.succeeded");
  console.log("auth_observability_sign_out_succeeded=ok");
  assertEvent(events, "auth.session.invalid");
  console.log("auth_observability_session_invalid=ok");

  const serialized = JSON.stringify(events);
  for (const forbidden of [
    "buyer@example.com",
    "limited@example.com",
    "wrong@example.com",
    signIn.session.id,
    signIn.session.userId,
  ]) {
    assertNotIncludes(serialized, forbidden, `auth telemetry PII guard for ${forbidden}`);
  }
  console.log("auth_observability_no_pii=ok");
}

function authTelemetryEvents() {
  return childLogs.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{") && line.includes("\"auth_runtime_event\""))
    .map((line) => JSON.parse(line))
    .filter((event) => event.type === "auth_runtime_event");
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

function assertEvent(events, eventName) {
  if (!events.some((event) => event.event === eventName && event.schemaVersion === 1 && event.requestId)) {
    throw new Error(`Missing auth telemetry event ${eventName}`);
  }
}

function assertNotIncludes(value, expectedMissing, label) {
  if (value.includes(expectedMissing)) {
    throw new Error(`${label}: expected not to include ${JSON.stringify(expectedMissing)}`);
  }
}
