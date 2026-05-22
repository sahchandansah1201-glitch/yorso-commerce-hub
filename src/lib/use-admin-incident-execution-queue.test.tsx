import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BuyerSession } from "@/lib/buyer-session";
import { useAdminIncidentExecutionQueue } from "@/lib/use-admin-incident-execution-queue";

const adminSession: BuyerSession = {
  displayName: "Admin",
  id: "session-admin-incident-execution-queue-hook",
  identifier: "admin@yorso.test",
  method: "email",
  signedInAt: "2026-05-20T10:00:00.000Z",
  source: "self_hosted",
  userId: "00000000-0000-4000-8000-000000000099",
};

const queuePayload = (status: "open" | "in_progress" | "done" = "open") => ({
  generatedAt: "2026-05-20T10:15:00.000Z",
  items: [
    {
      assignedToUserHash: null,
      blockedReason: null,
      completedAt: status === "done" ? "2026-05-20T10:16:00.000Z" : null,
      description: "Confirm admin role.",
      evidenceNote: status === "done" ? "Evidence captured." : null,
      evidenceRequired: "Audit route evidence.",
      incidentDueAt: "2026-05-20T11:00:00.000Z",
      incidentId: "audit:admin-blocked:v1-admin-audit-events",
      incidentSeverity: "high",
      incidentSlaStatus: "breached",
      incidentSource: "audit",
      incidentStatus: "open",
      incidentTitle: "Blocked admin route access",
      itemId: "remediation:01:confirm-scope",
      note: null,
      overdue: true,
      ownerRole: "operator",
      priority: "immediate",
      source: "remediation_step",
      status,
      targetDueAt: "2026-05-20T10:15:00.000Z",
      targetMinutes: 15,
      title: "Confirm scope",
      updatedAt: status === "open" ? null : "2026-05-20T10:16:00.000Z",
      updatedByUserHash: status === "open" ? null : "sha256:aaaaaaaaaaaaaaaaaaaaaaaa",
    },
  ],
  limit: 50,
  offset: 0,
  ok: true,
  requestId: "00000000-0000-4000-8000-000000000741",
  summary: {
    assigned: 0,
    blocked: 0,
    done: status === "done" ? 1 : 0,
    inProgress: status === "in_progress" ? 1 : 0,
    open: status === "open" ? 1 : 0,
    overdue: status === "done" ? 0 : 1,
    skipped: 0,
    total: 1,
    unassigned: 1,
  },
});

describe("useAdminIncidentExecutionQueue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled without a configured self-hosted API", () => {
    vi.stubEnv("VITE_YORSO_API_URL", "");

    const { result } = renderHook(() => useAdminIncidentExecutionQueue(adminSession, { limit: 50 }));

    expect(result.current.status).toBe("disabled");
  });

  it("loads queue filters and replaces items after bulk update", async () => {
    vi.stubEnv("VITE_YORSO_API_URL", "https://api.yorso.test");
    const fetchImpl = vi.fn(async (input) => {
      const url = String(input);
      if (url.endsWith("/execution-queue/bulk")) {
        return new Response(JSON.stringify({
          failed: [],
          ok: true,
          requestId: "00000000-0000-4000-8000-000000000742",
          succeeded: 1,
          updatedItems: queuePayload("done").items,
        }), { headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify(queuePayload()), {
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchImpl);

    const { result } = renderHook(() =>
      useAdminIncidentExecutionQueue(adminSession, {
        limit: 50,
        overdueOnly: true,
        priority: "immediate",
        status: "open",
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.items[0].itemId).toBe("remediation:01:confirm-scope");
    expect(String(fetchImpl.mock.calls[0][0])).toContain("status=open");
    expect(String(fetchImpl.mock.calls[0][0])).toContain("priority=immediate");
    expect(String(fetchImpl.mock.calls[0][0])).toContain("overdueOnly=true");

    await act(async () => {
      await result.current.bulkUpdate({
        evidenceNote: "Evidence captured.",
        items: [{ incidentId: "audit:admin-blocked:v1-admin-audit-events", itemId: "remediation:01:confirm-scope" }],
        status: "done",
      });
    });

    expect(result.current.data?.items[0].status).toBe("done");
    expect(result.current.data?.summary.done).toBe(1);
    const bulkRequest = (fetchImpl.mock.calls as Array<[unknown, RequestInit?]>)[1]?.[1];
    expect(bulkRequest?.method).toBe("POST");
  });
});
