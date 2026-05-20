#!/usr/bin/env node

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.url ?? process.env.YORSO_API_URL);
const email = args.email ?? process.env.YORSO_ADMIN_EMAIL;
const password = args.password ?? process.env.YORSO_ADMIN_PASSWORD;
const mode = args.apply ? "apply" : "dry_run";

if (!baseUrl || !email || !password) {
  console.error("admin_audit_retention=failed");
  console.error("Required: YORSO_API_URL, YORSO_ADMIN_EMAIL, YORSO_ADMIN_PASSWORD.");
  console.error("Optional args: --apply --retention-days=365 --before=ISO_DATE --batch-size=1000 --max-batches=1");
  process.exit(1);
}

try {
  const sessionHeaders = await signIn(baseUrl, email, password);
  const payload = {
    mode,
    ...(args.before ? { before: args.before } : {}),
    ...(args.retentionDays ? { retentionDays: Number(args.retentionDays) } : {}),
    ...(args.batchSize ? { batchSize: Number(args.batchSize) } : {}),
    ...(args.maxBatches ? { maxBatches: Number(args.maxBatches) } : {}),
  };
  const response = await fetch(`${baseUrl}/v1/admin/audit-events/retention`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Retention request failed with ${response.status}: ${JSON.stringify(body)}`);
  }
  console.log(`admin_audit_retention=${body.mode}`);
  console.log(`before=${body.before}`);
  console.log(`scanned_before_cutoff=${body.scannedBeforeCutoff}`);
  console.log(`deleted_count=${body.deletedCount}`);
  console.log(`remaining_before_cutoff=${body.remainingBeforeCutoff}`);
} catch (error) {
  console.error("admin_audit_retention=failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

async function signIn(baseUrl, email, password) {
  const response = await fetch(`${baseUrl}/v1/auth/sign-in`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Admin sign-in failed with ${response.status}: ${JSON.stringify(body)}`);
  }
  return {
    "content-type": "application/json",
    "x-yorso-session-id": body.session.id,
    "x-yorso-user-id": body.session.userId,
  };
}

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    if (arg === "--apply") {
      parsed.apply = true;
      continue;
    }
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    parsed[key] = match[2];
  }
  return parsed;
}

function normalizeBaseUrl(value) {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}
