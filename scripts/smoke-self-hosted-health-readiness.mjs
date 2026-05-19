#!/usr/bin/env node
import { spawn } from "node:child_process";
import net from "node:net";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const apiEntry = path.join(repoRoot, "apps/api/dist/index.js");

const scenarios = [
  {
    name: "local",
    marker: "health_readiness_local=ok",
    env: {
      ACCOUNT_REPOSITORY: "memory",
      AUTH_RATE_LIMIT_DRIVER: "memory",
      AUTH_RATE_LIMIT_FAIL_MODE: "closed",
      AUTH_SESSION_CACHE_DRIVER: "memory",
      AUTH_SESSION_CACHE_FAIL_MODE: "closed",
    },
    assert: async (baseUrl) => {
      const live = await fetch(`${baseUrl}/health/live`);
      assertStatus(live, 200, "local live");
      const ready = await fetch(`${baseUrl}/health/ready`);
      assertStatus(ready, 200, "local ready");
      const body = await ready.json();
      assertEqual(body.ok, true, "local ready ok");
      assertEqual(body.status, "ready", "local ready status");
      assertEqual(body.productionScaleBaseline?.targetConcurrentUsers, 10_000, "local baseline target");
      assertEqual(body.dependencies?.postgres?.status, "skipped", "local postgres skipped");
      assertEqual(body.dependencies?.redis?.status, "skipped", "local redis skipped");
      assertEqual(body.dependencies?.localStorage?.status, "ok", "local storage ok");
    },
  },
  {
    name: "redis-unavailable",
    marker: "health_readiness_redis_unavailable=ok",
    env: async () => ({
      ACCOUNT_REPOSITORY: "memory",
      AUTH_RATE_LIMIT_DRIVER: "redis",
      AUTH_RATE_LIMIT_FAIL_MODE: "closed",
      AUTH_SESSION_CACHE_DRIVER: "redis",
      AUTH_SESSION_CACHE_FAIL_MODE: "closed",
      REDIS_URL: `redis://127.0.0.1:${await getFreePort()}`,
    }),
    assert: async (baseUrl) => {
      const live = await fetch(`${baseUrl}/v1/health/live`);
      assertStatus(live, 200, "redis unavailable live");
      const ready = await fetch(`${baseUrl}/v1/health/ready`);
      assertStatus(ready, 503, "redis unavailable ready");
      const body = await ready.json();
      assertEqual(body.ok, false, "redis unavailable ready ok");
      assertEqual(body.status, "not_ready", "redis unavailable ready status");
      assertEqual(body.dependencies?.redis?.required, true, "redis required");
      assertEqual(body.dependencies?.redis?.status, "unavailable", "redis unavailable");
    },
  },
  {
    name: "postgres-unavailable",
    marker: "health_readiness_postgres_unavailable=ok",
    env: async () => ({
      ACCOUNT_REPOSITORY: "postgres",
      DATABASE_URL: `postgres://yorso_app:change-me-local-only@127.0.0.1:${await getFreePort()}/yorso`,
      AUTH_RATE_LIMIT_DRIVER: "memory",
      AUTH_RATE_LIMIT_FAIL_MODE: "closed",
      AUTH_SESSION_CACHE_DRIVER: "memory",
      AUTH_SESSION_CACHE_FAIL_MODE: "closed",
    }),
    assert: async (baseUrl) => {
      const ready = await fetch(`${baseUrl}/health/ready`);
      assertStatus(ready, 503, "postgres unavailable ready");
      const body = await ready.json();
      assertEqual(body.dependencies?.postgres?.required, true, "postgres required");
      assertEqual(body.dependencies?.postgres?.status, "unavailable", "postgres unavailable");
      assertEqual(body.dependencies?.redis?.status, "skipped", "postgres scenario redis skipped");
    },
  },
];

for (const scenario of scenarios) {
  await runScenario(scenario);
  console.log(scenario.marker);
}

console.log("self_hosted_health_readiness_smoke=ok");

async function runScenario(scenario) {
  const port = await getFreePort();
  const storageRoot = path.join(repoRoot, ".data", "health-smoke", scenario.name);
  await rm(storageRoot, { recursive: true, force: true });
  await mkdir(storageRoot, { recursive: true });

  const scenarioEnv = typeof scenario.env === "function" ? await scenario.env() : scenario.env;
  const child = spawn(process.execPath, [apiEntry], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: "test",
      YORSO_API_HOST: "127.0.0.1",
      YORSO_API_PORT: String(port),
      YORSO_PUBLIC_APP_URL: "http://localhost:8080",
      HEALTH_READINESS_TIMEOUT_MS: "250",
      AUTH_OBSERVABILITY_DRIVER: "disabled",
      STORAGE_DRIVER: "local",
      STORAGE_LOCAL_ROOT: storageRoot,
      S3_ENDPOINT: "http://localhost:9000",
      S3_BUCKET: "yorso-local",
      YORSO_SESSION_SECRET: "change-me-32-bytes-minimum",
      YORSO_JWT_SECRET: "change-me-32-bytes-minimum",
      ...scenarioEnv,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForLive(baseUrl, child);
    await scenario.assert(baseUrl);
    const invalidMethod = await fetch(`${baseUrl}/health/ready`, { method: "POST" });
    assertStatus(invalidMethod, 405, `${scenario.name} method guard`);
  } catch (error) {
    throw new Error([
      `Scenario ${scenario.name} failed: ${error instanceof Error ? error.message : String(error)}`,
      stdout ? `stdout:\n${stdout}` : "",
      stderr ? `stderr:\n${stderr}` : "",
    ].filter(Boolean).join("\n"));
  } finally {
    child.kill("SIGTERM");
    await waitForExit(child);
    await rm(storageRoot, { recursive: true, force: true });
  }
}

async function waitForLive(baseUrl, child) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`API process exited before live check. code=${child.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health/live`);
      if (response.status === 200) return;
    } catch {
      // Retry until the process starts accepting connections.
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${baseUrl}/health/live`);
}

async function waitForExit(child) {
  if (child.exitCode !== null) return;
  await new Promise((resolve) => {
    child.once("exit", resolve);
    setTimeout(resolve, 1_000);
  });
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Expected TCP address object.")));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

function assertStatus(response, expected, label) {
  if (response.status !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${response.status}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
