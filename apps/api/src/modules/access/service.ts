import {
  supplierAccessDecisionResponseSchema,
  supplierAccessDecisionSchema,
  supplierAccessNotificationsResponseSchema,
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
}
