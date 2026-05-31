import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));

const runCli = (args: string[], env: NodeJS.ProcessEnv = {}) =>
  execFileSync("node", ["packages/db/dist/cli.js", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      PATH: process.env.PATH,
      NODE_ENV: "test",
      ...env,
    },
  });

const runCliFailure = (args: string[], env: NodeJS.ProcessEnv = {}) => {
  try {
    runCli(args, env);
    throw new Error("Expected CLI to fail");
  } catch (error) {
    const failure = error as { status?: number; stdout?: Buffer | string; stderr?: Buffer | string };
    return {
      status: failure.status,
      output: `${String(failure.stdout ?? "")}${String(failure.stderr ?? "")}`,
    };
  }
};

describe("self-hosted DB migration CLI", () => {
  it("prints static status without requiring a database", () => {
    const output = runCli(["status"]);

    expect(output).toContain("Static status from local plan");
    expect(output).toContain("0000_migration_registry planned");
    expect(output).toContain("0001_account_company_baseline planned");
    expect(output).toContain("0002_account_workspace_sections planned");
    expect(output).toContain("0003_account_files_and_documents planned");
    expect(output).toContain("0004_supplier_directory planned");
    expect(output).toContain("0005_supplier_directory_search_scaling planned");
    expect(output).toContain("0006_offer_catalog planned");
    expect(output).toContain("0007_supplier_access_flow planned");
    expect(output).toContain("0008_access_notification_ack planned");
    expect(output).toContain("0009_supplier_directory_pagination_sort planned");
    expect(output).toContain("0010_offer_catalog_pagination_sort planned");
    expect(output).toContain("0011_auth_sessions planned");
    expect(output).toContain("0012_auth_security_events planned");
    expect(output).toContain("0013_api_audit_events planned");
    expect(output).toContain("0014_admin_audit_access planned");
    expect(output).toContain("0015_admin_audit_retention_query_hardening planned");
    expect(output).toContain("0016_admin_audit_retention_runtime planned");
    expect(output).toContain("0017_supplier_access_review_queue planned");
    expect(output).toContain("0018_admin_access_grants_console planned");
    expect(output).toContain("0019_admin_incident_acknowledgements planned");
    expect(output).toContain("0020_admin_incident_workflow planned");
    expect(output).toContain("0021_admin_incident_execution planned");
    expect(output).toContain("0022_admin_incident_workload_correlation planned");
    expect(output).toContain("0023_admin_incident_trend_analytics planned");
    expect(output).toContain("0024_admin_incident_trend_actions planned");
    expect(output).toContain("0025_admin_incident_trend_action_queue planned");
    expect(output).toContain("0026_registration_account_source planned");
    expect(output).toContain("0027_registration_verification_delivery_outbox planned");
    expect(output).toContain("0028_registration_verification_code_policy planned");
    expect(output).toContain("0029_auth_password_recovery planned");
    expect(output).toContain("0030_auth_password_recovery_abuse_cleanup planned");
    expect(output).toContain("0031_supplier_profile_dossier_facts planned");
    expect(output).toContain("0032_supplier_profile_evidence_blocks planned");
    expect(output).toContain("0033_supplier_profile_legal_details planned");
    expect(output).toContain("0034_supplier_profile_restricted_documents planned");
    expect(output).toContain("0035_supplier_document_download_grants planned");
    expect(output).toContain("0036_supplier_document_download_events planned");
  });

  it("prints static dry-run apply without requiring a database", () => {
    const output = runCli(["apply", "--dry-run"]);

    expect(output).toContain("Dry-run apply preview from local plan");
    expect(output).toContain("dryRun=true");
    expect(output).toContain("pending=37");
    expect(output).toContain("pending 0007_supplier_access_flow");
    expect(output).toContain("pending 0008_access_notification_ack");
    expect(output).toContain("pending 0009_supplier_directory_pagination_sort");
    expect(output).toContain("pending 0010_offer_catalog_pagination_sort");
    expect(output).toContain("pending 0011_auth_sessions");
    expect(output).toContain("pending 0012_auth_security_events");
    expect(output).toContain("pending 0013_api_audit_events");
    expect(output).toContain("pending 0014_admin_audit_access");
    expect(output).toContain("pending 0015_admin_audit_retention_query_hardening");
    expect(output).toContain("pending 0016_admin_audit_retention_runtime");
    expect(output).toContain("pending 0017_supplier_access_review_queue");
    expect(output).toContain("pending 0018_admin_access_grants_console");
    expect(output).toContain("pending 0019_admin_incident_acknowledgements");
    expect(output).toContain("pending 0020_admin_incident_workflow");
    expect(output).toContain("pending 0021_admin_incident_execution");
    expect(output).toContain("pending 0022_admin_incident_workload_correlation");
    expect(output).toContain("pending 0023_admin_incident_trend_analytics");
    expect(output).toContain("pending 0024_admin_incident_trend_actions");
    expect(output).toContain("pending 0025_admin_incident_trend_action_queue");
    expect(output).toContain("pending 0026_registration_account_source");
    expect(output).toContain("pending 0027_registration_verification_delivery_outbox");
    expect(output).toContain("pending 0028_registration_verification_code_policy");
    expect(output).toContain("pending 0029_auth_password_recovery");
    expect(output).toContain("pending 0030_auth_password_recovery_abuse_cleanup");
    expect(output).toContain("pending 0031_supplier_profile_dossier_facts");
    expect(output).toContain("pending 0032_supplier_profile_evidence_blocks");
    expect(output).toContain("pending 0033_supplier_profile_legal_details");
    expect(output).toContain("pending 0034_supplier_profile_restricted_documents");
    expect(output).toContain("pending 0035_supplier_document_download_grants");
    expect(output).toContain("pending 0036_supplier_document_download_events");
  });

  it("blocks live apply without explicit confirmation", () => {
    const failure = runCliFailure(["apply", "--live"]);

    expect(failure.status).toBe(2);
    expect(failure.output).toContain("Live apply requires --confirm");
  });

  it("blocks live status/apply when MIGRATION_DATABASE_URL is missing", () => {
    const statusFailure = runCliFailure(["status", "--live"]);
    const applyFailure = runCliFailure(["apply", "--live", "--confirm"]);

    expect(statusFailure.status).toBe(1);
    expect(applyFailure.status).toBe(1);
    expect(statusFailure.output).toContain("MIGRATION_DATABASE_URL is required");
    expect(applyFailure.output).toContain("MIGRATION_DATABASE_URL is required");
  });
});
