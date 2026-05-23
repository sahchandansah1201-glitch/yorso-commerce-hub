#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const apiEntry = path.join(repoRoot, "apps/api/dist/index.js");

if (!existsSync(apiEntry)) {
  console.error("Compiled API entry is missing.");
  console.error("Run: npm run api:build");
  process.exit(1);
}

const freePort = await getFreePort();
const storageRoot = await mkdtemp(path.join(os.tmpdir(), "yorso-admin-incidents-smoke-"));
const baseUrl = `http://127.0.0.1:${freePort}`;
const childLogs = { stdout: "", stderr: "" };
const api = spawn(process.execPath, [apiEntry], {
  cwd: repoRoot,
  env: {
    ...process.env,
    ACCOUNT_REPOSITORY: "memory",
    AUTH_OBSERVABILITY_DRIVER: "console",
    AUTH_RATE_LIMIT_DRIVER: "memory",
    AUTH_RATE_LIMIT_FAIL_MODE: "closed",
    AUTH_SESSION_CACHE_DRIVER: "memory",
    AUTH_SESSION_CACHE_FAIL_MODE: "closed",
    NODE_ENV: "test",
    STORAGE_DRIVER: "local",
    STORAGE_LOCAL_ROOT: path.join(storageRoot, "uploads"),
    VITE_SUPABASE_PUBLISHABLE_KEY: "",
    VITE_SUPABASE_URL: "",
    YORSO_API_HOST: "127.0.0.1",
    YORSO_API_PORT: String(freePort),
    YORSO_AUDIT_DRIVER: "console",
    YORSO_ERROR_OBSERVABILITY_DRIVER: "console",
    YORSO_METRICS_DRIVER: "prometheus",
    YORSO_PUBLIC_APP_URL: "http://localhost:8080",
    YORSO_REQUEST_OBSERVABILITY_DRIVER: "console",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

api.stdout?.on("data", (chunk) => {
  childLogs.stdout += chunk.toString();
});
api.stderr?.on("data", (chunk) => {
  childLogs.stderr += chunk.toString();
});

try {
  await waitForApi(baseUrl, api);
  await runSmoke(baseUrl);
  console.log("self_hosted_admin_incidents_smoke=ok");
} catch (error) {
  console.error("self_hosted_admin_incidents_smoke=failed");
  console.error(error instanceof Error ? error.message : String(error));
  if (childLogs.stdout.trim()) console.error(`api stdout:\n${childLogs.stdout.trim()}`);
  if (childLogs.stderr.trim()) console.error(`api stderr:\n${childLogs.stderr.trim()}`);
  process.exitCode = 1;
} finally {
  if (api.exitCode === null) {
    api.kill("SIGTERM");
    await onceExit(api, 3000).catch(() => api.kill("SIGKILL"));
  }
  await rm(storageRoot, { recursive: true, force: true });
}

async function runSmoke(baseUrl) {
  const missingSession = await fetch(`${baseUrl}/v1/admin/incidents`);
  assertStatus(missingSession, 401, "admin incidents missing session");
  console.log("admin_incidents_auth_guard=ok");

  const buyerHeaders = await signIn(baseUrl, "buyer@example.com");
  const buyerRead = await fetch(`${baseUrl}/v1/admin/incidents`, { headers: buyerHeaders });
  assertStatus(buyerRead, 403, "admin incidents buyer role guard");
  const buyerReadBody = await buyerRead.json();
  assertEqual(buyerReadBody.error?.code, "admin_role_required", "admin incidents buyer role code");
  console.log("admin_incidents_role_guard=ok");

  const adminHeaders = await signIn(baseUrl, "admin@example.com");
  await fetch(`${baseUrl}/v1/admin/audit-events`, { headers: buyerHeaders });
  await fetch(`${baseUrl}/v1/admin/audit-events?limit=100000`, { headers: adminHeaders });

  const list = await jsonRequest(baseUrl, "/v1/admin/incidents?limit=25&status=open", adminHeaders);
  assertEqual(list.ok, true, "admin incidents list ok");
  assertArray(list.incidents, "admin incidents list rows");
  assertNumberAtLeast(list.summary.total, 1, "admin incidents total");
  assertNumberAtLeast(list.summary.open, 1, "admin incidents open");
  assertNumberAtLeast(list.summary.unassigned, 1, "admin incidents unassigned workload");
  assertNumberAtLeast(list.summary.breachRatePct, 0, "admin incidents breach rate");
  assertNumberAtLeast(list.summary.oldestOpenMinutes, 0, "admin incidents oldest open minutes");
  const incident = list.incidents[0];
  assertTruthy(incident.id, "admin incidents first id");
  assertTruthy(incident.title, "admin incidents first title");
  assertArray(incident.recommendedActions, "admin incidents recommended actions");
  console.log("admin_incidents_list=ok");
  console.log("admin_incidents_summary=ok");
  console.log("admin_incidents_workload_summary=ok");

  const detail = await jsonRequest(baseUrl, `/v1/admin/incidents/${encodeURIComponent(incident.id)}`, adminHeaders);
  assertEqual(detail.ok, true, "admin incident detail ok");
  assertEqual(detail.incident.id, incident.id, "admin incident detail id");
  console.log("admin_incidents_detail=ok");

  const handoffJson = await jsonRequest(
    baseUrl,
    `/v1/admin/incidents/${encodeURIComponent(incident.id)}/handoff?format=json`,
    adminHeaders,
  );
  assertEqual(handoffJson.ok, true, "admin incident JSON handoff ok");
  assertEqual(handoffJson.incident.id, incident.id, "admin incident JSON handoff id");
  assertArray(handoffJson.checklist, "admin incident JSON handoff checklist");
  assertContains(JSON.stringify(handoffJson), "Incident snapshot", "admin incident JSON handoff snapshot");
  assertNotContains(JSON.stringify(handoffJson), "admin@example.com", "admin incident JSON handoff no email");
  assertNotContains(JSON.stringify(handoffJson), "Password1", "admin incident JSON handoff no password");
  console.log("admin_incidents_handoff_json=ok");

  const handoffMarkdown = await fetch(
    `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incident.id)}/handoff?format=markdown`,
    { headers: adminHeaders },
  );
  assertStatus(handoffMarkdown, 200, "admin incident Markdown handoff");
  const handoffMarkdownBody = await handoffMarkdown.text();
  assertContains(handoffMarkdownBody, "# Incident handoff", "admin incident Markdown handoff heading");
  assertContains(handoffMarkdownBody, "## Handoff checklist", "admin incident Markdown handoff checklist");
  assertContains(handoffMarkdownBody, "## Runbook", "admin incident Markdown handoff runbook");
  assertNotContains(handoffMarkdownBody, "admin@example.com", "admin incident Markdown handoff no email");
  assertNotContains(handoffMarkdownBody, "Password1", "admin incident Markdown handoff no password");
  console.log("admin_incidents_handoff_markdown=ok");

  const remediation = await jsonRequest(
    baseUrl,
    `/v1/admin/incidents/${encodeURIComponent(incident.id)}/remediation`,
    adminHeaders,
  );
  assertEqual(remediation.ok, true, "admin incident remediation ok");
  assertEqual(remediation.incident.id, incident.id, "admin incident remediation id");
  assertArray(remediation.steps, "admin incident remediation steps");
  assertArray(remediation.verificationChecks, "admin incident remediation verification checks");
  assertArray(remediation.rollbackPlan, "admin incident remediation rollback plan");
  assertArray(remediation.capacityNotes, "admin incident remediation capacity notes");
  assertContains(JSON.stringify(remediation), "control-plane", "admin incident remediation capacity context");
  assertNotContains(JSON.stringify(remediation), "admin@example.com", "admin incident remediation no email");
  assertNotContains(JSON.stringify(remediation), "Password1", "admin incident remediation no password");
  console.log("admin_incidents_remediation_plan=ok");

  const postmortemJson = await jsonRequest(
    baseUrl,
    `/v1/admin/incidents/${encodeURIComponent(incident.id)}/postmortem?format=json`,
    adminHeaders,
  );
  assertEqual(postmortemJson.ok, true, "admin incident JSON postmortem ok");
  assertEqual(postmortemJson.incident.id, incident.id, "admin incident JSON postmortem id");
  assertArray(postmortemJson.impactSummary, "admin incident postmortem impact");
  assertArray(postmortemJson.rootCauseHypotheses, "admin incident postmortem hypotheses");
  assertArray(postmortemJson.actionItems, "admin incident postmortem action items");
  assertArray(postmortemJson.preventionChecks, "admin incident postmortem prevention");
  assertArray(postmortemJson.capacityReview, "admin incident postmortem capacity");
  assertContains(JSON.stringify(postmortemJson), "Add regression guard", "admin incident postmortem regression guard");
  assertNotContains(JSON.stringify(postmortemJson), "admin@example.com", "admin incident JSON postmortem no email");
  assertNotContains(JSON.stringify(postmortemJson), "Password1", "admin incident JSON postmortem no password");
  console.log("admin_incidents_postmortem_json=ok");

  const postmortemMarkdown = await fetch(
    `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incident.id)}/postmortem?format=markdown`,
    { headers: adminHeaders },
  );
  assertStatus(postmortemMarkdown, 200, "admin incident Markdown postmortem");
  const postmortemMarkdownBody = await postmortemMarkdown.text();
  assertContains(postmortemMarkdownBody, "# Incident postmortem draft", "admin incident Markdown postmortem heading");
  assertContains(postmortemMarkdownBody, "## Root-cause hypotheses", "admin incident Markdown postmortem hypotheses");
  assertContains(postmortemMarkdownBody, "## Capacity review", "admin incident Markdown postmortem capacity");
  assertNotContains(postmortemMarkdownBody, "admin@example.com", "admin incident Markdown postmortem no email");
  assertNotContains(postmortemMarkdownBody, "Password1", "admin incident Markdown postmortem no password");
  console.log("admin_incidents_postmortem_markdown=ok");

  const execution = await jsonRequest(
    baseUrl,
    `/v1/admin/incidents/${encodeURIComponent(incident.id)}/execution`,
    adminHeaders,
  );
  assertEqual(execution.ok, true, "admin incident execution ok");
  assertEqual(execution.incident.id, incident.id, "admin incident execution id");
  assertArray(execution.items, "admin incident execution items");
  assertNumberAtLeast(execution.summary.total, 3, "admin incident execution total");
  assertNumberAtLeast(execution.summary.open, 1, "admin incident execution open");
  const executionItem = execution.items.find((item) => item.source === "remediation_step") ?? execution.items[0];
  assertTruthy(executionItem.itemId, "admin incident execution item id");
  assertNotContains(JSON.stringify(execution), "admin@example.com", "admin incident execution no email");
  assertNotContains(JSON.stringify(execution), "Password1", "admin incident execution no password");
  console.log("admin_incidents_execution_plan=ok");

  const executionExportJson = await jsonRequest(
    baseUrl,
    `/v1/admin/incidents/${encodeURIComponent(incident.id)}/execution/export?format=json`,
    adminHeaders,
  );
  assertEqual(executionExportJson.ok, true, "admin incident execution JSON export ok");
  assertEqual(executionExportJson.incident.id, incident.id, "admin incident execution JSON export id");
  assertArray(executionExportJson.items, "admin incident execution JSON export items");
  assertNumberAtLeast(executionExportJson.summary.total, 3, "admin incident execution JSON export total");
  assertNotContains(JSON.stringify(executionExportJson), "admin@example.com", "admin incident execution JSON export no email");
  console.log("admin_incidents_execution_export_json=ok");

  const executionExportCsv = await fetch(
    `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incident.id)}/execution/export?format=csv`,
    { headers: adminHeaders },
  );
  assertStatus(executionExportCsv, 200, "admin incident execution CSV export");
  const executionExportCsvBody = await executionExportCsv.text();
  assertContains(executionExportCsvBody, "\"itemId\",\"status\"", "admin incident execution CSV export header");
  assertContains(executionExportCsvBody, "remediation", "admin incident execution CSV export remediation row");
  assertNotContains(executionExportCsvBody, "admin@example.com", "admin incident execution CSV export no email");
  console.log("admin_incidents_execution_export_csv=ok");

  const executionStarted = await postJson(
    baseUrl,
    `/v1/admin/incidents/${encodeURIComponent(incident.id)}/execution/${encodeURIComponent(executionItem.itemId)}`,
    adminHeaders,
    {
      note: "Operator started execution step.",
      status: "in_progress",
    },
  );
  assertEqual(executionStarted.ok, true, "admin incident execution start ok");
  assertEqual(executionStarted.updatedItem.status, "in_progress", "admin incident execution start status");
  assertNumberAtLeast(executionStarted.summary.inProgress, 1, "admin incident execution in progress summary");
  console.log("admin_incidents_execution_start=ok");

  const executionDone = await postJson(
    baseUrl,
    `/v1/admin/incidents/${encodeURIComponent(incident.id)}/execution/${encodeURIComponent(executionItem.itemId)}`,
    adminHeaders,
    {
      evidenceNote: "Audit route verified with bounded evidence.",
      note: "Execution item complete.",
      status: "done",
    },
  );
  assertEqual(executionDone.ok, true, "admin incident execution done ok");
  assertEqual(executionDone.updatedItem.status, "done", "admin incident execution done status");
  assertEqual(executionDone.updatedItem.evidenceNote, "Audit route verified with bounded evidence.", "admin incident execution evidence note");
  assertContains(executionDone.updatedItem.updatedByUserHash, "sha256:", "admin incident execution updated hash");
  assertNumberAtLeast(executionDone.summary.done, 1, "admin incident execution done summary");
  console.log("admin_incidents_execution_done=ok");

  const blockedItem = execution.items.find((item) => item.itemId !== executionItem.itemId) ?? execution.items[0];
  const executionBlocked = await postJson(
    baseUrl,
    `/v1/admin/incidents/${encodeURIComponent(incident.id)}/execution/${encodeURIComponent(blockedItem.itemId)}`,
    adminHeaders,
    {
      blockedReason: "Needs engineering owner confirmation.",
      note: "Blocked without secrets.",
      status: "blocked",
    },
  );
  assertEqual(executionBlocked.updatedItem.status, "blocked", "admin incident execution blocked status");
  assertEqual(executionBlocked.updatedItem.blockedReason, "Needs engineering owner confirmation.", "admin incident execution blocked reason");
  console.log("admin_incidents_execution_blocked=ok");

  const unsafeExecution = await fetch(
    `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incident.id)}/execution/${encodeURIComponent(executionItem.itemId)}`,
    {
      body: JSON.stringify({ evidenceNote: "Email admin@example.com", status: "done" }),
      headers: adminHeaders,
      method: "POST",
    },
  );
  assertStatus(unsafeExecution, 400, "admin incident execution note hygiene guard");
  console.log("admin_incidents_execution_note_hygiene_guard=ok");

  const missingExecution = await fetch(
    `${baseUrl}/v1/admin/incidents/${encodeURIComponent(incident.id)}/execution/${encodeURIComponent("missing:item")}`,
    {
      body: JSON.stringify({ evidenceNote: "Verified missing item guard.", status: "done" }),
      headers: adminHeaders,
      method: "POST",
    },
  );
  assertStatus(missingExecution, 404, "admin incident execution missing item guard");
  console.log("admin_incidents_execution_missing_item_guard=ok");

  const executionQueue = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/execution-queue?status=open&priority=immediate&limit=50",
    adminHeaders,
  );
  assertEqual(executionQueue.ok, true, "admin incident execution queue ok");
  assertArray(executionQueue.items, "admin incident execution queue items");
  assertNumberAtLeast(executionQueue.summary.total, 1, "admin incident execution queue total");
  assertNumberAtLeast(executionQueue.summary.unassigned, 1, "admin incident execution queue unassigned");
  assertTruthy(executionQueue.items[0]?.incidentId, "admin incident execution queue incident id");
  assertTruthy(executionQueue.items[0]?.targetDueAt, "admin incident execution queue target due");
  assertNotContains(JSON.stringify(executionQueue), "admin@example.com", "admin incident execution queue no email");
  console.log("admin_incidents_execution_queue=ok");
  console.log("admin_incidents_execution_queue_filters=ok");

  const executionQueueExportJson = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/execution-queue/export?format=json&status=open&limit=50",
    adminHeaders,
  );
  assertEqual(executionQueueExportJson.ok, true, "admin incident execution queue JSON export ok");
  assertArray(executionQueueExportJson.items, "admin incident execution queue JSON export items");
  assertNumberAtLeast(executionQueueExportJson.summary.total, 1, "admin incident execution queue JSON export total");
  assertNotContains(JSON.stringify(executionQueueExportJson), "admin@example.com", "admin incident execution queue JSON no email");
  console.log("admin_incidents_execution_queue_export_json=ok");

  const executionQueueExportCsv = await fetch(
    `${baseUrl}/v1/admin/incidents/execution-queue/export?format=csv&status=open&limit=50`,
    { headers: adminHeaders },
  );
  assertStatus(executionQueueExportCsv, 200, "admin incident execution queue CSV export");
  const executionQueueExportCsvBody = await executionQueueExportCsv.text();
  assertContains(executionQueueExportCsvBody, "\"incidentId\",\"itemId\"", "admin incident execution queue CSV header");
  assertNotContains(executionQueueExportCsvBody, "admin@example.com", "admin incident execution queue CSV no email");
  console.log("admin_incidents_execution_queue_export_csv=ok");

  const queueBulkItem = executionQueue.items[0];
  const executionQueueBulk = await postJson(
    baseUrl,
    "/v1/admin/incidents/execution-queue/bulk",
    adminHeaders,
    {
      items: [
        { incidentId: queueBulkItem.incidentId, itemId: queueBulkItem.itemId },
        { incidentId: "audit:missing", itemId: "missing:item" },
      ],
      note: "Bulk execution queue update.",
      status: "in_progress",
    },
  );
  assertEqual(executionQueueBulk.ok, true, "admin incident execution queue bulk ok");
  assertEqual(executionQueueBulk.succeeded, 1, "admin incident execution queue bulk success count");
  assertEqual(executionQueueBulk.failed[0]?.code, "admin_incident_not_found", "admin incident execution queue bulk partial failure");
  assertEqual(executionQueueBulk.updatedItems[0]?.status, "in_progress", "admin incident execution queue bulk status");
  console.log("admin_incidents_execution_queue_bulk=ok");

  const executionWorkload = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/execution-workload?status=in_progress&priority=immediate&limit=20",
    adminHeaders,
  );
  assertEqual(executionWorkload.ok, true, "admin incident execution workload ok");
  assertArray(executionWorkload.owners, "admin incident execution workload owners");
  assertArray(executionWorkload.hotIncidents, "admin incident execution workload hot incidents");
  assertArray(executionWorkload.sourceMix, "admin incident execution workload source mix");
  assertNumberAtLeast(executionWorkload.summary.total, 1, "admin incident execution workload total");
  assertNumberAtLeast(executionWorkload.summary.loadScore, 1, "admin incident execution workload load score");
  assertNotContains(JSON.stringify(executionWorkload), "admin@example.com", "admin incident execution workload no email");
  console.log("admin_incidents_workload=ok");
  console.log("admin_incidents_workload_filters=ok");

  const executionWorkloadExportJson = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/execution-workload/export?format=json&status=in_progress&limit=20",
    adminHeaders,
  );
  assertEqual(executionWorkloadExportJson.ok, true, "admin incident execution workload JSON export ok");
  assertArray(executionWorkloadExportJson.hotIncidents, "admin incident execution workload JSON export hot incidents");
  assertNotContains(JSON.stringify(executionWorkloadExportJson), "admin@example.com", "admin incident execution workload JSON no email");
  console.log("admin_incidents_workload_export_json=ok");

  const executionWorkloadExportCsv = await fetch(
    `${baseUrl}/v1/admin/incidents/execution-workload/export?format=csv&status=in_progress&limit=20`,
    { headers: adminHeaders },
  );
  assertStatus(executionWorkloadExportCsv, 200, "admin incident execution workload CSV export");
  const executionWorkloadExportCsvBody = await executionWorkloadExportCsv.text();
  assertContains(executionWorkloadExportCsvBody, "\"incidentId\",\"loadScore\"", "admin incident execution workload CSV header");
  assertContains(executionWorkloadExportCsvBody, "\"nextTargetDueAt\",\"title\"", "admin incident execution workload CSV title column");
  assertNotContains(executionWorkloadExportCsvBody, "admin@example.com", "admin incident execution workload CSV no email");
  console.log("admin_incidents_workload_export_csv=ok");

  const executionWorkloadForecast = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/execution-workload/forecast?horizonHours=24&limit=20",
    adminHeaders,
  );
  assertEqual(executionWorkloadForecast.ok, true, "admin incident execution workload forecast ok");
  assertArray(executionWorkloadForecast.owners, "admin incident execution workload forecast owners");
  assertNumberAtLeast(executionWorkloadForecast.summary.projectedOpen, 0, "admin incident execution workload forecast projected open");
  assertNotContains(JSON.stringify(executionWorkloadForecast), "admin@example.com", "admin incident execution workload forecast no email");
  console.log("admin_incidents_workload_forecast=ok");

  const executionCorrelation = await jsonRequest(
    baseUrl,
    `/v1/admin/incidents/${encodeURIComponent(incident.id)}/correlation?limit=25`,
    adminHeaders,
  );
  assertEqual(executionCorrelation.ok, true, "admin incident correlation ok");
  assertEqual(executionCorrelation.incident.id, incident.id, "admin incident correlation id");
  assertArray(executionCorrelation.executionItems, "admin incident correlation execution items");
  assertArray(executionCorrelation.signals, "admin incident correlation signals");
  assertArray(executionCorrelation.recommendedNextSteps, "admin incident correlation next steps");
  assertNumberAtLeast(executionCorrelation.executionItems.length, 1, "admin incident correlation execution item count");
  assertNotContains(JSON.stringify(executionCorrelation), "admin@example.com", "admin incident correlation no email");
  console.log("admin_incidents_correlation=ok");

  const trendAnalytics = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/trends?window=7d&granularity=day&limit=30",
    adminHeaders,
  );
  assertEqual(trendAnalytics.ok, true, "admin incident trend analytics ok");
  assertArray(trendAnalytics.buckets, "admin incident trend buckets");
  assertArray(trendAnalytics.routeRisks, "admin incident trend route risks");
  assertArray(trendAnalytics.sourceMix, "admin incident trend source mix");
  assertArray(trendAnalytics.severityMix, "admin incident trend severity mix");
  assertArray(trendAnalytics.statusMix, "admin incident trend status mix");
  assertNumberAtLeast(trendAnalytics.summary.total, 1, "admin incident trend total");
  assertNumberAtLeast(trendAnalytics.summary.averageLoadScore, 0, "admin incident trend average load score");
  assertNumberAtLeast(trendAnalytics.sla.breachRatePct, 0, "admin incident trend breach rate");
  assertNotContains(JSON.stringify(trendAnalytics), "admin@example.com", "admin incident trend analytics no email");
  console.log("admin_incidents_trends=ok");
  console.log("admin_incidents_trends_filters=ok");

  const trendAnalyticsExportJson = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/trends/export?format=json&window=7d&granularity=day&limit=30",
    adminHeaders,
  );
  assertEqual(trendAnalyticsExportJson.ok, true, "admin incident trend JSON export ok");
  assertArray(trendAnalyticsExportJson.buckets, "admin incident trend JSON export buckets");
  assertNotContains(JSON.stringify(trendAnalyticsExportJson), "admin@example.com", "admin incident trend JSON export no email");
  console.log("admin_incidents_trends_export_json=ok");

  const trendAnalyticsExportCsv = await fetch(
    `${baseUrl}/v1/admin/incidents/trends/export?format=csv&window=7d&granularity=day&limit=30`,
    { headers: adminHeaders },
  );
  assertStatus(trendAnalyticsExportCsv, 200, "admin incident trend CSV export");
  const trendAnalyticsExportCsvBody = await trendAnalyticsExportCsv.text();
  assertContains(trendAnalyticsExportCsvBody, "\"key\",\"startAt\"", "admin incident trend CSV header");
  assertContains(trendAnalyticsExportCsvBody, "\"loadScore\"", "admin incident trend CSV load score column");
  assertNotContains(trendAnalyticsExportCsvBody, "admin@example.com", "admin incident trend CSV export no email");
  console.log("admin_incidents_trends_export_csv=ok");

  const trendAnomalies = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/trends/anomalies?window=7d&granularity=day&limit=30",
    adminHeaders,
  );
  assertEqual(trendAnomalies.ok, true, "admin incident trend anomalies ok");
  assertArray(trendAnomalies.anomalies, "admin incident trend anomalies rows");
  assertNumberAtLeast(trendAnomalies.summary.watch, 0, "admin incident trend anomaly watch count");
  assertNotContains(JSON.stringify(trendAnomalies), "admin@example.com", "admin incident trend anomalies no email");
  console.log("admin_incidents_trends_anomalies=ok");

  const trendBriefing = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/trends/briefing?window=7d&granularity=day&limit=30",
    adminHeaders,
  );
  assertEqual(trendBriefing.ok, true, "admin incident trend briefing ok");
  assertArray(trendBriefing.sections, "admin incident trend briefing sections");
  assertArray(trendBriefing.operatorActions, "admin incident trend briefing actions");
  assertArray(trendBriefing.capacityReview, "admin incident trend briefing capacity");
  assertContains(JSON.stringify(trendBriefing), "10,000", "admin incident trend briefing capacity baseline");
  assertNotContains(JSON.stringify(trendBriefing), "admin@example.com", "admin incident trend briefing no email");
  console.log("admin_incidents_trends_briefing=ok");

  const trendActions = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/trends/actions?window=7d&granularity=day&limit=30",
    adminHeaders,
  );
  assertEqual(trendActions.ok, true, "admin incident trend actions ok");
  assertArray(trendActions.actions, "admin incident trend actions rows");
  assertNumberAtLeast(trendActions.summary.total, 2, "admin incident trend actions total");
  assertNumberAtLeast(trendActions.summary.relatedIncidents, 1, "admin incident trend actions related incidents");
  assertNotContains(JSON.stringify(trendActions), "admin@example.com", "admin incident trend actions no email");
  const firstTrendAction = trendActions.actions[0];
  assertTruthy(firstTrendAction?.actionId, "admin incident trend first action id");
  assertTruthy(firstTrendAction?.relatedIncidentIds?.[0], "admin incident trend first action incident");
  console.log("admin_incidents_trend_actions=ok");

  const acceptedTrendAction = await postJson(
    baseUrl,
    `/v1/admin/incidents/trends/actions/${encodeURIComponent(firstTrendAction.actionId)}/decision?window=7d&granularity=day&limit=30`,
    adminHeaders,
    {
      decision: "accept",
      note: "Accepting bounded trend action for smoke.",
    },
  );
  assertEqual(acceptedTrendAction.ok, true, "admin incident trend action accept ok");
  assertEqual(acceptedTrendAction.action.status, "accepted", "admin incident trend action accepted status");
  assertContains(acceptedTrendAction.action.decidedByUserHash, "sha256:", "admin incident trend action decided hash");
  assertNumberAtLeast(acceptedTrendAction.timelineEventsCreated, 1, "admin incident trend action timeline events");
  assertNumberAtLeast(acceptedTrendAction.affectedIncidents.length, 1, "admin incident trend action affected incidents");
  assertNotContains(JSON.stringify(acceptedTrendAction), "admin@example.com", "admin incident trend action accept no email");
  console.log("admin_incidents_trend_action_accept=ok");

  const refreshedTrendActions = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/trends/actions?window=7d&granularity=day&limit=30",
    adminHeaders,
  );
  const acceptedTrendActionRow = refreshedTrendActions.actions.find((action) => action.actionId === firstTrendAction.actionId);
  assertEqual(acceptedTrendActionRow?.status, "accepted", "admin incident trend action persists accepted status");
  const dismissTrendAction = refreshedTrendActions.actions.find((action) =>
    action.status === "proposed" && action.actionId !== firstTrendAction.actionId
  );
  assertTruthy(dismissTrendAction, "admin incident trend dismiss candidate");
  const dismissedTrendAction = await postJson(
    baseUrl,
    `/v1/admin/incidents/trends/actions/${encodeURIComponent(dismissTrendAction.actionId)}/decision?window=7d&granularity=day&limit=30`,
    adminHeaders,
    {
      decision: "dismiss",
      note: "Dismissed as duplicate operator signal.",
    },
  );
  assertEqual(dismissedTrendAction.ok, true, "admin incident trend action dismiss ok");
  assertEqual(dismissedTrendAction.action.status, "dismissed", "admin incident trend action dismissed status");
  assertEqual(dismissedTrendAction.timelineEventsCreated, 0, "admin incident trend dismiss no timeline events");
  assertNotContains(JSON.stringify(dismissedTrendAction), "admin@example.com", "admin incident trend action dismiss no email");
  console.log("admin_incidents_trend_action_dismiss=ok");

  const invalidTrendActionDecision = await fetch(
    `${baseUrl}/v1/admin/incidents/trends/actions/${encodeURIComponent(firstTrendAction.actionId)}/decision?window=7d&granularity=day&limit=30`,
    {
      body: JSON.stringify({ decision: "approve", note: "Invalid decision branch." }),
      headers: adminHeaders,
      method: "POST",
    },
  );
  assertStatus(invalidTrendActionDecision, 400, "admin incident trend action validation guard");
  console.log("admin_incidents_trend_action_validation_guard=ok");

  const trendActionQueue = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/trend-action-queue?window=7d&decision=accepted&priority=immediate&limit=50",
    adminHeaders,
  );
  assertEqual(trendActionQueue.ok, true, "admin incident trend action queue ok");
  assertArray(trendActionQueue.actions, "admin incident trend action queue rows");
  assertNumberAtLeast(trendActionQueue.summary.total, 1, "admin incident trend action queue total");
  assertEqual(trendActionQueue.actions[0]?.status, "accepted", "admin incident trend action queue decision filter");
  assertNotContains(JSON.stringify(trendActionQueue), "admin@example.com", "admin incident trend action queue no email");
  console.log("admin_incidents_trend_action_queue=ok");
  console.log("admin_incidents_trend_action_queue_filters=ok");

  const trendActionQueueExportJson = await jsonRequest(
    baseUrl,
    "/v1/admin/incidents/trend-action-queue/export?format=json&window=7d&limit=50",
    adminHeaders,
  );
  assertEqual(trendActionQueueExportJson.ok, true, "admin incident trend action queue JSON export ok");
  assertArray(trendActionQueueExportJson.actions, "admin incident trend action queue JSON rows");
  assertNotContains(JSON.stringify(trendActionQueueExportJson), "admin@example.com", "admin incident trend action queue JSON no email");
  console.log("admin_incidents_trend_action_queue_export_json=ok");

  const trendActionQueueExportCsv = await fetch(
    `${baseUrl}/v1/admin/incidents/trend-action-queue/export?format=csv&window=7d&limit=50`,
    { headers: adminHeaders },
  );
  assertStatus(trendActionQueueExportCsv, 200, "admin incident trend action queue CSV export");
  const trendActionQueueExportCsvBody = await trendActionQueueExportCsv.text();
  assertContains(trendActionQueueExportCsvBody, "\"actionId\",\"status\"", "admin incident trend action queue CSV header");
  assertNotContains(trendActionQueueExportCsvBody, "admin@example.com", "admin incident trend action queue CSV no email");
  console.log("admin_incidents_trend_action_queue_export_csv=ok");

  const queueBulkAction = trendActionQueue.actions[0];
  const trendActionQueueBulk = await postJson(
    baseUrl,
    "/v1/admin/incidents/trend-action-queue/bulk?window=7d&limit=50",
    adminHeaders,
    {
      actionIds: [queueBulkAction.actionId, "trend:missing:7d:missing"],
      decision: "dismiss",
      note: "Bulk trend action queue smoke.",
    },
  );
  assertEqual(trendActionQueueBulk.ok, true, "admin incident trend action queue bulk ok");
  assertEqual(trendActionQueueBulk.succeeded, 1, "admin incident trend action queue bulk success count");
  assertEqual(trendActionQueueBulk.failed[0]?.code, "admin_incident_trend_action_not_found", "admin incident trend action queue bulk partial failure");
  assertEqual(trendActionQueueBulk.updatedActions[0]?.status, "dismissed", "admin incident trend action queue bulk status");
  console.log("admin_incidents_trend_action_queue_bulk=ok");

  const unsafeTrendActionQueueBulk = await fetch(`${baseUrl}/v1/admin/incidents/trend-action-queue/bulk?window=7d&limit=50`, {
    body: JSON.stringify({
      actionIds: [queueBulkAction.actionId],
      decision: "accept",
      note: "Email admin@example.com",
    }),
    headers: adminHeaders,
    method: "POST",
  });
  assertStatus(unsafeTrendActionQueueBulk, 400, "admin incident trend action queue note hygiene guard");
  console.log("admin_incidents_trend_action_queue_note_hygiene_guard=ok");

  const unsafeQueueBulk = await fetch(`${baseUrl}/v1/admin/incidents/execution-queue/bulk`, {
    body: JSON.stringify({
      evidenceNote: "Email admin@example.com",
      items: [{ incidentId: queueBulkItem.incidentId, itemId: queueBulkItem.itemId }],
      status: "done",
    }),
    headers: adminHeaders,
    method: "POST",
  });
  assertStatus(unsafeQueueBulk, 400, "admin incident execution queue note hygiene guard");
  console.log("admin_incidents_execution_queue_note_hygiene_guard=ok");

  const unsafeNote = await fetch(`${baseUrl}/v1/admin/incidents/${encodeURIComponent(incident.id)}/workflow`, {
    body: JSON.stringify({ action: "comment", note: "Email admin@example.com" }),
    headers: adminHeaders,
    method: "POST",
  });
  assertStatus(unsafeNote, 400, "admin incidents note hygiene guard");
  console.log("admin_incidents_note_hygiene_guard=ok");

  const acknowledged = await postJson(baseUrl, `/v1/admin/incidents/${encodeURIComponent(incident.id)}/acknowledge`, adminHeaders, {
    note: "Operator triage started without secrets.",
    status: "acknowledged",
  });
  assertEqual(acknowledged.ok, true, "admin incident acknowledge ok");
  assertEqual(acknowledged.incident.status, "acknowledged", "admin incident acknowledge status");
  assertContains(acknowledged.incident.acknowledgedByUserHash, "sha256:", "admin incident actor hash");
  assertNotContains(JSON.stringify(acknowledged), "admin@example.com", "admin incident no admin email");
  assertNotContains(JSON.stringify(acknowledged), "Password1", "admin incident no password");
  console.log("admin_incidents_acknowledge=ok");
  console.log("admin_incidents_no_secrets=ok");

  const assigned = await postJson(baseUrl, `/v1/admin/incidents/${encodeURIComponent(incident.id)}/workflow`, adminHeaders, {
    action: "assign",
    assignedToUserId: adminHeaders["x-yorso-user-id"],
    note: "Assigning to incident commander.",
  });
  assertEqual(assigned.incident.status, "acknowledged", "admin incident assign status");
  assertContains(assigned.incident.assignedToUserHash, "sha256:", "admin incident assigned user hash");
  assertContains(JSON.stringify(assigned.timeline), "assigned", "admin incident assignment timeline");
  console.log("admin_incidents_assign=ok");

  const escalated = await postJson(baseUrl, `/v1/admin/incidents/${encodeURIComponent(incident.id)}/workflow`, adminHeaders, {
    action: "escalate",
    escalationLevel: "engineering",
    note: "Escalating after repeated blocked admin attempts.",
  });
  assertEqual(escalated.incident.escalationLevel, "engineering", "admin incident escalation level");
  assertContains(JSON.stringify(escalated.timeline), "escalated", "admin incident escalation timeline");
  console.log("admin_incidents_escalate=ok");

  const commented = await postJson(baseUrl, `/v1/admin/incidents/${encodeURIComponent(incident.id)}/workflow`, adminHeaders, {
    action: "comment",
    note: "Operator comment without secrets.",
  });
  assertContains(JSON.stringify(commented.timeline), "commented", "admin incident comment timeline");
  console.log("admin_incidents_comment=ok");

  const bulkEscalated = await postJson(baseUrl, "/v1/admin/incidents/workflow/bulk", adminHeaders, {
    action: "escalate",
    escalationLevel: "executive",
    incidentIds: [incident.id, "audit:missing"],
    note: "Bulk escalation smoke.",
  });
  assertEqual(bulkEscalated.ok, true, "admin incidents bulk workflow ok");
  assertEqual(bulkEscalated.succeeded, 1, "admin incidents bulk workflow success count");
  assertEqual(bulkEscalated.failed[0]?.code, "admin_incident_not_found", "admin incidents bulk partial failure");
  assertEqual(bulkEscalated.incidents[0]?.escalationLevel, "executive", "admin incidents bulk escalation");
  assertNotContains(JSON.stringify(bulkEscalated), "admin@example.com", "admin incidents bulk no email");
  console.log("admin_incidents_bulk_workflow=ok");

  const acknowledgedList = await jsonRequest(baseUrl, "/v1/admin/incidents?status=acknowledged&limit=25", adminHeaders);
  assertEqual(acknowledgedList.ok, true, "admin incidents acknowledged list ok");
  assertContains(JSON.stringify(acknowledgedList), incident.id, "admin incidents acknowledged filter includes incident");
  console.log("admin_incidents_status_filter=ok");

  const workflowFilteredList = await jsonRequest(
    baseUrl,
    `/v1/admin/incidents?status=acknowledged&assigned=assigned&escalationLevel=executive&slaStatus=${commented.incident.slaStatus}&limit=25`,
    adminHeaders,
  );
  assertEqual(workflowFilteredList.ok, true, "admin incidents workflow filter list ok");
  assertContains(JSON.stringify(workflowFilteredList), incident.id, "admin incidents workflow filters include incident");
  assertNumberAtLeast(workflowFilteredList.summary.assigned, 1, "admin incidents assigned summary");
  assertNumberAtLeast(workflowFilteredList.summary.executiveEscalations, 1, "admin incidents executive summary");
  console.log("admin_incidents_workflow_filters=ok");

  const exportJson = await jsonRequest(
    baseUrl,
    `/v1/admin/incidents/export?format=json&status=acknowledged&assigned=assigned&limit=25`,
    adminHeaders,
  );
  assertEqual(exportJson.ok, true, "admin incidents JSON export ok");
  assertNumberAtLeast(exportJson.count, 1, "admin incidents JSON export count");
  assertNotContains(JSON.stringify(exportJson), "admin@example.com", "admin incidents JSON export no email");
  console.log("admin_incidents_export_json=ok");

  const exportCsv = await fetch(
    `${baseUrl}/v1/admin/incidents/export?format=csv&status=acknowledged&assigned=assigned&limit=25`,
    { headers: adminHeaders },
  );
  assertStatus(exportCsv, 200, "admin incidents CSV export");
  const exportCsvBody = await exportCsv.text();
  assertContains(exportCsvBody, "\"id\",\"status\"", "admin incidents CSV export header");
  assertNotContains(exportCsvBody, "admin@example.com", "admin incidents CSV export no email");
  console.log("admin_incidents_export_csv=ok");

  const resolved = await postJson(baseUrl, `/v1/admin/incidents/${encodeURIComponent(incident.id)}/acknowledge`, adminHeaders, {
    note: "Resolved after smoke verification.",
    status: "resolved",
  });
  assertEqual(resolved.incident.status, "resolved", "admin incident resolve status");
  assertEqual(resolved.incident.slaStatus, "ok", "admin incident resolved SLA status");
  console.log("admin_incidents_resolve=ok");

  const invalid = await fetch(`${baseUrl}/v1/admin/incidents?limit=100000`, { headers: adminHeaders });
  assertStatus(invalid, 400, "admin incidents validation guard");
  console.log("admin_incidents_validation_guard=ok");

  const invalidWorkflow = await fetch(`${baseUrl}/v1/admin/incidents/${encodeURIComponent(incident.id)}/workflow`, {
    body: JSON.stringify({ action: "assign" }),
    headers: adminHeaders,
    method: "POST",
  });
  assertStatus(invalidWorkflow, 400, "admin incidents workflow validation guard");
  console.log("admin_incidents_workflow_validation_guard=ok");

  const invalidBulkWorkflow = await fetch(`${baseUrl}/v1/admin/incidents/workflow/bulk`, {
    body: JSON.stringify({ action: "comment", incidentIds: [] }),
    headers: adminHeaders,
    method: "POST",
  });
  assertStatus(invalidBulkWorkflow, 400, "admin incidents bulk workflow validation guard");
  console.log("admin_incidents_bulk_workflow_validation_guard=ok");
}

async function signIn(baseUrl, email) {
  const response = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    body: JSON.stringify({ email, password: "Password1" }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const body = await response.json();
  assertStatus(response, 200, `${email} sign-in`);
  return {
    "content-type": "application/json",
    "x-yorso-session-id": body.session.id,
    "x-yorso-user-id": body.session.userId,
  };
}

async function jsonRequest(baseUrl, pathName, headers) {
  const response = await fetch(`${baseUrl}${pathName}`, { headers });
  if (!response.ok) {
    throw new Error(`GET ${pathName} failed with ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function postJson(baseUrl, pathName, headers, body) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`POST ${pathName} failed with ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function waitForApi(baseUrl, child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`API process exited before healthcheck. code=${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/health/live`);
      if (response.ok) return;
    } catch {
      // Keep polling while the API process starts.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${baseUrl}/health/live`);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === "string") {
          reject(new Error("Could not reserve a local TCP port."));
          return;
        }
        resolve(address.port);
      });
    });
  });
}

function onceExit(child, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for API process exit.")), timeoutMs);
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal });
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertStatus(response, expected, label) {
  if (response.status !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, got ${response.status}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTruthy(value, label) {
  if (!value) throw new Error(`${label}: expected truthy value, got ${JSON.stringify(value)}`);
}

function assertArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label}: expected array, got ${JSON.stringify(value)}`);
}

function assertNumberAtLeast(actual, expected, label) {
  if (typeof actual !== "number" || actual < expected) {
    throw new Error(`${label}: expected at least ${expected}, got ${JSON.stringify(actual)}`);
  }
}

function assertContains(value, needle, label) {
  if (!String(value).includes(needle)) {
    throw new Error(`${label}: expected ${JSON.stringify(value)} to contain ${JSON.stringify(needle)}`);
  }
}

function assertNotContains(value, needle, label) {
  if (String(value).includes(needle)) {
    throw new Error(`${label}: expected ${JSON.stringify(value)} not to contain ${JSON.stringify(needle)}`);
  }
}
