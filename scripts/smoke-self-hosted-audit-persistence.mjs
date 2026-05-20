#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { buildAuditEvent, PostgresAuditSink, auditHash } from "../apps/api/dist/audit.js";

if (!existsSync("apps/api/dist/audit.js")) {
  console.error("Compiled API audit module is missing.");
  console.error("Run: npm run api:build");
  process.exit(1);
}

const context = {
  correlationId: "corr-audit-persistence",
  requestId: "req-audit-persistence",
  startedAt: Date.now(),
};

const sensitive = {
  actorUserId: "00000000-0000-4000-8000-000000000001",
  sessionId: "sess_sensitive_batch89",
  resourceId: "company_private_batch89",
};

const event = buildAuditEvent(context, {
  action: "account.company.update",
  actorUserId: sensitive.actorUserId,
  httpMethod: "PATCH",
  outcome: "success",
  resourceId: sensitive.resourceId,
  resourceType: "company_profile",
  route: "/v1/account/company",
  sessionId: sensitive.sessionId,
  statusCode: 200,
});

const queries = [];
const fakeClient = {
  async query(sql, params) {
    queries.push({ sql, params });
    return { rows: [] };
  },
};

const sink = new PostgresAuditSink(
  {
    auditMaxInFlight: 10,
    databaseUrl: "postgres://yorso_app:local@localhost:5432/yorso",
  },
  { client: fakeClient },
);

await sink.emit(event);

assert.equal(queries.length, 1);
assert.match(queries[0].sql, /insert into yorso_api_audit_events/i);
assert.match(queries[0].sql, /on conflict \(audit_id\) do nothing/i);
assert.equal(queries[0].params[0], event.auditId);
assert.equal(queries[0].params[9], auditHash(sensitive.actorUserId));
assert.equal(queries[0].params[10], auditHash(sensitive.sessionId));
assert.equal(queries[0].params[12], auditHash(sensitive.resourceId));
assert.equal(JSON.parse(queries[0].params[14]).type, "api_audit_event");
console.log("audit_persistence_insert=ok");

const serialized = JSON.stringify(queries);
for (const value of Object.values(sensitive)) {
  assert.equal(serialized.includes(value), false, `raw sensitive value leaked: ${value}`);
}
console.log("audit_persistence_hash_only=ok");

let releasePendingQuery = () => {};
const pendingClient = {
  async query() {
    return await new Promise((resolve) => {
      releasePendingQuery = () => resolve({ rows: [] });
    });
  },
};
const backpressureSink = new PostgresAuditSink(
  {
    auditMaxInFlight: 1,
    databaseUrl: "postgres://yorso_app:local@localhost:5432/yorso",
  },
  { client: pendingClient },
);

const errorMessages = [];
const originalError = console.error;
console.error = (message, ...rest) => {
  errorMessages.push(String(message));
  if (rest.length > 0) errorMessages.push(rest.map(String).join(" "));
};

const firstWrite = backpressureSink.emit(event);
await backpressureSink.emit({
  ...event,
  auditId: `${event.auditId}_dropped`,
  requestId: "req-audit-dropped",
  correlationId: "corr-audit-dropped",
});
releasePendingQuery();
await firstWrite;
console.error = originalError;

const backpressureLog = errorMessages.join("\n");
assert.match(backpressureLog, /api_audit_dropped/);
assert.match(backpressureLog, /audit_backpressure/);
for (const value of Object.values(sensitive)) {
  assert.equal(backpressureLog.includes(value), false, `raw sensitive value leaked in drop log: ${value}`);
}
console.log("audit_persistence_backpressure=ok");
console.log("self_hosted_audit_persistence_smoke=ok");
