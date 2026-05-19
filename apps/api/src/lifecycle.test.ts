import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { ApiLifecycle, shutdownApiServer } from "./lifecycle.js";

describe("API lifecycle drain", () => {
  it("tracks active requests and resolves idle waiters", async () => {
    const lifecycle = new ApiLifecycle();

    lifecycle.beginRequest();
    expect(lifecycle.snapshot()).toMatchObject({
      activeRequests: 1,
      draining: false,
    });

    const idle = lifecycle.waitForIdle(500);
    lifecycle.endRequest();

    await expect(idle).resolves.toMatchObject({
      idle: true,
      snapshot: { activeRequests: 0 },
    });
  });

  it("marks draining state when shutdown starts", async () => {
    const lifecycle = new ApiLifecycle();
    const server = createServer((_request, response) => {
      response.end("ok");
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

    const result = await shutdownApiServer({
      server,
      lifecycle,
      signal: "SIGTERM",
      drainDelayMs: 0,
      graceTimeoutMs: 1_000,
      logger: { log: () => undefined, error: () => undefined },
    });

    expect(result).toMatchObject({
      signal: "SIGTERM",
      closed: true,
      idle: true,
      forced: false,
      snapshot: {
        draining: true,
        activeRequests: 0,
        drainSignal: "SIGTERM",
      },
    });
  });
});
