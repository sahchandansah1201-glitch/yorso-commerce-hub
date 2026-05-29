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
  emailCodeAttemptCount: number;
  emailCodeExpiresAt: string;
  emailCodeSecret: string;
  emailVerifiedAt: string | null;
  expiresAt: string;
  fullName: string | null;
  id: string;
  passwordSecret: string | null;
  phone: string | null;
  phoneCodeAttemptCount: number;
  phoneCodeExpiresAt: string | null;
  phoneCodeRequests: number;
  phoneCodeSecret: string | null;
  phoneVerifiedAt: string | null;
  role: AuthRegisterStart["role"];
  targetCountries: string[];
  vatTin: string | null;
  volume: string;
}

export interface RegistrationDeliveryOutboxEntry {
  attemptCount: number;
  availableAt: string;
  channel: AuthRegistrationDeliveryChannel;
  createdAt: string;
  destinationPreview: string;
  draftId: string;
  id: string;
  lockedAt: string | null;
  lockedBy: string | null;
  maxAttempts: number;
  purpose: AuthRegistrationDeliveryPurpose;
  status: AuthRegistrationDeliveryStatus;
  templateKey: string;
  updatedAt: string;
}

export interface RegistrationDeliveryOutboxInput {
  channel: AuthRegistrationDeliveryChannel;
  destinationHash: string;
  destinationPreview: string;
  purpose: AuthRegistrationDeliveryPurpose;
  requestId: string;
  templateKey: string;
  verificationCode: string;
}

export interface RegistrationDraftDeliveryResult {
  delivery: RegistrationDeliveryOutboxEntry;
  draft: RegistrationDraft;
}

export interface RegistrationDeliveryJob extends RegistrationDeliveryOutboxEntry {
  destination: string;
  verificationCode: string;
}

export interface RegistrationDeliveryLeaseInput {
  leaseMs: number;
  limit: number;
  workerId: string;
}

export interface RegistrationDeliveryFailureInput {
  error: string;
  retryAfterMs: number;
}

export interface PasswordRecoveryDeliveryOutboxEntry {
  attemptCount: number;
  availableAt: string;
  createdAt: string;
  destinationPreview: string;
  id: string;
  lockedAt: string | null;
  lockedBy: string | null;
  maxAttempts: number;
  recoveryId: string;
  status: "queued" | "leased" | "sent" | "failed" | "cancelled";
  templateKey: string;
  updatedAt: string;
}

export interface PasswordRecoveryDeliveryJob extends PasswordRecoveryDeliveryOutboxEntry {
  destination: string;
  recoveryToken: string;
}

export interface PasswordRecoveryDeliveryLeaseInput {
  leaseMs: number;
  limit: number;
  workerId: string;
}

export interface PasswordRecoveryDeliveryFailureInput {
  error: string;
  retryAfterMs: number;
}

export interface PasswordRecoveryRecord {
  createdAt: string;
  email: string;
  expiresAt: string;
  id: string;
  tokenSecret: string;
  usedAt: string | null;
  userId: string;
}

export interface PasswordRecoveryCreateInput {
  delivery: {
    destinationHash: string;
    destinationPreview: string;
    recoveryToken: string;
    requestId: string;
    templateKey: string;
  };
  email: string;
  expiresAt: Date;
  tokenLookupHash: string;
  tokenSecret: string;
  userId: string;
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
    input: AuthRegisterStart & {
      delivery: RegistrationDeliveryOutboxInput;
      emailCodeExpiresAt: Date;
      emailCodeSecret: string;
      expiresAt: Date;
    },
  ): Promise<RegistrationDraftDeliveryResult>;
  getRegistrationDraft(sessionId: string): Promise<RegistrationDraft | null>;
  recordRegistrationEmailCodeAttempt(sessionId: string): Promise<RegistrationDraft>;
  markRegistrationEmailVerified(sessionId: string): Promise<RegistrationDraft>;
  updateRegistrationDetails(sessionId: string, input: AuthRegisterDetails & { countryCode: string; passwordSecret: string }): Promise<RegistrationDraft>;
  recordRegistrationPhoneRequest(
    sessionId: string,
    input: AuthRegisterPhoneRequest & {
      delivery: RegistrationDeliveryOutboxInput;
      phoneCodeExpiresAt: Date;
      phoneCodeSecret: string;
    },
  ): Promise<RegistrationDraftDeliveryResult>;
  recordRegistrationPhoneCodeAttempt(sessionId: string): Promise<RegistrationDraft>;
  markRegistrationPhoneVerified(sessionId: string, phone: string): Promise<RegistrationDraft>;
  updateRegistrationOnboarding(sessionId: string, input: AuthRegisterOnboarding): Promise<RegistrationDraft>;
  updateRegistrationMarkets(sessionId: string, input: AuthRegisterMarkets): Promise<RegistrationDraft>;
  completeRegistration(sessionId: string, ttlMs: number): Promise<RegistrationCompleteResult>;
  leaseRegistrationDeliveryJobs(input: RegistrationDeliveryLeaseInput): Promise<RegistrationDeliveryJob[]>;
  markRegistrationDeliverySent(deliveryId: string): Promise<RegistrationDeliveryOutboxEntry | null>;
  markRegistrationDeliveryFailed(
    deliveryId: string,
    input: RegistrationDeliveryFailureInput,
  ): Promise<RegistrationDeliveryOutboxEntry | null>;
  getSession(sessionId: string): Promise<AuthSession | null>;
  deleteSession(sessionId: string): Promise<boolean>;
  deleteSessionsForUser(userId: string): Promise<string[]>;
  createPasswordRecovery(input: PasswordRecoveryCreateInput): Promise<PasswordRecoveryRecord>;
  findPasswordRecoveryByTokenHash(tokenLookupHash: string): Promise<PasswordRecoveryRecord | null>;
  completePasswordRecovery(recoveryId: string, userId: string, passwordSecret: string): Promise<boolean>;
  leasePasswordRecoveryDeliveryJobs(input: PasswordRecoveryDeliveryLeaseInput): Promise<PasswordRecoveryDeliveryJob[]>;
  markPasswordRecoveryDeliverySent(deliveryId: string): Promise<PasswordRecoveryDeliveryOutboxEntry | null>;
  markPasswordRecoveryDeliveryFailed(
    deliveryId: string,
    input: PasswordRecoveryDeliveryFailureInput,
  ): Promise<PasswordRecoveryDeliveryOutboxEntry | null>;
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
const clonePasswordRecovery = (recovery: PasswordRecoveryRecord): PasswordRecoveryRecord => ({ ...recovery });

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
  private readonly registrationDeliveryCodes = new Map<string, string>();
  private readonly passwordRecoveries = new Map<string, PasswordRecoveryRecord>();
  private readonly passwordRecoveryByTokenHash = new Map<string, string>();
  private readonly passwordRecoveryDeliveryOutbox = new Map<string, PasswordRecoveryDeliveryOutboxEntry>();
  private readonly passwordRecoveryDeliveryTokens = new Map<string, string>();

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
    input: AuthRegisterStart & {
      delivery: RegistrationDeliveryOutboxInput;
      emailCodeExpiresAt: Date;
      emailCodeSecret: string;
      expiresAt: Date;
    },
  ) {
    const id = createSessionId();
    const draft: RegistrationDraft = {
      categories: [],
      certifications: [],
      companyName: null,
      country: null,
      countryCode: null,
      email: input.email.toLowerCase(),
      emailCodeAttemptCount: 0,
      emailCodeExpiresAt: iso(input.emailCodeExpiresAt),
      emailCodeSecret: input.emailCodeSecret,
      emailVerifiedAt: null,
      expiresAt: iso(input.expiresAt),
      fullName: null,
      id,
      passwordSecret: null,
      phone: null,
      phoneCodeAttemptCount: 0,
      phoneCodeExpiresAt: null,
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

  async recordRegistrationEmailCodeAttempt(sessionId: string) {
    const draft = await this.requireRegistrationDraft(sessionId);
    draft.emailCodeAttemptCount += 1;
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
    input: AuthRegisterPhoneRequest & {
      delivery: RegistrationDeliveryOutboxInput;
      phoneCodeExpiresAt: Date;
      phoneCodeSecret: string;
    },
  ) {
    const draft = await this.requireRegistrationDraft(sessionId);
    draft.phone = input.phone;
    draft.phoneCodeAttemptCount = 0;
    draft.phoneCodeExpiresAt = iso(input.phoneCodeExpiresAt);
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

  async recordRegistrationPhoneCodeAttempt(sessionId: string) {
    const draft = await this.requireRegistrationDraft(sessionId);
    draft.phoneCodeAttemptCount += 1;
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

  async deleteSessionsForUser(userId: string): Promise<string[]> {
    const deleted: string[] = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId !== userId) continue;
      this.sessions.delete(sessionId);
      deleted.push(sessionId);
    }
    return deleted;
  }

  async createPasswordRecovery(input: PasswordRecoveryCreateInput): Promise<PasswordRecoveryRecord> {
    const recovery: PasswordRecoveryRecord = {
      createdAt: iso(new Date()),
      email: input.email.toLowerCase(),
      expiresAt: iso(input.expiresAt),
      id: randomUUID(),
      tokenSecret: input.tokenSecret,
      usedAt: null,
      userId: input.userId,
    };
    const delivery: PasswordRecoveryDeliveryOutboxEntry = {
      attemptCount: 0,
      availableAt: recovery.createdAt,
      createdAt: recovery.createdAt,
      destinationPreview: input.delivery.destinationPreview,
      id: randomUUID(),
      lockedAt: null,
      lockedBy: null,
      maxAttempts: 5,
      recoveryId: recovery.id,
      status: "queued",
      templateKey: input.delivery.templateKey,
      updatedAt: recovery.createdAt,
    };
    this.passwordRecoveries.set(recovery.id, recovery);
    this.passwordRecoveryByTokenHash.set(input.tokenLookupHash, recovery.id);
    this.passwordRecoveryDeliveryOutbox.set(delivery.id, delivery);
    this.passwordRecoveryDeliveryTokens.set(delivery.id, input.delivery.recoveryToken);
    return clonePasswordRecovery(recovery);
  }

  async findPasswordRecoveryByTokenHash(tokenLookupHash: string): Promise<PasswordRecoveryRecord | null> {
    const recoveryId = this.passwordRecoveryByTokenHash.get(tokenLookupHash);
    if (!recoveryId) return null;
    const recovery = this.passwordRecoveries.get(recoveryId);
    return recovery ? clonePasswordRecovery(recovery) : null;
  }

  async completePasswordRecovery(recoveryId: string, userId: string, passwordSecret: string): Promise<boolean> {
    const recovery = this.passwordRecoveries.get(recoveryId);
    if (!recovery || recovery.userId !== userId || recovery.usedAt) return false;
    const user = [...this.usersByEmail.values()].find((candidate) => candidate.id === userId);
    if (!user) return false;
    user.passwordSecret = passwordSecret;
    recovery.usedAt = iso(new Date());
    this.passwordRecoveries.set(recoveryId, recovery);
    this.usersByEmail.set(user.email, user);
    return true;
  }

  async leasePasswordRecoveryDeliveryJobs(input: PasswordRecoveryDeliveryLeaseInput): Promise<PasswordRecoveryDeliveryJob[]> {
    const now = Date.now();
    const jobs = [...this.passwordRecoveryDeliveryOutbox.values()]
      .filter((delivery) =>
        (delivery.status === "queued" || delivery.status === "leased") &&
        delivery.attemptCount < delivery.maxAttempts &&
        new Date(delivery.availableAt).getTime() <= now
      )
      .sort((left, right) =>
        new Date(left.availableAt).getTime() - new Date(right.availableAt).getTime() ||
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      )
      .slice(0, input.limit);

    const leasedAt = iso(new Date());
    const leaseExpiresAt = iso(new Date(now + input.leaseMs));
    return jobs.flatMap((delivery) => {
      const recovery = this.passwordRecoveries.get(delivery.recoveryId);
      if (!recovery) return [];
      if (recovery.usedAt) return [];
      if (new Date(recovery.expiresAt).getTime() <= now) return [];
      const recoveryToken = this.passwordRecoveryDeliveryTokens.get(delivery.id);
      if (!recoveryToken) return [];
      const leased: PasswordRecoveryDeliveryOutboxEntry = {
        ...delivery,
        availableAt: leaseExpiresAt,
        lockedAt: leasedAt,
        lockedBy: input.workerId,
        status: "leased",
        updatedAt: leasedAt,
      };
      this.passwordRecoveryDeliveryOutbox.set(leased.id, leased);
      return [{
        ...leased,
        destination: recovery.email,
        recoveryToken,
      }];
    });
  }

  async markPasswordRecoveryDeliverySent(deliveryId: string): Promise<PasswordRecoveryDeliveryOutboxEntry | null> {
    const delivery = this.passwordRecoveryDeliveryOutbox.get(deliveryId);
    if (!delivery || delivery.status !== "leased") return null;
    const updated: PasswordRecoveryDeliveryOutboxEntry = {
      ...delivery,
      lockedAt: null,
      lockedBy: null,
      status: "sent",
      updatedAt: iso(new Date()),
    };
    this.passwordRecoveryDeliveryOutbox.set(deliveryId, updated);
    return { ...updated };
  }

  async markPasswordRecoveryDeliveryFailed(
    deliveryId: string,
    input: PasswordRecoveryDeliveryFailureInput,
  ): Promise<PasswordRecoveryDeliveryOutboxEntry | null> {
    const delivery = this.passwordRecoveryDeliveryOutbox.get(deliveryId);
    if (!delivery || delivery.status !== "leased") return null;
    const attemptCount = delivery.attemptCount + 1;
    const exhausted = attemptCount >= delivery.maxAttempts;
    const updated: PasswordRecoveryDeliveryOutboxEntry = {
      ...delivery,
      attemptCount,
      availableAt: exhausted ? delivery.availableAt : iso(new Date(Date.now() + input.retryAfterMs)),
      lockedAt: null,
      lockedBy: null,
      status: exhausted ? "failed" : "queued",
      updatedAt: iso(new Date()),
    };
    this.passwordRecoveryDeliveryOutbox.set(deliveryId, updated);
    return { ...updated };
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

  async leaseRegistrationDeliveryJobs(input: RegistrationDeliveryLeaseInput): Promise<RegistrationDeliveryJob[]> {
    const now = Date.now();
    const jobs = [...this.registrationDeliveryOutbox.values()]
      .filter((delivery) =>
        (delivery.status === "queued" || delivery.status === "leased") &&
        delivery.attemptCount < delivery.maxAttempts &&
        new Date(delivery.availableAt).getTime() <= now
      )
      .sort((left, right) =>
        new Date(left.availableAt).getTime() - new Date(right.availableAt).getTime() ||
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      )
      .slice(0, input.limit);

    const leasedAt = iso(new Date());
    const leaseExpiresAt = iso(new Date(now + input.leaseMs));
    return jobs.flatMap((delivery) => {
      const draft = this.registrationDrafts.get(delivery.draftId);
      if (!draft) return [];
      if (new Date(draft.expiresAt).getTime() <= now) return [];
      const destination = delivery.purpose === "email_verification" ? draft.email : draft.phone;
      if (!destination) return [];
      const verificationCode = this.registrationDeliveryCodes.get(delivery.id);
      if (!verificationCode) return [];
      const leased: RegistrationDeliveryOutboxEntry = {
        ...delivery,
        availableAt: leaseExpiresAt,
        lockedAt: leasedAt,
        lockedBy: input.workerId,
        status: "leased",
        updatedAt: leasedAt,
      };
      this.registrationDeliveryOutbox.set(leased.id, leased);
      return [{
        ...cloneDelivery(leased),
        destination,
        verificationCode,
      }];
    });
  }

  async markRegistrationDeliverySent(deliveryId: string): Promise<RegistrationDeliveryOutboxEntry | null> {
    const delivery = this.registrationDeliveryOutbox.get(deliveryId);
    if (!delivery || delivery.status !== "leased") return null;
    const updated: RegistrationDeliveryOutboxEntry = {
      ...delivery,
      lockedAt: null,
      lockedBy: null,
      status: "sent",
      updatedAt: iso(new Date()),
    };
    this.registrationDeliveryOutbox.set(deliveryId, updated);
    return cloneDelivery(updated);
  }

  async markRegistrationDeliveryFailed(
    deliveryId: string,
    input: RegistrationDeliveryFailureInput,
  ): Promise<RegistrationDeliveryOutboxEntry | null> {
    const delivery = this.registrationDeliveryOutbox.get(deliveryId);
    if (!delivery || delivery.status !== "leased") return null;
    const attemptCount = delivery.attemptCount + 1;
    const exhausted = attemptCount >= delivery.maxAttempts;
    const updated: RegistrationDeliveryOutboxEntry = {
      ...delivery,
      attemptCount,
      availableAt: exhausted ? delivery.availableAt : iso(new Date(Date.now() + input.retryAfterMs)),
      lockedAt: null,
      lockedBy: null,
      status: exhausted ? "failed" : "queued",
      updatedAt: iso(new Date()),
    };
    this.registrationDeliveryOutbox.set(deliveryId, updated);
    return cloneDelivery(updated);
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
      attemptCount: 0,
      availableAt: iso(new Date()),
      channel: input.channel,
      createdAt: iso(new Date()),
      destinationPreview: input.destinationPreview,
      draftId,
      id: randomUUID(),
      lockedAt: null,
      lockedBy: null,
      maxAttempts: 5,
      purpose: input.purpose,
      status: "queued",
      templateKey: input.templateKey,
      updatedAt: iso(new Date()),
    };
    this.registrationDeliveryOutbox.set(delivery.id, delivery);
    this.registrationDeliveryCodes.set(delivery.id, input.verificationCode);
    return delivery;
  }
}
