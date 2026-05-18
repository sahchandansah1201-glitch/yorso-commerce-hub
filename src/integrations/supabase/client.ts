// Supabase is a prototype/legacy integration. The production path is the
// self-hosted YORSO API, so this module must be safe when VITE_SUPABASE_* is
// intentionally empty.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const SUPABASE_NOT_CONFIGURED_ERROR = {
  code: "SUPABASE_NOT_CONFIGURED",
  message: "Supabase is not configured. The self-hosted API or local fallback should handle this path.",
  name: "SupabaseNotConfigured",
} as const;

const disabledResult = () => ({
  data: null,
  error: SUPABASE_NOT_CONFIGURED_ERROR,
  count: null,
  status: 503,
  statusText: "Supabase not configured",
});

const createDisabledQueryBuilder = (): unknown => {
  const result = Promise.resolve(disabledResult());
  const proxy: unknown = new Proxy(
    {},
    {
      get(_target, property) {
        if (property === "then") return result.then.bind(result);
        if (property === "catch") return result.catch.bind(result);
        if (property === "finally") return result.finally.bind(result);
        return () => proxy;
      },
    },
  );
  return proxy;
};

const createDisabledSupabaseClient = (): SupabaseClient<Database> =>
  ({
    auth: {
      signInWithPassword: async () => disabledResult(),
      resetPasswordForEmail: async () => disabledResult(),
      getUser: async () => disabledResult(),
      updateUser: async () => disabledResult(),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            id: "supabase-disabled",
            callback: () => undefined,
            unsubscribe: () => undefined,
          },
        },
      }),
    },
    from: () => createDisabledQueryBuilder(),
    rpc: async () => disabledResult(),
  }) as unknown as SupabaseClient<Database>;

export const supabase = isSupabaseConfigured ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof localStorage !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
}) : createDisabledSupabaseClient();
