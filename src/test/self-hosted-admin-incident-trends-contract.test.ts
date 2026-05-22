import { describe, expect, it } from "vitest";
import {
  adminIncidentTrendAnomaliesResponseSchema,
  adminIncidentTrendBriefingResponseSchema,
  adminIncidentTrendExportQuerySchema,
  adminIncidentTrendQuerySchema,
  adminIncidentTrendResponseSchema,
} from "../../packages/contracts/src/admin-incidents";

const requestId = "00000000-0000-4000-8000-000000001107";
const generatedAt = "2026-05-22T10:00:00.000Z";

const trendBucket = {
  acknowledged: 1,
  access: 0,
  atRisk: 1,
  audit: 2,
  breached: 1,
  critical: 1,
  endAt: "2026-05-22T11:00:00.000Z",
  executionBlocked: 1,
  executionDone: 2,
  executionOpen: 3,
  high: 1,
  key: "2026-05-22T10",
  loadScore: 42,
  open: 2,
  policy: 0,
  resolved: 1,
  runtime: 1,
  security: 0,
  startAt: "2026-05-22T10:00:00.000Z",
  total: 3,
} as const;

const dimension = {
  breached: 1,
  critical: 1,
  key: "audit",
  label: "Audit",
  loadScore: 42,
  open: 2,
  sharePct: 67,
  total: 3,
} as const;

const routeRisk = {
  blocked: 1,
  breached: 1,
  critical: 1,
  loadScore: 54,
  recommendedAction: "Review admin audit route before the next shift handoff.",
  route: "/v1/admin/audit-events",
  total: 3,
} as const;

describe("Batch #107 admin incident trends contracts", () => {
  it("parses bounded trend query defaults and rejects unsafe expansion", () => {
    const query = adminIncidentTrendQuerySchema.parse({});

    expect(query.window).toBe("7d");
    expect(query.granularity).toBe("day");
    expect(query.includeResolved).toBe(false);
    expect(query.limit).toBe(20);

    expect(() => adminIncidentTrendQuerySchema.parse({ limit: 51 })).toThrow();
    expect(() => adminIncidentTrendQuerySchema.parse({ window: "365d" })).toThrow();
    expect(() => adminIncidentTrendQuerySchema.parse({ granularity: "minute" })).toThrow();
  });

  it("parses export query and limits export formats", () => {
    expect(adminIncidentTrendExportQuerySchema.parse({ format: "csv" }).format).toBe("csv");
    expect(adminIncidentTrendExportQuerySchema.parse({}).format).toBe("json");
    expect(() => adminIncidentTrendExportQuerySchema.parse({ format: "xlsx" })).toThrow();
  });

  it("accepts aggregate trend response and rejects stale UI aliases", () => {
    const response = adminIncidentTrendResponseSchema.parse({
      buckets: [trendBucket],
      generatedAt,
      granularity: "hour",
      limit: 20,
      ok: true,
      requestId,
      routeRisks: [routeRisk],
      severityMix: [{ ...dimension, key: "critical", label: "Critical" }],
      sla: {
        acknowledgedPct: 50,
        breachRatePct: 33,
        breached: 1,
        oldestOpenMinutes: 45,
        openCritical: 1,
        unresolved: 2,
      },
      sourceMix: [dimension],
      statusMix: [{ ...dimension, key: "open", label: "Open" }],
      summary: {
        averageLoadScore: 42,
        breached: 1,
        critical: 1,
        peakBucketKey: trendBucket.key,
        peakBucketLoadScore: 42,
        total: 3,
        trendDirection: "up",
      },
      window: "24h",
    });

    expect(response.buckets[0].executionBlocked).toBe(1);
    expect(response.routeRisks[0].recommendedAction).toContain("Review");
    const stripped = adminIncidentTrendResponseSchema.parse({
      ...response,
      buckets: [{ ...response.buckets[0], trendDirection: "up", overdue: 1 }],
    });
    expect(stripped.buckets[0]).not.toHaveProperty("trendDirection");
    expect(stripped.buckets[0]).not.toHaveProperty("overdue");
  });

  it("accepts anomaly response with bounded evidence and severity", () => {
    const anomalies = adminIncidentTrendAnomaliesResponseSchema.parse({
      anomalies: [{
        baseline: 2,
        current: 8,
        deltaPct: 300,
        evidence: [{ label: "route", value: "/v1/admin/incidents/trends" }],
        recommendedAction: "Review trend route pressure before the next operator shift.",
        severity: "warning",
        signal: "Trend pressure increased",
      }],
      generatedAt,
      ok: true,
      requestId,
      summary: {
        critical: 0,
        highestSeverity: "warning",
        warning: 1,
        watch: 0,
      },
      window: "7d",
    });

    expect(anomalies.summary.highestSeverity).toBe("warning");
    expect(anomalies.anomalies[0].deltaPct).toBe(300);
  });

  it("accepts briefing response and keeps capacity review explicit", () => {
    const briefing = adminIncidentTrendBriefingResponseSchema.parse({
      capacityReview: [
        "Trend analytics is a control-plane route under the 10,000 concurrent users baseline.",
        "No browser polling is active in Batch #107.",
        "Exports are bounded and explicit operator actions.",
      ],
      generatedAt,
      ok: true,
      operatorActions: [
        "Review the highest route risk.",
        "Assign owners for breached critical incidents.",
        "Export CSV only for shift handoff.",
      ],
      requestId,
      riskRegister: [routeRisk],
      sections: [
        { body: ["Critical pressure is rising in the current trend window."], title: "Trend" },
        { body: ["Route risk is concentrated in admin audit reads."], title: "Route risk" },
        { body: ["Keep exports bounded and audited."], title: "Export posture" },
      ],
      summary: {
        headline: "Admin incident pressure is rising.",
        highestAnomalySeverity: "warning",
        totalIncidents: 3,
        trendDirection: "up",
      },
      window: "7d",
    });

    expect(briefing.capacityReview.join(" ")).toContain("10,000 concurrent users");
    expect(briefing.sections).toHaveLength(3);
  });
});
