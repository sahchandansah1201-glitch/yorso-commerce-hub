import { randomBytes } from "node:crypto";
import type { AuthSession } from "../../../../../packages/contracts/dist/index.js";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  passwordSecret: string;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  createSession(user: Pick<AuthUser, "id" | "email" | "displayName">, ttlMs: number): Promise<AuthSession>;
  getSession(sessionId: string): Promise<AuthSession | null>;
  deleteSession(sessionId: string): Promise<boolean>;
}

const demoAuthUser: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "buyer@example.com",
  displayName: "Demo Buyer",
  passwordSecret: "plain:Password1",
};

const createSessionId = () => randomBytes(32).toString("hex");
const iso = (value: Date) => value.toISOString();

export class MemoryAuthRepository implements AuthRepository {
  private readonly usersByEmail = new Map<string, AuthUser>();
  private readonly sessions = new Map<string, AuthSession>();

  constructor(users: AuthUser[] = [demoAuthUser]) {
    for (const user of users) {
      this.usersByEmail.set(user.email.toLowerCase(), { ...user, email: user.email.toLowerCase() });
    }
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const user = this.usersByEmail.get(email.toLowerCase());
    return user ? { ...user } : null;
  }

  async createSession(
    user: Pick<AuthUser, "id" | "email" | "displayName">,
    ttlMs: number,
  ): Promise<AuthSession> {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + ttlMs);
    const session: AuthSession = {
      id: createSessionId(),
      userId: user.id,
      email: user.email.toLowerCase(),
      displayName: user.displayName,
      issuedAt: iso(issuedAt),
      expiresAt: iso(expiresAt),
    };
    this.sessions.set(session.id, session);
    return { ...session };
  }

  async getSession(sessionId: string): Promise<AuthSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return { ...session };
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }
}
