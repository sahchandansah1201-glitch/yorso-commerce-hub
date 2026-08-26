import { describe, expect, it } from "vitest";

import { loadApiConfig } from "./config.js";

describe("local auth bootstrap configuration", () => {
  it("loads a local account only from development environment settings", () => {
    const config = loadApiConfig({
      NODE_ENV: "development",
      ACCOUNT_REPOSITORY: "memory",
      YORSO_LOCAL_AUTH_EMAIL: "local.user@example.com",
      YORSO_LOCAL_AUTH_PASSWORD: "local-password-123",
      YORSO_LOCAL_AUTH_DISPLAY_NAME: "Local User",
      YORSO_LOCAL_AUTH_ROLES: "admin,support,company_admin,buyer,supplier",
    });

    expect(config).toMatchObject({
      localAuthEmail: "local.user@example.com",
      localAuthPassword: "local-password-123",
      localAuthDisplayName: "Local User",
      localAuthRoles: ["admin", "support", "company_admin", "buyer", "supplier"],
    });
  });

  it("rejects the local account outside development", () => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "production",
        ACCOUNT_REPOSITORY: "memory",
        YORSO_LOCAL_AUTH_EMAIL: "local.user@example.com",
        YORSO_LOCAL_AUTH_PASSWORD: "local-password-123",
      }),
    ).toThrow("allowed only for the development memory repository");
  });

  it("rejects the local account for the postgres repository", () => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "development",
        ACCOUNT_REPOSITORY: "postgres",
        YORSO_LOCAL_AUTH_EMAIL: "local.user@example.com",
        YORSO_LOCAL_AUTH_PASSWORD: "local-password-123",
      }),
    ).toThrow("allowed only for the development memory repository");
  });

  it.each([
    { YORSO_LOCAL_AUTH_EMAIL: "local.user@example.com" },
    { YORSO_LOCAL_AUTH_PASSWORD: "local-password-123" },
  ])("requires the local email and password as a pair", (credentials) => {
    expect(() =>
      loadApiConfig({
        NODE_ENV: "development",
        ACCOUNT_REPOSITORY: "memory",
        ...credentials,
      }),
    ).toThrow("requires both YORSO_LOCAL_AUTH_EMAIL and YORSO_LOCAL_AUTH_PASSWORD");
  });
});
