import { randomUUID } from "node:crypto";
import type {
  SupplierAccessDecision,
  SupplierAccessEvent,
  SupplierAccessEventType,
  SupplierAccessGrant,
  SupplierAccessNotification,
  SupplierAccessRequest,
  SupplierAccessStatus,
} from "../../../../../packages/contracts/dist/index.js";

export interface SupplierAccessRepository {
  getRequest(input: { buyerUserId: string; supplierId: string }): Promise<SupplierAccessRequest | null>;
  createOrReuseRequest(input: { buyerUserId: string; supplierId: string; message?: string }): Promise<SupplierAccessRequest>;
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
