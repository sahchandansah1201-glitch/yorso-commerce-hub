import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = {
  apiClient: "src/lib/admin-incidents-api.ts",
  e2e: "e2e/admin-incident-trends.spec.ts",
  page: "src/pages/admin/AdminIncidentTrends.tsx",
  service: "apps/api/src/modules/admin-incidents/service.ts",
  smoke: "scripts/smoke-self-hosted-admin-incidents.mjs",
} as const;

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("Batch #107 admin incident trends security and scale guards", () => {
  it("keeps trend routes under self-hosted admin incident API and session headers", () => {
    const apiClient = read(files.apiClient);
    const e2e = read(files.e2e);

    expect(apiClient).toContain("/v1/admin/incidents/trends");
    expect(apiClient).toContain("ACCOUNT_USER_ID_HEADER");
    expect(apiClient).toContain("ACCOUNT_SESSION_ID_HEADER");
    expect(e2e).toContain("x-yorso-user-id");
    expect(e2e).toContain("x-yorso-session-id");
  });

  it("keeps sensitive values out of browser smoke assertions", () => {
    const e2e = read(files.e2e);

    expect(e2e).toContain("admin@yorso.test");
    expect(e2e).toContain("session_admin_incident_trends_e2e_107");
    expect(e2e).toContain("postgres://");
    expect(e2e).toContain("redis://");
  });

  it("does not add production Supabase or hosted BaaS imports to trend implementation", () => {
    const combined = [
      read(files.apiClient),
      read(files.page),
      read(files.service),
    ].join("\n");

    expect(combined).not.toContain("@/integrations/supabase/client");
    expect(combined).not.toContain("firebase");
    expect(combined).not.toContain("appwrite");
    expect(combined).not.toContain("auth0");
    expect(combined).not.toContain("clerk");
  });

  it("requires all trend smoke markers before the batch can be considered guarded", () => {
    const smoke = read(files.smoke);

    for (const marker of [
      "admin_incidents_trends=ok",
      "admin_incidents_trends_filters=ok",
      "admin_incidents_trends_export_json=ok",
      "admin_incidents_trends_export_csv=ok",
      "admin_incidents_trends_anomalies=ok",
      "admin_incidents_trends_briefing=ok",
    ]) {
      expect(smoke).toContain(marker);
    }
  });

  it("keeps trend page operator-driven instead of adding polling", () => {
    const page = read(files.page);

    expect(page).toContain("admin-incident-trends-refresh");
    expect(page).toContain("admin-incident-trends-anomalies-load");
    expect(page).toContain("admin-incident-trends-briefing-load");
    expect(page).not.toContain("setInterval");
  });
});
