/**
 * Mock Buyer Session — frontend-only авторизация на sessionStorage.
 *
 * Phase 0: реального backend нет. Эта сессия только моделирует
 * "пользователь вошёл" для рендера /workspace/*. Никаких токенов и
 * реальных аккаунтов: всё в sessionStorage и сбрасывается при закрытии вкладки.
 *
 * Контракт:
 *   - signIn({ identifier, method }) — создаёт сессию.
 *   - signOut() — очищает.
 *   - getSession() — читает текущую сессию (или null).
 *   - subscribe(listener) — подписка для UI на изменения.
 */

const STORAGE_KEY = "yorso_buyer_session";

export type SignInMethod = "email" | "phone" | "whatsapp";

export interface BuyerSession {
  id: string;
  identifier: string;
  method: SignInMethod;
  signedInAt: string;
  displayName: string;
}

type Listener = (session: BuyerSession | null) => void;
const listeners = new Set<Listener>();

const notify = (session: BuyerSession | null) => {
  for (const l of listeners) l(session);
};

const safeRead = (): BuyerSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BuyerSession;
    if (!parsed || typeof parsed.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
};

const safeWrite = (session: BuyerSession | null) => {
  if (typeof window === "undefined") return;
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* swallow */
  }
};

const deriveDisplayName = (identifier: string, method: SignInMethod): string => {
  if (method === "email") return identifier.split("@")[0] || identifier;
  return identifier;
};

export const buyerSession = {
  signIn(input: { identifier: string; method: SignInMethod }): BuyerSession {
    const session: BuyerSession = {
      id: `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      identifier: input.identifier,
      method: input.method,
      signedInAt: new Date().toISOString(),
      displayName: deriveDisplayName(input.identifier, input.method),
    };
    safeWrite(session);
    notify(session);
    return session;
  },
  signOut(): void {
    safeWrite(null);
    notify(null);
  },
  getSession(): BuyerSession | null {
    return safeRead();
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /** Test-only helper: жёсткий сброс. */
  __resetForTests() {
    safeWrite(null);
    listeners.clear();
  },
};

export const BUYER_SESSION_STORAGE_KEY = STORAGE_KEY;
