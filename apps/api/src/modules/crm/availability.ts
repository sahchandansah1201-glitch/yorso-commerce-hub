export interface CrmAvailabilityCheckOptions {
  forceRefresh?: boolean;
}

export type CrmAvailabilityChecker = (
  crmUrl: string,
  options?: CrmAvailabilityCheckOptions,
) => Promise<boolean>;

interface CrmAvailabilityOptions {
  timeoutMs: number;
  cacheTtlMs: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

interface CachedAvailability {
  available: boolean;
  expiresAt: number;
}

export function createCrmAvailabilityChecker(
  options: CrmAvailabilityOptions,
): CrmAvailabilityChecker {
  const cache = new Map<string, CachedAvailability>();
  const inFlight = new Map<string, Promise<boolean>>();
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;

  return async (crmUrl, checkOptions = {}) => {
    if (!checkOptions.forceRefresh) {
      const cached = cache.get(crmUrl);
      if (cached && cached.expiresAt > now()) return cached.available;
    }

    const currentCheck = inFlight.get(crmUrl);
    if (currentCheck) return currentCheck;

    const check = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

      try {
        const healthUrl = new URL("/healthz", crmUrl);
        const response = await fetchImpl(healthUrl, {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });
        const available = response.ok;
        cache.set(crmUrl, {
          available,
          expiresAt: now() + options.cacheTtlMs,
        });
        return available;
      } catch {
        cache.set(crmUrl, {
          available: false,
          expiresAt: now() + options.cacheTtlMs,
        });
        return false;
      } finally {
        clearTimeout(timeout);
      }
    })();

    inFlight.set(crmUrl, check);
    try {
      return await check;
    } finally {
      inFlight.delete(crmUrl);
    }
  };
}
