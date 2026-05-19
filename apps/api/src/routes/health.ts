import { access, mkdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import type { ServerResponse } from "node:http";
import { Client } from "pg";
import { createClient } from "redis";
import { assertSelfHostedProductionRuntime, type ApiConfig } from "../config.js";
import type { ApiRequestContext } from "../http.js";
import { sendJson } from "../http.js";

export function handleLive(response: ServerResponse, context: ApiRequestContext) {
  sendJson(response, 200, {
    ok: true,
    service: "yorso-api",
    status: "live",
    requestId: context.requestId,
  });
}

export interface HealthDependencyResult {
  required: boolean;
  status: "ok" | "skipped" | "unavailable";
  latencyMs?: number;
  reason?: string;
  details?: Record<string, unknown>;
}

export interface ReadinessReport {
  ok: boolean;
  service: "yorso-api";
  status: "ready" | "not_ready";
  selfHostedBackend: true;
  supabaseProductionBackend: false;
  productionScaleBaseline: {
    targetConcurrentUsers: 10_000;
    readinessChecks: ["postgres", "redis", "local_storage", "production_runtime_config"];
  };
  dependencies: {
    postgres: HealthDependencyResult;
    redis: HealthDependencyResult;
    localStorage: HealthDependencyResult;
    productionRuntimeConfig: HealthDependencyResult;
  };
}

export interface ReadinessProbe {
  check(): Promise<ReadinessReport>;
}

export interface ReadinessProbeOptions {
  timeoutMs?: number;
}

export class SelfHostedReadinessProbe implements ReadinessProbe {
  private readonly timeoutMs: number;

  constructor(
    private readonly config: ApiConfig,
    options: ReadinessProbeOptions = {},
  ) {
    this.timeoutMs = options.timeoutMs ?? 750;
  }

  async check(): Promise<ReadinessReport> {
    const [postgres, redis, localStorage, productionRuntimeConfig] = await Promise.all([
      checkPostgres(this.config, this.timeoutMs),
      checkRedis(this.config, this.timeoutMs),
      checkLocalStorage(this.config, this.timeoutMs),
      checkProductionRuntimeConfig(this.config),
    ]);

    const dependencies = { postgres, redis, localStorage, productionRuntimeConfig };
    const ok = Object.values(dependencies).every((dependency) => (
      !dependency.required || dependency.status === "ok"
    ));

    return {
      ok,
      service: "yorso-api",
      status: ok ? "ready" : "not_ready",
      selfHostedBackend: true,
      supabaseProductionBackend: false,
      productionScaleBaseline: {
        targetConcurrentUsers: 10_000,
        readinessChecks: ["postgres", "redis", "local_storage", "production_runtime_config"],
      },
      dependencies,
    };
  }
}

export function createReadinessProbe(config: ApiConfig, options?: ReadinessProbeOptions): ReadinessProbe {
  return new SelfHostedReadinessProbe(config, options);
}

export async function handleReady(
  response: ServerResponse,
  context: ApiRequestContext,
  readinessProbe: ReadinessProbe,
) {
  const report = await readinessProbe.check();
  sendJson(response, report.ok ? 200 : 503, {
    ...report,
    service: "yorso-api",
    requestId: context.requestId,
  });
}

async function checkPostgres(config: ApiConfig, timeoutMs: number): Promise<HealthDependencyResult> {
  if (config.accountRepository !== "postgres") {
    return {
      required: false,
      status: "skipped",
      details: { repository: config.accountRepository },
    };
  }

  const startedAt = Date.now();
  const client = new Client({
    connectionString: config.databaseUrl,
    application_name: "yorso-api-readiness",
    statement_timeout: timeoutMs,
    connectionTimeoutMillis: timeoutMs,
  });

  try {
    await withTimeout((async () => {
      await client.connect();
      await client.query("select 1 as ok");
    })(), timeoutMs, "postgres_timeout");

    return {
      required: true,
      status: "ok",
      latencyMs: Date.now() - startedAt,
      details: { repository: "postgres" },
    };
  } catch (error) {
    return {
      required: true,
      status: "unavailable",
      latencyMs: Date.now() - startedAt,
      reason: errorMessage(error),
      details: { repository: "postgres" },
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function checkRedis(config: ApiConfig, timeoutMs: number): Promise<HealthDependencyResult> {
  const required = config.authRateLimitDriver === "redis" || config.authSessionCacheDriver === "redis";
  if (!required) {
    return {
      required: false,
      status: "skipped",
      details: {
        rateLimitDriver: config.authRateLimitDriver,
        sessionCacheDriver: config.authSessionCacheDriver,
      },
    };
  }

  const startedAt = Date.now();
  const client = createClient({
    url: config.redisUrl,
    socket: {
      connectTimeout: timeoutMs,
      reconnectStrategy: false,
    },
  });

  client.on("error", () => undefined);

  try {
    await withTimeout((async () => {
      await client.connect();
      await client.ping();
    })(), timeoutMs, "redis_timeout");

    return {
      required: true,
      status: "ok",
      latencyMs: Date.now() - startedAt,
      details: {
        rateLimitDriver: config.authRateLimitDriver,
        sessionCacheDriver: config.authSessionCacheDriver,
      },
    };
  } catch (error) {
    return {
      required: true,
      status: "unavailable",
      latencyMs: Date.now() - startedAt,
      reason: errorMessage(error),
      details: {
        rateLimitDriver: config.authRateLimitDriver,
        sessionCacheDriver: config.authSessionCacheDriver,
      },
    };
  } finally {
    await closeRedis(client);
  }
}

async function checkLocalStorage(config: ApiConfig, timeoutMs: number): Promise<HealthDependencyResult> {
  const startedAt = Date.now();

  try {
    await withTimeout((async () => {
      await mkdir(config.storageLocalRoot, { recursive: true });
      await access(config.storageLocalRoot, fsConstants.W_OK);
    })(), timeoutMs, "local_storage_timeout");

    return {
      required: true,
      status: "ok",
      latencyMs: Date.now() - startedAt,
      details: {
        driver: config.storageDriver,
        rootConfigured: Boolean(config.storageLocalRoot),
      },
    };
  } catch (error) {
    return {
      required: true,
      status: "unavailable",
      latencyMs: Date.now() - startedAt,
      reason: errorMessage(error),
      details: {
        driver: config.storageDriver,
        rootConfigured: Boolean(config.storageLocalRoot),
      },
    };
  }
}

async function checkProductionRuntimeConfig(config: ApiConfig): Promise<HealthDependencyResult> {
  if (config.nodeEnv !== "production") {
    return {
      required: false,
      status: "skipped",
      details: { nodeEnv: config.nodeEnv },
    };
  }

  try {
    assertSelfHostedProductionRuntime(config);
    return {
      required: true,
      status: "ok",
      details: { nodeEnv: "production" },
    };
  } catch (error) {
    return {
      required: true,
      status: "unavailable",
      reason: errorMessage(error),
      details: { nodeEnv: "production" },
    };
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function closeRedis(client: ReturnType<typeof createClient>) {
  try {
    await client.close();
  } catch {
    try {
      client.destroy();
    } catch {
      // The client may already be closed after a failed connection attempt.
    }
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
