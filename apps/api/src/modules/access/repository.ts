import { randomUUID } from "node:crypto";
import type {
  SupplierAccessDecision,
  SupplierAccessEvent,
  SupplierAccessEventType,
  SupplierAccessGrant,
  SupplierAccessGrantAdminItem,
  SupplierAccessGrantQuery,
  SupplierAccessGrantSummary,
  SupplierAccessNotification,
  SupplierAccessRequest,
  SupplierAccessReviewItem,
  SupplierAccessReviewQuery,
  SupplierAccessReviewSummary,
  SupplierAccessStatus,
} from "../../../../../packages/contracts/dist/index.js";

export interface SupplierAccessRepository {
  getRequest(input: { buyerUserId: string; supplierId: string }): Promise<SupplierAccessRequest | null>;
  createOrReuseRequest(input: { buyerUserId: string; supplierId: string; message?: string }): Promise<SupplierAccessRequest>;
  listReviewRequests(input: SupplierAccessReviewQuery): Promise<{
    items: SupplierAccessReviewItem[];
    summary: SupplierAccessReviewSummary;
    total: number;
  }>;
  listAdminGrants(input: SupplierAccessGrantQuery): Promise<{
    items: SupplierAccessGrantAdminItem[];
    summary: SupplierAccessGrantSummary;
    total: number;
  }>;
  revokeGrant(input: {
    grantId: string;
    actorUserId: string;
    reason?: string;
  }): Promise<{
    request: SupplierAccessRequest | null;
    revokedGrants: SupplierAccessGrant[];
  }>;
  decideRequest(input: {
    requestId: string;
    actorUserId: string;
    decision: SupplierAccessDecision;
  }): Promise<{
    request: SupplierAccessRequest;
    grants: SupplierAccessGrant[];
    notification: SupplierAccessNotification | null;
  }>;
  hasSupplierAccess(input: { buyerUserId: string; supplierId: string }): Promise<boolean>;
  listAccessibleSupplierIds(input: { buyerUserId: string }): Promise<string[]>;
  listNotifications(input: { buyerUserId: string; limit: number; offset: number }): Promise<SupplierAccessNotification[]>;
  markNotificationsRead(input: { buyerUserId: string; notificationIds: string[] }): Promise<SupplierAccessNotification[]>;
}

const nowIso = () => new Date().toISOString();
const clone = <T>(value: T): T => structuredClone(value);

const eventTypeForStatus = (status: SupplierAccessStatus): SupplierAccessEventType => {
  if (status === "pending") return "supplier_access_pending";
  if (status === "approved") return "supplier_access_approved";
  if (status === "rejected") return "supplier_access_rejected";
  if (status === "revoked") return "supplier_access_revoked";
  return "supplier_access_requested";
};

const emptySummary = (): SupplierAccessReviewSummary => ({
  approved: 0,
  open: 0,
  pending: 0,
  rejected: 0,
  revoked: 0,
  sent: 0,
});

const decisionSla = (createdAt: string): SupplierAccessReviewItem["decisionSla"] => {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (ageHours >= 48) return "overdue";
  if (ageHours >= 24) return "due_today";
  return "fresh";
};

const reviewStatusPriority = (status: SupplierAccessStatus) => {
  if (status === "pending") return 0;
  if (status === "sent") return 1;
  return 2;
};

const accessReviewMatches = (
  request: SupplierAccessRequest,
  query: SupplierAccessReviewQuery,
) => {
  if (query.status === "open" && request.status !== "sent" && request.status !== "pending") return false;
  if (query.status !== "open" && query.status !== "all" && request.status !== query.status) return false;
  if (!query.q) return true;
  const needle = query.q.toLowerCase();
  return [
    request.id,
    request.buyerUserId,
    request.supplierId,
    request.status,
    request.intent,
    request.message,
  ].some((value) => value.toLowerCase().includes(needle));
};

const emptyGrantSummary = (): SupplierAccessGrantSummary => ({
  active: 0,
  expired: 0,
  total: 0,
});

const isGrantActive = (grant: SupplierAccessGrant) =>
  !grant.expiresAt || new Date(grant.expiresAt).getTime() > Date.now();

const grantGroupMatches = (
  grants: SupplierAccessGrant[],
  request: SupplierAccessRequest | null,
  query: SupplierAccessGrantQuery,
) => {
  const active = grants.some(isGrantActive);
  if (query.status === "active" && !active) return false;
  if (query.status === "expired" && active) return false;
  if (!query.q) return true;

  const needle = query.q.toLowerCase();
  const values = [
    grants[0]?.id ?? "",
    grants[0]?.buyerUserId ?? "",
    grants[0]?.supplierId ?? "",
    request?.id ?? "",
    request?.status ?? "",
    request?.message ?? "",
    ...grants.map((grant) => grant.scope),
  ];
  return values.some((value) => value.toLowerCase().includes(needle));
};

export class MemorySupplierAccessRepository implements SupplierAccessRepository {
  private readonly requests = new Map<string, SupplierAccessRequest>();
  private readonly grants = new Map<string, SupplierAccessGrant>();
  private readonly notifications = new Map<string, SupplierAccessNotification>();
  private readonly events: SupplierAccessEvent[] = [];

  private key(buyerUserId: string, supplierId: string) {
    return `${buyerUserId}:${supplierId}`;
  }

  async getRequest(input: { buyerUserId: string; supplierId: string }) {
    return clone(this.requests.get(this.key(input.buyerUserId, input.supplierId)) ?? null);
  }

  async createOrReuseRequest(input: { buyerUserId: string; supplierId: string; message?: string }) {
    const existing = this.requests.get(this.key(input.buyerUserId, input.supplierId));
    if (existing) return clone(existing);

    const at = nowIso();
    const request: SupplierAccessRequest = {
      id: randomUUID(),
      buyerUserId: input.buyerUserId,
      supplierId: input.supplierId,
      status: "sent",
      intent: "exact_price",
      message: input.message ?? "",
      createdAt: at,
      updatedAt: at,
      decidedAt: null,
      decidedByUserId: null,
    };
    this.requests.set(this.key(input.buyerUserId, input.supplierId), request);
    this.events.push(this.createEvent(request, "supplier_access_requested", input.buyerUserId));
    return clone(request);
  }

  async listReviewRequests(input: SupplierAccessReviewQuery) {
    const summary = emptySummary();
    for (const request of this.requests.values()) {
      summary[request.status] += 1;
      if (request.status === "sent" || request.status === "pending") summary.open += 1;
    }

    const filtered = [...this.requests.values()]
      .filter((request) => accessReviewMatches(request, input))
      .sort(
        (a, b) =>
          reviewStatusPriority(a.status) - reviewStatusPriority(b.status) ||
          b.updatedAt.localeCompare(a.updatedAt) ||
          a.id.localeCompare(b.id),
      );

    const items = filtered.slice(input.offset, input.offset + input.limit).map((request) => {
      const ageHours = Math.max(0, (Date.now() - new Date(request.createdAt).getTime()) / 3_600_000);
      return {
        request: clone(request),
        buyer: {
          userId: request.buyerUserId,
          displayName: "Buyer account",
          companyName: null,
          accountRole: "buyer" as const,
          countryCode: null,
        },
        supplier: {
          supplierId: request.supplierId,
          maskedName: `${request.supplierId} supplier`,
          companyName: null,
          country: null,
          city: null,
          verificationLevel: null,
        },
        ageHours,
        decisionSla: decisionSla(request.createdAt),
      } satisfies SupplierAccessReviewItem;
    });

    return {
      items: clone(items),
      summary,
      total: filtered.length,
    };
  }

  async listAdminGrants(input: SupplierAccessGrantQuery) {
    const grouped = this.groupGrants();
    const summary = emptyGrantSummary();

    for (const grants of grouped.values()) {
      const active = grants.some(isGrantActive);
      summary.total += 1;
      if (active) summary.active += 1;
      else summary.expired += 1;
    }

    const filtered = [...grouped.values()]
      .filter((grants) => {
        const request = this.requests.get(this.key(grants[0].buyerUserId, grants[0].supplierId)) ?? null;
        return grantGroupMatches(grants, request, input);
      })
      .sort(
        (a, b) =>
          b[0].grantedAt.localeCompare(a[0].grantedAt) ||
          a[0].buyerUserId.localeCompare(b[0].buyerUserId) ||
          a[0].supplierId.localeCompare(b[0].supplierId),
      );

    const items = filtered.slice(input.offset, input.offset + input.limit).map((grants) => {
      const primary = grants.find((grant) => grant.scope === "supplier_identity") ?? grants[0];
      const active = grants.some(isGrantActive);
      const request = this.requests.get(this.key(primary.buyerUserId, primary.supplierId)) ?? null;
      const grantedAt = grants.map((grant) => grant.grantedAt).sort()[0];
      const expiresAtValues = grants
        .map((grant) => grant.expiresAt)
        .filter((value): value is string => Boolean(value))
        .sort();
      return {
        id: primary.id,
        buyer: {
          userId: primary.buyerUserId,
          displayName: "Buyer account",
          companyName: null,
          accountRole: "buyer" as const,
          countryCode: null,
        },
        supplier: {
          supplierId: primary.supplierId,
          maskedName: `${primary.supplierId} supplier`,
          companyName: active ? `${primary.supplierId} company` : null,
          country: null,
          city: null,
          verificationLevel: null,
        },
        supplierId: primary.supplierId,
        buyerUserId: primary.buyerUserId,
        scopes: grants.map((grant) => grant.scope).sort(),
        grants: clone(grants.sort((a, b) => a.scope.localeCompare(b.scope))),
        request: request ? clone(request) : null,
        grantedAt,
        expiresAt: active ? null : expiresAtValues.at(-1) ?? null,
        grantedByUserId: primary.grantedByUserId,
        ageHours: Math.max(0, (Date.now() - new Date(grantedAt).getTime()) / 3_600_000),
        isActive: active,
      } satisfies SupplierAccessGrantAdminItem;
    });

    return {
      items: clone(items),
      summary,
      total: filtered.length,
    };
  }

  async revokeGrant(input: { grantId: string; actorUserId: string; reason?: string }) {
    const target = this.grants.get(input.grantId) ?? [...this.grants.values()].find((grant) => grant.id === input.grantId);
    if (!target) throw new Error("supplier_access_grant_not_found");

    const at = nowIso();
    const revokedGrants: SupplierAccessGrant[] = [];
    for (const [key, grant] of this.grants.entries()) {
      if (grant.buyerUserId !== target.buyerUserId || grant.supplierId !== target.supplierId || !isGrantActive(grant)) {
        continue;
      }
      const revoked: SupplierAccessGrant = { ...grant, expiresAt: at };
      this.grants.set(key, revoked);
      revokedGrants.push(revoked);
    }

    const request = this.requests.get(this.key(target.buyerUserId, target.supplierId)) ?? null;
    const updatedRequest = request
      ? {
          ...request,
          status: "revoked" as const,
          message: input.reason ?? request.message,
          updatedAt: at,
          decidedAt: at,
          decidedByUserId: input.actorUserId,
        }
      : null;
    if (updatedRequest) this.requests.set(this.key(updatedRequest.buyerUserId, updatedRequest.supplierId), updatedRequest);

    this.events.push({
      id: randomUUID(),
      buyerUserId: target.buyerUserId,
      supplierId: target.supplierId,
      requestId: updatedRequest?.id ?? null,
      eventType: "supplier_access_revoked",
      actorUserId: input.actorUserId,
      metadata: { grantId: input.grantId, reason: input.reason ?? "" },
      createdAt: at,
    });

    return {
      request: clone(updatedRequest),
      revokedGrants: clone(revokedGrants.sort((a, b) => a.scope.localeCompare(b.scope))),
    };
  }

  async decideRequest(input: { requestId: string; actorUserId: string; decision: SupplierAccessDecision }) {
    const request = [...this.requests.values()].find((item) => item.id === input.requestId);
    if (!request) throw new Error("supplier_access_request_not_found");

    const at = nowIso();
    const updated: SupplierAccessRequest = {
      ...request,
      status: input.decision.status,
      message: input.decision.message ?? request.message,
      updatedAt: at,
      decidedAt: at,
      decidedByUserId: input.actorUserId,
    };
    this.requests.set(this.key(updated.buyerUserId, updated.supplierId), updated);
    this.events.push(this.createEvent(updated, eventTypeForStatus(updated.status), input.actorUserId));

    const grants = updated.status === "approved" ? this.upsertApprovalGrants(updated, input.actorUserId, at) : [];
    if (updated.status === "revoked") {
      await this.revokeGrant({
        actorUserId: input.actorUserId,
        grantId: `${updated.buyerUserId}:${updated.supplierId}:supplier_identity`,
        reason: input.decision.message,
      }).catch(() => ({ request: updated, revokedGrants: [] }));
    }
    const notification = updated.status === "approved" ? this.createApprovalNotification(updated, at) : null;

    return {
      request: clone(updated),
      grants: clone(grants),
      notification: clone(notification),
    };
  }

  async hasSupplierAccess(input: { buyerUserId: string; supplierId: string }) {
    return [...this.grants.values()].some(
      (grant) =>
        grant.buyerUserId === input.buyerUserId &&
        grant.supplierId === input.supplierId &&
        grant.scope === "supplier_identity" &&
        (!grant.expiresAt || new Date(grant.expiresAt).getTime() > Date.now()),
    );
  }

  async listAccessibleSupplierIds(input: { buyerUserId: string }) {
    const now = Date.now();
    return [
      ...new Set(
        [...this.grants.values()]
          .filter(
            (grant) =>
              grant.buyerUserId === input.buyerUserId &&
              grant.scope === "supplier_identity" &&
              (!grant.expiresAt || new Date(grant.expiresAt).getTime() > now),
          )
          .map((grant) => grant.supplierId),
      ),
    ].sort();
  }

  async listNotifications(input: { buyerUserId: string; limit: number; offset: number }) {
    return clone(
      [...this.notifications.values()]
        .filter((notification) => notification.buyerUserId === input.buyerUserId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(input.offset, input.offset + input.limit),
    );
  }

  async markNotificationsRead(input: { buyerUserId: string; notificationIds: string[] }) {
    const idSet = new Set(input.notificationIds);
    const at = nowIso();
    const updated: SupplierAccessNotification[] = [];

    for (const notification of this.notifications.values()) {
      if (notification.buyerUserId !== input.buyerUserId || !idSet.has(notification.id)) {
        continue;
      }

      const next: SupplierAccessNotification = {
        ...notification,
        status: "read",
        readAt: notification.readAt ?? at,
      };
      this.notifications.set(notification.id, next);
      this.events.push({
        id: randomUUID(),
        buyerUserId: next.buyerUserId,
        supplierId: next.supplierId,
        requestId: null,
        eventType: "notification_read",
        actorUserId: input.buyerUserId,
        metadata: { notificationId: next.id },
        createdAt: at,
      });
      updated.push(next);
    }

    return clone(updated.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  private createEvent(
    request: SupplierAccessRequest,
    eventType: SupplierAccessEventType,
    actorUserId: string | null,
  ): SupplierAccessEvent {
    return {
      id: randomUUID(),
      buyerUserId: request.buyerUserId,
      supplierId: request.supplierId,
      requestId: request.id,
      eventType,
      actorUserId,
      metadata: {},
      createdAt: nowIso(),
    };
  }

  private groupGrants() {
    const grouped = new Map<string, SupplierAccessGrant[]>();
    for (const grant of this.grants.values()) {
      const key = this.key(grant.buyerUserId, grant.supplierId);
      const next = grouped.get(key) ?? [];
      next.push(clone(grant));
      grouped.set(key, next);
    }
    return grouped;
  }

  private upsertApprovalGrants(
    request: SupplierAccessRequest,
    actorUserId: string,
    grantedAt: string,
  ): SupplierAccessGrant[] {
    const scopes: Array<SupplierAccessGrant["scope"]> = ["supplier_identity", "offer_price"];
    return scopes.map((scope) => {
      const key = `${request.buyerUserId}:${request.supplierId}:${scope}`;
      const grant: SupplierAccessGrant = {
        id: this.grants.get(key)?.id ?? randomUUID(),
        buyerUserId: request.buyerUserId,
        supplierId: request.supplierId,
        scope,
        offerId: null,
        grantedByUserId: actorUserId,
        grantedAt,
        expiresAt: null,
      };
      this.grants.set(key, grant);
      return grant;
    });
  }

  private createApprovalNotification(request: SupplierAccessRequest, createdAt: string) {
    const notification: SupplierAccessNotification = {
      id: randomUUID(),
      buyerUserId: request.buyerUserId,
      supplierId: request.supplierId,
      type: "price_access_approved",
      title: "Price access approved",
      body: "The supplier approved your request. Exact prices and supplier details are now available.",
      status: "unread",
      createdAt,
      readAt: null,
    };
    this.notifications.set(notification.id, notification);
    this.events.push({
      id: randomUUID(),
      buyerUserId: request.buyerUserId,
      supplierId: request.supplierId,
      requestId: request.id,
      eventType: "notification_created",
      actorUserId: null,
      metadata: { notificationId: notification.id },
      createdAt,
    });
    return notification;
  }
}
