import { describe, expect, it } from "vitest";
import { MemorySupplierAccessRepository } from "./repository.js";

const buyerUserId = "00000000-0000-4000-8000-000000000001";
const reviewerUserId = "00000000-0000-4000-8000-000000000002";
const supplierId = "sup-no-001";

describe("MemorySupplierAccessRepository", () => {
  it("creates idempotent one-click supplier access requests", async () => {
    const repository = new MemorySupplierAccessRepository();

    const first = await repository.createOrReuseRequest({
      buyerUserId,
      supplierId,
      message: "Need exact price",
    });
    const second = await repository.createOrReuseRequest({
      buyerUserId,
      supplierId,
      message: "Duplicate click",
    });

    expect(first).toMatchObject({
      buyerUserId,
      supplierId,
      status: "sent",
      intent: "exact_price",
    });
    expect(second.id).toBe(first.id);
    expect(second.message).toBe("Need exact price");
    await expect(repository.hasSupplierAccess({ buyerUserId, supplierId })).resolves.toBe(false);
    await expect(repository.listAccessibleSupplierIds({ buyerUserId })).resolves.toEqual([]);
  });

  it("moves request through pending and approval, then creates grants and notification", async () => {
    const repository = new MemorySupplierAccessRepository();
    const request = await repository.createOrReuseRequest({ buyerUserId, supplierId });

    const pending = await repository.decideRequest({
      requestId: request.id,
      actorUserId: reviewerUserId,
      decision: { status: "pending" },
    });
    expect(pending.request.status).toBe("pending");
    expect(pending.grants).toEqual([]);
    expect(pending.notification).toBeNull();

    const approved = await repository.decideRequest({
      requestId: request.id,
      actorUserId: reviewerUserId,
      decision: { status: "approved" },
    });
    expect(approved.request).toMatchObject({
      id: request.id,
      status: "approved",
      decidedByUserId: reviewerUserId,
    });
    expect(approved.grants.map((grant) => grant.scope).sort()).toEqual([
      "offer_price",
      "supplier_identity",
    ]);
    expect(approved.notification).toMatchObject({
      buyerUserId,
      supplierId,
      type: "price_access_approved",
      status: "unread",
    });
    await expect(repository.hasSupplierAccess({ buyerUserId, supplierId })).resolves.toBe(true);
    await expect(repository.listAccessibleSupplierIds({ buyerUserId })).resolves.toEqual([supplierId]);
    await expect(repository.listNotifications({ buyerUserId, limit: 10, offset: 0 })).resolves.toHaveLength(1);
  });
});
