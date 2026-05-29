import { randomBytes, randomUUID } from "node:crypto";
import type {
  AdminUserRole,
  AuthRegistrationDeliveryChannel,
  AuthRegistrationDeliveryPurpose,
  AuthRegistrationDeliveryStatus,
  AuthRegisterDetails,
  AuthRegisterMarkets,
  AuthRegisterOnboarding,
  AuthRegisterPhoneRequest,
  AuthRegisterStart,
  AuthSecurityEvent,
  AuthSecurityEventType,
  AuthSession,
} from "../../../../../packages/contracts/dist/index.js";
import type { RegisteredAccountProvision } from "../account/repository.js";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  passwordSecret: string;
}

export interface RegistrationDraft {
  categories: string[];
  certifications: string[];
  companyName: string | null;
  country: string | null;
  countryCode: string | null;
  email: string;
  emailCodeSecret: string;
  emailVerifiedAt: string | null;
  expiresAt: string;
  fullName: string | null;
  id: string;
  passwordSecret: string | null;
  phone: string | null;
  phoneCodeRequests: number;
  phoneCodeSecret: string | null;
  phoneVerifiedAt: string | null;
  role: AuthRegisterStart["role"];
  targetCountries: string[];
  vatTin: string | null;
  volume: string;
}

export interface RegistrationDeliveryOutboxEntry {
  channel: AuthRegistrationDeliveryChannel;
  createdAt: string;
  destinationPreview: string;
  draftId: string;
  id: string;
  purpose: AuthRegistrationDeliveryPurpose;
  status: AuthRegistrationDeliveryStatus;
}

export interface RegistrationDeliveryOutboxInput {
  channel: AuthRegistrationDeliveryChannel;
  destinationHash: string;
  destinationPreview: string;
  purpose: AuthRegistrationDeliveryPurpose;
  requestId: string;
  templateKey: string;
}

export interface RegistrationDraftDeliveryResult {
  delivery: RegistrationDeliveryOutboxEntry;
  draft: RegistrationDraft;
}

export interface RegistrationAccountProvisioner {
  provisionRegisteredAccount(input: RegisteredAccountProvision): Promise<void>;
}

export interface RegistrationCompleteResult {
  profile: {
    company: string;
    country: string;
    fullName: string;
    role: AuthRegisterStart["role"];
  };
  session: AuthSession;
  userId: string;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  createSession(user: Pick<AuthUser, "id" | "email" | "displayName">, ttlMs: number): Promise<AuthSession>;
  startRegistrationDraft(
    input: AuthRegisterStart & { delivery: RegistrationDeliveryOutboxInput; emailCodeSecret: string; expiresAt: Date },
  ): Promise<RegistrationDraftDeliveryResult>;
  getRegistrationDraft(sessionId: string): Promise<RegistrationDraft | null>;
  markRegistrationEmailVerified(sessionId: string): Promise<RegistrationDraft>;
  updateRegistrationDetails(sessionId: string, input: AuthRegisterDetails & { countryCode: string; passwordSecret: string }): Promise<RegistrationDraft>;
  recordRegistrationPhoneRequest(
    sessionId: string,
    input: AuthRegisterPhoneRequest & { delivery: RegistrationDeliveryOutboxInput; phoneCodeSecret: string },
  ): Promise<RegistrationDraftDeliveryResult>;
  markRegistrationPhoneVerified(sessionId: string, phone: string): Promise<RegistrationDraft>;
  updateRegistrationOnboarding(sessionId: string, input: AuthRegisterOnboarding): Promise<RegistrationDraft>;
  updateRegistrationMarkets(sessionId: string, input: AuthRegisterMarkets): Promise<RegistrationDraft>;
  completeRegistration(sessionId: string, ttlMs: number): Promise<RegistrationCompleteResult>;
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
const cloneDraft = (draft: RegistrationDraft): RegistrationDraft => ({
  ...draft,
  categories: [...draft.categories],
  certifications: [...draft.certifications],
  targetCountries: [...draft.targetCountries],
});
const cloneDelivery = (delivery: RegistrationDeliveryOutboxEntry): RegistrationDeliveryOutboxEntry => ({ ...delivery });

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "YORSO",
    lastName: parts.slice(1).join(" ") || "-",
  };
};

export class MemoryAuthRepository implements AuthRepository {
  private readonly usersByEmail = new Map<string, AuthUser>();
  private readonly rolesByUserId = new Map<string, Set<AdminUserRole>>();
  private readonly sessions = new Map<string, AuthSession>();
  private readonly securityEvents: AuthSecurityEvent[] = [];
  private readonly registrationDrafts = new Map<string, RegistrationDraft>();
  private readonly registrationDeliveryOutbox = new Map<string, RegistrationDeliveryOutboxEntry>();

  constructor(
    users: AuthUser[] = [demoAuthUser, demoAdminUser],
    roles: Record<string, AdminUserRole[]> = {
      [demoAuthUser.id]: ["buyer"],
      [demoAdminUser.id]: ["admin"],
    },
    private readonly accountProvisioner?: RegistrationAccountProvisioner,
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

  async startRegistrationDraft(
    input: AuthRegisterStart & { delivery: RegistrationDeliveryOutboxInput; emailCodeSecret: string; expiresAt: Date },
  ) {
    const id = createSessionId();
    const draft: RegistrationDraft = {
      categories: [],
      certifications: [],
      companyName: null,
      country: null,
      countryCode: null,
      email: input.email.toLowerCase(),
      emailCodeSecret: input.emailCodeSecret,
      emailVerifiedAt: null,
      expiresAt: iso(input.expiresAt),
      fullName: null,
      id,
      passwordSecret: null,
      phone: null,
      phoneCodeRequests: 0,
      phoneCodeSecret: null,
      phoneVerifiedAt: null,
      role: input.role,
      targetCountries: [],
      vatTin: null,
      volume: "",
    };
    this.registrationDrafts.set(id, draft);
    const delivery = this.createRegistrationDelivery(id, input.delivery);
    return {
      delivery: cloneDelivery(delivery),
      draft: cloneDraft(draft),
    };
  }

  async getRegistrationDraft(sessionId: string) {
    const draft = this.registrationDrafts.get(sessionId);
    if (!draft || new Date(draft.expiresAt).getTime() <= Date.now()) return null;
    return cloneDraft(draft);
  }

  async markRegistrationEmailVerified(sessionId: string) {
    const draft = await this.requireRegistrationDraft(sessionId);
    draft.emailVerifiedAt = iso(new Date());
    this.registrationDrafts.set(sessionId, draft);
    return cloneDraft(draft);
  }

  async updateRegistrationDetails(
    sessionId: string,
    input: AuthRegisterDetails & { countryCode: string; passwordSecret: string },
  ) {
    const draft = await this.requireRegistrationDraft(sessionId);
    draft.fullName = input.fullName;
    draft.companyName = input.company;
    draft.country = input.country;
    draft.countryCode = input.countryCode;
    draft.vatTin = input.vatTin;
    draft.passwordSecret = input.passwordSecret;
    this.registrationDrafts.set(sessionId, draft);
    return cloneDraft(draft);
  }

  async recordRegistrationPhoneRequest(
    sessionId: string,
    input: AuthRegisterPhoneRequest & { delivery: RegistrationDeliveryOutboxInput; phoneCodeSecret: string },
  ) {
    const draft = await this.requireRegistrationDraft(sessionId);
    draft.phone = input.phone;
    draft.phoneCodeSecret = input.phoneCodeSecret;
    draft.phoneCodeRequests += 1;
    draft.phoneVerifiedAt = null;
    this.registrationDrafts.set(sessionId, draft);
    const delivery = this.createRegistrationDelivery(sessionId, input.delivery);
    return {
      delivery: cloneDelivery(delivery),
      draft: cloneDraft(draft),
    };
  }

  async markRegistrationPhoneVerified(sessionId: string, phone: string) {
    const draft = await this.requireRegistrationDraft(sessionId);
    draft.phone = phone;
    draft.phoneVerifiedAt = iso(new Date());
    this.registrationDrafts.set(sessionId, draft);
    return cloneDraft(draft);
  }

  async updateRegistrationOnboarding(sessionId: string, input: AuthRegisterOnboarding) {
    const draft = await this.requireRegistrationDraft(sessionId);
    draft.categories = [...input.categories];
    draft.certifications = [...input.certifications];
    draft.volume = input.volume;
    this.registrationDrafts.set(sessionId, draft);
    return cloneDraft(draft);
  }

  async updateRegistrationMarkets(sessionId: string, input: AuthRegisterMarkets) {
    const draft = await this.requireRegistrationDraft(sessionId);
    draft.targetCountries = [...input.countries];
    this.registrationDrafts.set(sessionId, draft);
    return cloneDraft(draft);
  }

  async completeRegistration(sessionId: string, ttlMs: number) {
    const draft = await this.requireRegistrationDraft(sessionId);
    if (!draft.emailVerifiedAt) throw new Error("registration_email_not_verified");
    if (!draft.phoneVerifiedAt) throw new Error("registration_phone_not_verified");
    if (!draft.fullName || !draft.companyName || !draft.country || !draft.countryCode || !draft.passwordSecret || !draft.vatTin) {
      throw new Error("registration_details_required");
    }
    if (this.usersByEmail.has(draft.email)) throw new Error("registration_email_exists");

    const { firstName, lastName } = splitFullName(draft.fullName);
    const user: AuthUser = {
      id: randomUUID(),
      email: draft.email,
      displayName: draft.fullName,
      passwordSecret: draft.passwordSecret,
    };
    this.usersByEmail.set(user.email, user);
    this.rolesByUserId.set(user.id, new Set([draft.role, "company_admin"]));
    await this.accountProvisioner?.provisionRegisteredAccount({
      categories: draft.categories,
      certifications: draft.certifications,
      companyName: draft.companyName,
      country: draft.country,
      countryCode: draft.countryCode,
      email: draft.email,
      fullName: `${firstName} ${lastName === "-" ? "" : lastName}`.trim(),
      phone: draft.phone,
      role: draft.role,
      targetCountries: draft.targetCountries,
      userId: user.id,
      vatTin: draft.vatTin,
      volume: draft.volume,
    });

    const session = await this.createSession(user, ttlMs);
    this.registrationDrafts.delete(sessionId);
    return {
      profile: {
        company: draft.companyName,
        country: draft.country,
        fullName: draft.fullName,
        role: draft.role,
      },
      session,
      userId: user.id,
    };
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

  private async requireRegistrationDraft(sessionId: string) {
    const draft = await this.getRegistrationDraft(sessionId);
    if (!draft) throw new Error("registration_session_invalid");
    return draft;
  }

  private createRegistrationDelivery(
    draftId: string,
    input: RegistrationDeliveryOutboxInput,
  ): RegistrationDeliveryOutboxEntry {
    const delivery: RegistrationDeliveryOutboxEntry = {
      channel: input.channel,
      createdAt: iso(new Date()),
      destinationPreview: input.destinationPreview,
      draftId,
      id: randomUUID(),
      purpose: input.purpose,
      status: "queued",
    };
    this.registrationDeliveryOutbox.set(delivery.id, delivery);
    return delivery;
  }
}
