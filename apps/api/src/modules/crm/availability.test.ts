import { describe, expect, it, vi } from "vitest";
import { createCrmAvailabilityChecker } from "./availability.js";

describe("createCrmAvailabilityChecker", () => {
  it("caches a successful health response until the TTL expires", async () => {
    let now = 1_000;
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }));
    const check = createCrmAvailabilityChecker({
      cacheTtlMs: 5_000,
      fetchImpl,
      now: () => now,
      timeoutMs: 100,
    });

    await expect(check("http://127.0.0.1:3020")).resolves.toBe(true);
    await expect(check("http://127.0.0.1:3020")).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    now = 6_001;
    await expect(check("http://127.0.0.1:3020")).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("caches an unavailable response", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 503 }));
    const check = createCrmAvailabilityChecker({
      cacheTtlMs: 5_000,
      fetchImpl,
      timeoutMs: 100,
    });

    await expect(check("http://127.0.0.1:3020")).resolves.toBe(false);
    await expect(check("http://127.0.0.1:3020")).resolves.toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("bypasses an unavailable cache entry for an explicit refresh", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const check = createCrmAvailabilityChecker({
      cacheTtlMs: 5_000,
      fetchImpl,
      timeoutMs: 100,
    });

    await expect(check("http://127.0.0.1:3020")).resolves.toBe(false);
    await expect(check("http://127.0.0.1:3020")).resolves.toBe(false);
    await expect(check("http://127.0.0.1:3020", { forceRefresh: true })).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent health probes", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const fetchImpl = vi.fn(() => new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    }));
    const check = createCrmAvailabilityChecker({
      cacheTtlMs: 5_000,
      fetchImpl,
      timeoutMs: 100,
    });

    const first = check("http://127.0.0.1:3020");
    const second = check("http://127.0.0.1:3020");
    resolveFetch?.(new Response(null, { status: 200 }));

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("returns unavailable when the probe times out", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_url: URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    const check = createCrmAvailabilityChecker({
      cacheTtlMs: 5_000,
      fetchImpl,
      timeoutMs: 100,
    });

    const result = check("http://127.0.0.1:3020");
    await vi.advanceTimersByTimeAsync(100);
    await expect(result).resolves.toBe(false);
    vi.useRealTimers();
  });
});
