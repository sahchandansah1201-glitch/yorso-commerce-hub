import { afterEach, describe, expect, it } from "vitest";
import { buyerSession, BUYER_SESSION_STORAGE_KEY } from "@/lib/buyer-session";

describe("buyerSession self-hosted session fields", () => {
  afterEach(() => {
    buyerSession.__resetForTests();
    sessionStorage.clear();
  });

  it("persists backend session id, user id, source and expiry for API headers", () => {
    const session = buyerSession.signIn({
      displayName: "Buyer QA",
      expiresAt: "2026-05-20T12:00:00.000Z",
      id: "session_self_hosted_12345678901234567890",
      identifier: "buyer@yorso.test",
      method: "email",
      signedInAt: "2026-05-19T12:00:00.000Z",
      source: "self_hosted",
      userId: "00000000-0000-4000-8000-000000000074",
    });

    expect(session).toMatchObject({
      displayName: "Buyer QA",
      expiresAt: "2026-05-20T12:00:00.000Z",
      id: "session_self_hosted_12345678901234567890",
      source: "self_hosted",
      userId: "00000000-0000-4000-8000-000000000074",
    });
    expect(JSON.parse(sessionStorage.getItem(BUYER_SESSION_STORAGE_KEY) ?? "{}")).toMatchObject({
      id: "session_self_hosted_12345678901234567890",
      source: "self_hosted",
      userId: "00000000-0000-4000-8000-000000000074",
    });
  });
});
