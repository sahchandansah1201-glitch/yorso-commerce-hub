import { describe, expect, it } from "vitest";
import { loadApiConfig } from "../../config.js";
import { InMemoryPrometheusMetricsRegistry, NoopMetricsRegistry } from "../../metrics.js";
import { createRegistrationDeliveryRuntime } from "./delivery-runtime.js";
import { MemoryAuthRepository } from "./repository.js";

describe("registration delivery runtime factory", () => {
  it("keeps the worker disabled unless explicitly configured", () => {
    const config = loadApiConfig({ NODE_ENV: "test" }, { allowLocalDefaults: true });

    const runtime = createRegistrationDeliveryRuntime(
      config,
      new MemoryAuthRepository(),
      new NoopMetricsRegistry(),
    );

    expect(runtime).toBeNull();
  });

  it("creates a file-spool backed scheduler when enabled", async () => {
    const config = loadApiConfig({
      NODE_ENV: "test",
      YORSO_REGISTRATION_DELIVERY_WORKER_ENABLED: "true",
      YORSO_REGISTRATION_DELIVERY_SENDER: "file_spool",
      YORSO_REGISTRATION_DELIVERY_SPOOL_DIR: ".data/test-registration-delivery",
      YORSO_REGISTRATION_DELIVERY_WORKER_BATCH_SIZE: "7",
      YORSO_REGISTRATION_DELIVERY_WORKER_ID: "worker-runtime-test",
    }, { allowLocalDefaults: true });
    const metrics = new InMemoryPrometheusMetricsRegistry();

    const runtime = createRegistrationDeliveryRuntime(
      config,
      new MemoryAuthRepository(),
      metrics,
      {
        sender: {
          async send() {
            throw new Error("No jobs should be sent in this factory test.");
          },
        },
      },
    );

    expect(runtime?.snapshot()).toMatchObject({
      intervalMs: 5_000,
      started: false,
      workerId: "worker-runtime-test",
    });
    await expect(runtime?.runOnce()).resolves.toMatchObject({
      leased: 0,
      outcome: "success",
    });
    expect(metrics.renderPrometheusText()).toContain(
      'yorso_api_registration_delivery_worker_runs_total{outcome="success",reason="none",worker_id="worker-runtime-test"} 1',
    );
  });
});
