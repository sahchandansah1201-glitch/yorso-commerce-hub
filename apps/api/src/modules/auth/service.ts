import { createHash, timingSafeEqual } from "node:crypto";
import {
  authSessionResponseSchema,
  authSignInSchema,
  authSignOutResponseSchema,
  type AuthSession,
  type AuthSessionResponse,
  type AuthSignOutResponse,
} from "../../../../../packages/contracts/dist/index.js";
import type { AuthRepository, AuthUser } from "./repository.js";

const authSessionTtlMs = 7 * 24 * 60 * 60 * 1000;

export class AuthServiceError extends Error {
  constructor(
    public readonly code: "auth_invalid_credentials" | "auth_session_required" | "auth_session_invalid",
    message: string,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async signIn(payload: unknown, requestId: string): Promise<AuthSessionResponse> {
    const parsed = authSignInSchema.parse(payload);
    const user = await this.repository.findUserByEmail(parsed.email);

    if (!user || !verifyPasswordSecret(parsed.password, user)) {
      throw new AuthServiceError("auth_invalid_credentials", "Invalid email or password.");
    }

    const session = await this.repository.createSession(user, authSessionTtlMs);
    return authSessionResponseSchema.parse({
      ok: true,
      session,
      requestId,
    });
  }

  async getSession(sessionId: string | undefined, requestId: string): Promise<AuthSessionResponse> {
    const session = await this.requireSession(sessionId);
    return authSessionResponseSchema.parse({
      ok: true,
      session,
      requestId,
    });
  }

  async signOut(sessionId: string | undefined, requestId: string): Promise<AuthSignOutResponse> {
    const session = await this.requireSession(sessionId);
    const signedOut = await this.repository.deleteSession(session.id);
    return authSignOutResponseSchema.parse({
      ok: true,
      signedOut,
      requestId,
    });
  }

  private async requireSession(sessionId: string | undefined): Promise<AuthSession> {
    if (!sessionId?.trim()) {
      throw new AuthServiceError("auth_session_required", "Auth session id is required.");
    }

    const session = await this.repository.getSession(sessionId.trim());
    if (!session) {
      throw new AuthServiceError("auth_session_invalid", "Auth session is invalid or expired.");
    }
    return session;
  }
}

function verifyPasswordSecret(password: string, user: AuthUser): boolean {
  const secret = user.passwordSecret;

  if (secret.startsWith("plain:")) {
    return safeEqual(password, secret.slice("plain:".length));
  }

  if (secret.startsWith("sha256:")) {
    const [, salt, expectedHash] = secret.split(":");
    if (!salt || !expectedHash) return false;
    const actualHash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
    return safeEqual(actualHash, expectedHash);
  }

  return false;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.byteLength !== rightBuffer.byteLength) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
