import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("auth-runtime prototype boundary", () => {
  it("keeps direct Supabase imports out of auth-runtime.ts", () => {
    const authRuntime = readFileSync("src/lib/auth-runtime.ts", "utf8");
    const legacyAdapter = readFileSync(
      "src/lib/legacy-auth-supabase-adapter.ts",
      "utf8",
    );

    expect(authRuntime).toContain("legacy-auth-supabase-adapter");
    expect(authRuntime).toContain("local_contract");
    expect(authRuntime).toContain("supabase_prototype");
    expect(authRuntime).not.toContain("@/integrations/supabase/client");

    expect(legacyAdapter).toContain("@/integrations/supabase/client");
    expect(legacyAdapter).toContain("isLegacyAuthSupabaseConfigured");
    expect(legacyAdapter).toContain("signInWithPrototypeSupabase");
    expect(legacyAdapter).toContain("requestPrototypePasswordReset");
    expect(legacyAdapter).toContain("observePrototypePasswordRecovery");
    expect(legacyAdapter).toContain("updatePrototypeRecoveredPassword");
  });
});
