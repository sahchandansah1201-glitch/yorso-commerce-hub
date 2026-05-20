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

    const acknowledged = await repository.markNotificationsRead({
      buyerUserId,
      notificationIds: [approved.notification?.id ?? ""],
    });
    expect(acknowledged).toEqual([
      expect.objectContaining({
        id: approved.notification?.id,
        status: "read",
        readAt: expect.any(String),
      }),
    ]);
    await expect(repository.listNotifications({ buyerUserId, limit: 10, offset: 0 })).resolves.toEqual([
      expect.objectContaining({ id: approved.notification?.id, status: "read" }),
    ]);
  });

  it("lists access requests for the admin review queue with bounded filters and summary", async () => {
    const repository = new MemorySupplierAccessRepository();
    const first = await repository.createOrReuseRequest({
      buyerUserId,
      supplierId,
      message: "Need exact price for salmon",
    });
    const second = await repository.createOrReuseRequest({
      buyerUserId: "00000000-0000-4000-8000-000000000099",
      supplierId: "sup-ec-051",
      message: "Shrimp price request",
    });

    await repository.decideRequest({
      requestId: second.id,
      actorUserId: reviewerUserId,
      decision: { status: "pending" },
    });

    const open = await repository.listReviewRequests({
      limit: 25,
      offset: 0,
      status: "open",
    });
    expect(open.total).toBe(2);
    expect(open.summary).toMatchObject({
      approved: 0,
      open: 2,
      pending: 1,
      rejected: 0,
      revoked: 0,
      sent: 1,
    });
    expect(open.items).toEqual([
      expect.objectContaining({
        request: expect.objectContaining({
          id: second.id,
          status: "pending",
        }),
        decisionSla: "fresh",
      }),
      expect.objectContaining({
        request: expect.objectContaining({
          id: first.id,
          status: "sent",
        }),
      }),
    ]);

    const filtered = await repository.listReviewRequests({
      limit: 25,
      offset: 0,
      q: "salmon",
      status: "all",
    });
    expect(filtered.total).toBe(1);
    expect(filtered.items[0].request.id).toBe(first.id);
    expect(JSON.stringify(filtered)).not.toContain("admin@example.com");
  });
});
