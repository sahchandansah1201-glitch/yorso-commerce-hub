import { describe, expect, it } from "vitest";
import { loadApiConfig } from "../../config.js";
import { InMemoryPrometheusMetricsRegistry, NoopMetricsRegistry } from "../../metrics.js";
import { createPasswordRecoveryCleanupRuntime } from "./password-recovery-cleanup-runtime.js";
import { MemoryAuthRepository } from "./repository.js";

describe("password recovery cleanup runtime factory", () => {
  it("keeps the cleanup worker disabled unless explicitly configured", () => {
    const config = loadApiConfig({ NODE_ENV: "test" }, { allowLocalDefaults: true });

    const runtime = createPasswordRecoveryCleanupRuntime(
      config,
      new MemoryAuthRepository(),
      new NoopMetricsRegistry(),
    );

    expect(runtime).toBeNull();
  });

  it("creates a bounded cleanup scheduler when enabled", async () => {
    const config = loadApiConfig({
      NODE_ENV: "test",
      YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ENABLED: "true",
      YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_INTERVAL_MS: "60000",
      YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_BATCH_SIZE: "7",
      YORSO_PASSWORD_RECOVERY_CLEANUP_DELIVERY_RETENTION_MS: "604800000",
      YORSO_PASSWORD_RECOVERY_CLEANUP_TOKEN_RETENTION_MS: "86400000",
      YORSO_PASSWORD_RECOVERY_CLEANUP_WORKER_ID: "password-recovery-cleanup-runtime-test",
    }, { allowLocalDefaults: true });
    const metrics = new InMemoryPrometheusMetricsRegistry();

    const runtime = createPasswordRecoveryCleanupRuntime(
      config,
      new MemoryAuthRepository(),
      metrics,
    );

    expect(runtime?.snapshot()).toMatchObject({
      intervalMs: 60_000,
      started: false,
      workerId: "password-recovery-cleanup-runtime-test",
    });
    await expect(runtime?.runOnce()).resolves.toMatchObject({
      deliveriesDeleted: 0,
      limit: 7,
      outcome: "success",
      recoveriesDeleted: 0,
    });
    expect(metrics.renderPrometheusText()).toContain(
      'yorso_api_password_recovery_cleanup_worker_runs_total{outcome="success",reason="none",worker_id="password-recovery-cleanup-runtime-test"} 1',
    );
  });
});
