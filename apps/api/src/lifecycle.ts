import type { Server } from "node:http";

export interface ApiLifecycleSnapshot {
  draining: boolean;
  drainSignal: string | null;
  drainStartedAt: string | null;
  activeRequests: number;
}

export class ApiLifecycle {
  private draining = false;
  private drainSignal: string | null = null;
  private drainStartedAt: Date | null = null;
  private activeRequests = 0;
  private readonly idleResolvers = new Set<() => void>();

  isDraining() {
    return this.draining;
  }

  startDraining(signal: string) {
    if (this.draining) return this.snapshot();
    this.draining = true;
    this.drainSignal = signal;
    this.drainStartedAt = new Date();
    if (this.activeRequests === 0) this.resolveIdle();
    return this.snapshot();
  }

  beginRequest() {
    this.activeRequests += 1;
  }

  endRequest() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) this.resolveIdle();
  }

  snapshot(): ApiLifecycleSnapshot {
    return {
      draining: this.draining,
      drainSignal: this.drainSignal,
      drainStartedAt: this.drainStartedAt?.toISOString() ?? null,
      activeRequests: this.activeRequests,
    };
  }

  async waitForIdle(timeoutMs: number) {
    if (this.activeRequests === 0) return { idle: true, snapshot: this.snapshot() };

    return new Promise<{ idle: boolean; snapshot: ApiLifecycleSnapshot }>((resolve) => {
      let done = false;
      const finish = (idle: boolean) => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        this.idleResolvers.delete(onIdle);
        resolve({ idle, snapshot: this.snapshot() });
      };
      const onIdle = () => finish(true);
      const timeout = setTimeout(() => finish(false), timeoutMs);
      this.idleResolvers.add(onIdle);
    });
  }

  private resolveIdle() {
    for (const resolve of this.idleResolvers) resolve();
    this.idleResolvers.clear();
  }
}

export interface ShutdownResult {
  signal: string;
  closed: boolean;
  idle: boolean;
  forced: boolean;
  snapshot: ApiLifecycleSnapshot;
}

export interface ShutdownApiServerOptions {
  server: Server;
  lifecycle: ApiLifecycle;
  signal: string;
  drainDelayMs: number;
  graceTimeoutMs: number;
  logger?: Pick<Console, "log" | "error">;
}

export async function shutdownApiServer(options: ShutdownApiServerOptions): Promise<ShutdownResult> {
  const logger = options.logger ?? console;
  const snapshot = options.lifecycle.startDraining(options.signal);
  logger.log("YORSO API drain started", JSON.stringify({
    signal: options.signal,
    activeRequests: snapshot.activeRequests,
    drainDelayMs: options.drainDelayMs,
    graceTimeoutMs: options.graceTimeoutMs,
  }));

  await sleep(options.drainDelayMs);
  const closePromise = closeServer(options.server);
  const idle = await options.lifecycle.waitForIdle(options.graceTimeoutMs);
  const closed = await withTimeout(closePromise, options.graceTimeoutMs).catch((error) => {
    logger.error("YORSO API server close timed out", error);
    return false;
  });

  const forced = !idle.idle || !closed;
  if (forced) {
    options.server.closeAllConnections?.();
  } else {
    options.server.closeIdleConnections?.();
  }

  const result = {
    signal: options.signal,
    closed,
    idle: idle.idle,
    forced,
    snapshot: options.lifecycle.snapshot(),
  };
  logger.log("YORSO API drain completed", JSON.stringify(result));
  return result;
}

function closeServer(server: Server) {
  return new Promise<boolean>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve(true);
    });
  });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("server_close_timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
