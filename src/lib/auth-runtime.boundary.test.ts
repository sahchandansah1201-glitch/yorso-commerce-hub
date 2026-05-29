import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("auth-runtime self-hosted boundary", () => {
  it("keeps auth runtime free of Supabase prototype fallback code", () => {
    const authRuntime = readFileSync("src/lib/auth-runtime.ts", "utf8");

    expect(authRuntime).toContain("local_contract");
    expect(authRuntime).toContain("self_hosted");
    expect(authRuntime).toContain("isSelfHostedAuthConfigured");
    expect(authRuntime).toContain("/v1/auth/sign-in");
    expect(authRuntime).toContain("/v1/auth/password-reset/request");
    expect(authRuntime).toContain("/v1/auth/password-reset/complete");
    expect(authRuntime).toContain("/v1/auth/session");
    expect(authRuntime).toContain("/v1/auth/sign-out");
    expect(authRuntime).toContain("buyerSession");
    expect(authRuntime).not.toContain("@/integrations/supabase/client");
    expect(authRuntime).not.toContain("legacy-auth-supabase-adapter");
    expect(authRuntime).not.toContain("supabase_prototype");
    expect(authRuntime).not.toContain("VITE_SUPABASE");
    expect(existsSync("src/lib/legacy-auth-supabase-adapter.ts")).toBe(false);
  });
});
