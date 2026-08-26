import { describe, expect, it } from "vitest";
import { createAuthRepository } from "./factory.js";

describe("createAuthRepository local account bootstrap", () => {
  it("adds the configured development user and roles to memory auth", async () => {
    const repository = createAuthRepository({
      accountRepository: "memory",
      databaseUrl: "postgres://yorso:local@localhost:5432/yorso",
      registrationVerificationCodeSecret: "local-registration-secret-at-least-32-bytes",
      localAuthEmail: "local.user@example.com",
      localAuthPassword: "local-password-123",
      localAuthDisplayName: "Local User",
      localAuthRoles: ["admin", "support", "company_admin", "buyer", "supplier"],
    });

    const user = await repository.findUserByEmail("LOCAL.USER@EXAMPLE.COM");

    expect(user).toMatchObject({
      email: "local.user@example.com",
      displayName: "Local User",
      passwordSecret: "plain:local-password-123",
    });
    expect(await repository.hasAnyRole(user!.id, ["admin"])).toBe(true);
    expect(await repository.hasAnyRole(user!.id, ["support"])).toBe(true);
    expect(await repository.hasAnyRole(user!.id, ["company_admin"])).toBe(true);
    expect(await repository.hasAnyRole(user!.id, ["buyer"])).toBe(true);
    expect(await repository.hasAnyRole(user!.id, ["supplier"])).toBe(true);
  });
});
