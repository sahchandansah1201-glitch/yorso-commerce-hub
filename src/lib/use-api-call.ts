/**
 * useApiCall — thin wrapper around our ApiResult<T> contract.
 *
 * Centralizes:
 *   - loading / error state
 *   - automatic `api_error` analytics tracking on every non-ok result
 *   - convenient `run()` that returns the typed result so call sites can
 *     branch synchronously without duplicating loading flags.
 */

import { useCallback, useState } from "react";
import analytics from "@/lib/analytics";
import type { ApiError, ApiResult } from "@/lib/api-contracts";

interface UseApiCallState {
  loading: boolean;
  error: ApiError | null;
}

export function useApiCall<TArgs extends unknown[], TData>(
  fn: (...args: TArgs) => Promise<ApiResult<TData>>,
  endpoint: string,
) {
  const [state, setState] = useState<UseApiCallState>({ loading: false, error: null });

  const run = useCallback(
    async (...args: TArgs): Promise<ApiResult<TData>> => {
      setState({ loading: true, error: null });
      const result = await fn(...args);
      if (result.ok) {
        setState({ loading: false, error: null });
      } else {
        setState({ loading: false, error: result });
        analytics.track("api_error", {
          endpoint,
          code: result.code,
          ...(result.field ? { field: result.field } : {}),
        });
      }
      return result;
    },
    [fn, endpoint],
  );

  const reset = useCallback(() => setState({ loading: false, error: null }), []);

  return { ...state, run, reset };
}
