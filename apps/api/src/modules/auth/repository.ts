import { randomBytes } from "node:crypto";
import type {
  AdminUserRole,
  AuthSecurityEvent,
  AuthSecurityEventType,
  AuthSession,
} from "../../../../../packages/contracts/dist/index.js";

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
  hasRole(userId: string, role: AdminUserRole): Promise<boolean>;
  recordSecurityEvent(event: AuthSecurityEventInput): Promise<void>;
  countRecentSecurityEvents(query: AuthSecurityEventCountQuery): Promise<number>;
}

export interface AuthSecurityEventInput {
  eventType: AuthSecurityEventType;
  userId?: string | null;
  email?: string | null;
  sessionId?: string | null;
  requestId: string;
  metadata?: Record<string, unknown>;
}

export interface AuthSecurityEventCountQuery {
  eventType: AuthSecurityEventType;
  email?: string | null;
  since: Date;
}

const demoAuthUser: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "buyer@example.com",
  displayName: "Demo Buyer",
  passwordSecret: "plain:Password1",
};

const demoAdminUser: AuthUser = {
  id: "00000000-0000-4000-8000-000000000090",
  email: "admin@example.com",
  displayName: "Demo Admin",
  passwordSecret: "plain:Password1",
};

const createSessionId = () => randomBytes(32).toString("hex");
const iso = (value: Date) => value.toISOString();

export class MemoryAuthRepository implements AuthRepository {
  private readonly usersByEmail = new Map<string, AuthUser>();
  private readonly rolesByUserId = new Map<string, Set<AdminUserRole>>();
  private readonly sessions = new Map<string, AuthSession>();
  private readonly securityEvents: AuthSecurityEvent[] = [];

  constructor(
    users: AuthUser[] = [demoAuthUser, demoAdminUser],
    roles: Record<string, AdminUserRole[]> = {
      [demoAuthUser.id]: ["buyer"],
      [demoAdminUser.id]: ["admin"],
    },
  ) {
    for (const user of users) {
      this.usersByEmail.set(user.email.toLowerCase(), { ...user, email: user.email.toLowerCase() });
    }
    for (const [userId, userRoles] of Object.entries(roles)) {
      this.rolesByUserId.set(userId, new Set(userRoles));
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

  async hasRole(userId: string, role: AdminUserRole): Promise<boolean> {
    return this.rolesByUserId.get(userId)?.has(role) ?? false;
  }

  async recordSecurityEvent(event: AuthSecurityEventInput): Promise<void> {
    this.securityEvents.push({
      id: createSessionId(),
      eventType: event.eventType,
      userId: event.userId ?? null,
      email: event.email?.toLowerCase() ?? null,
      sessionId: event.sessionId ?? null,
      requestId: event.requestId,
      occurredAt: iso(new Date()),
      metadata: event.metadata ?? {},
    });
  }

  async countRecentSecurityEvents(query: AuthSecurityEventCountQuery): Promise<number> {
    const since = query.since.getTime();
    const email = query.email?.toLowerCase() ?? null;
    return this.securityEvents.filter((event) => {
      if (event.eventType !== query.eventType) return false;
      if (email && event.email !== email) return false;
      return new Date(event.occurredAt).getTime() >= since;
    }).length;
  }
}
