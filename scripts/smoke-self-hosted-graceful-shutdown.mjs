#!/usr/bin/env node
import { spawn } from "node:child_process";
import net from "node:net";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const apiEntry = path.join(repoRoot, "apps/api/dist/index.js");

const port = await getFreePort();
const storageRoot = path.join(repoRoot, ".data", "graceful-shutdown-smoke");
await rm(storageRoot, { recursive: true, force: true });
await mkdir(storageRoot, { recursive: true });

const child = spawn(process.execPath, [apiEntry], {
  cwd: repoRoot,
  env: {
    ...process.env,
    NODE_ENV: "test",
    YORSO_API_HOST: "127.0.0.1",
    YORSO_API_PORT: String(port),
    YORSO_PUBLIC_APP_URL: "http://localhost:8080",
    ACCOUNT_REPOSITORY: "memory",
    AUTH_RATE_LIMIT_DRIVER: "memory",
    AUTH_RATE_LIMIT_FAIL_MODE: "closed",
    AUTH_SESSION_CACHE_DRIVER: "memory",
    AUTH_SESSION_CACHE_FAIL_MODE: "closed",
    AUTH_OBSERVABILITY_DRIVER: "disabled",
    HEALTH_READINESS_TIMEOUT_MS: "250",
    YORSO_SHUTDOWN_DRAIN_DELAY_MS: "1500",
    YORSO_SHUTDOWN_GRACE_TIMEOUT_MS: "4000",
    STORAGE_DRIVER: "local",
    STORAGE_LOCAL_ROOT: storageRoot,
    S3_ENDPOINT: "http://localhost:9000",
    S3_BUCKET: "yorso-local",
    YORSO_SESSION_SECRET: "change-me-32-bytes-minimum",
    YORSO_JWT_SECRET: "change-me-32-bytes-minimum",
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

  const readyBefore = await fetch(`${baseUrl}/health/ready`);
  assertStatus(readyBefore, 200, "ready before signal");
  const readyBeforeBody = await readyBefore.json();
  assertEqual(readyBeforeBody.dependencies?.shutdownDrain?.status, "ok", "shutdown drain ready");
  console.log("graceful_shutdown_ready_before_signal=ok");

  child.kill("SIGTERM");

  const drainingReady = await waitForDrainingReady(baseUrl, child);
  assertEqual(drainingReady.status, "not_ready", "draining ready status");
  assertEqual(drainingReady.dependencies?.shutdownDrain?.status, "unavailable", "shutdown drain unavailable");
  assertEqual(drainingReady.dependencies?.shutdownDrain?.reason, "server_draining", "shutdown drain reason");
  console.log("graceful_shutdown_readiness_draining=ok");

  const liveDuringDrain = await fetch(`${baseUrl}/v1/health/live`);
  assertStatus(liveDuringDrain, 200, "live during drain");
  console.log("graceful_shutdown_live_during_drain=ok");

  const workDuringDrain = await fetch(`${baseUrl}/v1/account/company/schema`);
  assertStatus(workDuringDrain, 503, "work during drain");
  const workBody = await workDuringDrain.json();
  assertEqual(workBody.error?.code, "server_draining", "work during drain error");
  console.log("graceful_shutdown_rejects_new_work=ok");

  const exitCode = await waitForExit(child, 8_000);
  assertEqual(exitCode, 0, "process exit code");
  console.log("graceful_shutdown_process_exit=ok");
  console.log("self_hosted_graceful_shutdown_smoke=ok");
} catch (error) {
  child.kill("SIGKILL");
  throw new Error([
    `Graceful shutdown smoke failed: ${error instanceof Error ? error.message : String(error)}`,
    stdout ? `stdout:\n${stdout}` : "",
    stderr ? `stderr:\n${stderr}` : "",
  ].filter(Boolean).join("\n"));
} finally {
  await waitForExit(child, 1_000).catch(() => undefined);
  await rm(storageRoot, { recursive: true, force: true });
}

async function waitForLive(baseUrl, processHandle) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`API process exited before live check. code=${processHandle.exitCode}`);
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

async function waitForDrainingReady(baseUrl, processHandle) {
  const deadline = Date.now() + 1_200;
  let lastError = "";
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`API process exited before draining readiness check. code=${processHandle.exitCode}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health/ready`);
      const body = await response.json();
      if (response.status === 503 && body.dependencies?.shutdownDrain?.reason === "server_draining") {
        return body;
      }
      lastError = `status=${response.status} body=${JSON.stringify(body)}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(50);
  }
  throw new Error(`Timed out waiting for draining readiness. Last=${lastError}`);
}

async function waitForExit(processHandle, timeoutMs) {
  if (processHandle.exitCode !== null) return processHandle.exitCode;
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for process exit after ${timeoutMs}ms`));
    }, timeoutMs);
    processHandle.once("exit", (code) => {
      clearTimeout(timeout);
      resolve(code);
    });
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
      const { port: freePort } = address;
      server.close(() => resolve(freePort));
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
