import assert from "node:assert/strict";
import test from "node:test";

import { summarizeLocalLabHealth } from "./local-lab-service.mjs";

const healthy = (name, required) => ({
  name,
  required,
  healthy: true,
  detail: "HTTP 200",
});

test("keeps the local lab healthy when only optional CRM is unavailable", () => {
  const summary = summarizeLocalLabHealth([
    healthy("YORSO UI", true),
    healthy("YORSO API", true),
    { name: "Twenty CRM", required: false, healthy: false, detail: "connection refused" },
  ]);

  assert.equal(summary.requiredHealthy, true);
  assert.equal(summary.degraded, true);
  assert.match(summary.message, /Twenty CRM=unavailable/);
});

test("reports the local lab unhealthy when a required service is unavailable", () => {
  const summary = summarizeLocalLabHealth([
    { name: "YORSO UI", required: true, healthy: false, detail: "connection refused" },
    healthy("YORSO API", true),
    healthy("Twenty CRM", false),
  ]);

  assert.equal(summary.requiredHealthy, false);
  assert.equal(summary.degraded, false);
});
