import {
  supplierAccessDecisionResponseSchema,
  supplierAccessDecisionSchema,
  supplierAccessGrantListResponseSchema,
  supplierAccessGrantQuerySchema,
  supplierAccessGrantRevokeResponseSchema,
  supplierAccessGrantRevokeSchema,
  supplierAccessNotificationsAckResponseSchema,
  supplierAccessNotificationsAckSchema,
  supplierAccessNotificationsResponseSchema,
  supplierAccessReviewListResponseSchema,
  supplierAccessReviewQuerySchema,
  supplierAccessRequestCreateSchema,
  supplierAccessRequestResponseSchema,
} from "../../../../../packages/contracts/dist/index.js";
import type { SupplierAccessRepository } from "./repository.js";

export class SupplierAccessService {
  constructor(private readonly repository: SupplierAccessRepository) {}

  async getSupplierAccessRequest(input: {
    buyerUserId: string;
    supplierId: string;
    requestId: string;
  }) {
    const request = await this.repository.getRequest(input);
    const accessGranted = await this.repository.hasSupplierAccess(input);
    return supplierAccessRequestResponseSchema.parse({
      ok: true,
      request,
      accessGranted,
      requestId: input.requestId,
    });
  }

  async requestSupplierAccess(input: {
    buyerUserId: string;
    supplierId: string;
    payload: unknown;
    requestId: string;
  }) {
    const payload = supplierAccessRequestCreateSchema.parse(input.payload);
    const request = await this.repository.createOrReuseRequest({
      buyerUserId: input.buyerUserId,
      supplierId: input.supplierId,
      message: payload.message,
    });
    const accessGranted = await this.repository.hasSupplierAccess(input);
    return supplierAccessRequestResponseSchema.parse({
      ok: true,
      request,
      accessGranted,
      requestId: input.requestId,
    });
  }

  async decideSupplierAccessRequest(input: {
    requestIdParam: string;
    actorUserId: string;
    payload: unknown;
    responseRequestId: string;
  }) {
    const decision = supplierAccessDecisionSchema.parse(input.payload);
    const result = await this.repository.decideRequest({
      requestId: input.requestIdParam,
      actorUserId: input.actorUserId,
      decision,
    });

    return supplierAccessDecisionResponseSchema.parse({
      ok: true,
      ...result,
      requestId: input.responseRequestId,
    });
  }

  async listReviewRequests(input: {
    rawQuery: Record<string, string | undefined>;
    requestId: string;
  }) {
    const query = supplierAccessReviewQuerySchema.parse(input.rawQuery);
    const result = await this.repository.listReviewRequests(query);
    return supplierAccessReviewListResponseSchema.parse({
      ok: true,
      items: result.items,
      limit: query.limit,
      offset: query.offset,
      total: result.total,
      summary: result.summary,
      requestId: input.requestId,
    });
  }

  async listAdminGrants(input: {
    rawQuery: Record<string, string | undefined>;
    requestId: string;
  }) {
    const query = supplierAccessGrantQuerySchema.parse(input.rawQuery);
    const result = await this.repository.listAdminGrants(query);
    return supplierAccessGrantListResponseSchema.parse({
      ok: true,
      items: result.items,
      limit: query.limit,
      offset: query.offset,
      total: result.total,
      summary: result.summary,
      requestId: input.requestId,
    });
  }

  async revokeAdminGrant(input: {
    grantIdParam: string;
    actorUserId: string;
    payload: unknown;
    responseRequestId: string;
  }) {
    const payload = supplierAccessGrantRevokeSchema.parse(input.payload ?? {});
    const result = await this.repository.revokeGrant({
      grantId: input.grantIdParam,
      actorUserId: input.actorUserId,
      reason: payload.reason,
    });

    return supplierAccessGrantRevokeResponseSchema.parse({
      ok: true,
      ...result,
      accessGranted: false,
      requestId: input.responseRequestId,
    });
  }

  async listNotifications(input: {
    buyerUserId: string;
    rawQuery: Record<string, string | undefined>;
    requestId: string;
  }) {
    const limit = Math.min(Math.max(Number(input.rawQuery.limit ?? 20), 1), 50);
    const offset = Math.min(Math.max(Number(input.rawQuery.offset ?? 0), 0), 10000);
    const notifications = await this.repository.listNotifications({
      buyerUserId: input.buyerUserId,
      limit,
      offset,
    });

    return supplierAccessNotificationsResponseSchema.parse({
      ok: true,
      notifications,
      requestId: input.requestId,
    });
  }

  async acknowledgeNotifications(input: {
    buyerUserId: string;
    payload: unknown;
    requestId: string;
  }) {
    const payload = supplierAccessNotificationsAckSchema.parse(input.payload);
    const notifications = await this.repository.markNotificationsRead({
      buyerUserId: input.buyerUserId,
      notificationIds: payload.notificationIds,
    });

    return supplierAccessNotificationsAckResponseSchema.parse({
      ok: true,
      notifications,
      markedReadCount: notifications.length,
      requestId: input.requestId,
    });
  }
}
