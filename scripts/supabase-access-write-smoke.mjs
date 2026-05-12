#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const expectedProjectRef = "eaasthucczsduwrznrng";
const smokeSupplierSlug = "codex-smoke-supplier";

const readEnvFile = (path) => {
  if (!existsSync(path)) return {};
  const result = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    result[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return result;
};

const env = {
  ...readEnvFile(join(root, ".env")),
  ...readEnvFile(join(root, ".env.local")),
  ...process.env,
};

const fail = (code, message, details = []) => {
  console.error(`access_smoke=${code}`);
  console.error(message);
  for (const detail of details) console.error(`- ${detail}`);
  process.exit(1);
};

const skip = (code, message, details = []) => {
  console.warn(`access_smoke=${code}`);
  console.warn(message);
  for (const detail of details) console.warn(`- ${detail}`);
  process.exit(2);
};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseKey.includes("PASTE_")) {
  fail("invalid_env", "Missing real Supabase frontend config.", [
    "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    ".env.local is gitignored and must not be committed.",
  ]);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (projectRef !== expectedProjectRef) {
  fail("wrong_project", "Supabase URL points to the wrong project.", [
    `Expected project: ${expectedProjectRef}`,
    `Actual project: ${projectRef ?? "unknown"}`,
  ]);
}

const createSmokeClient = () =>
  createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const anon = createSmokeClient();

console.log(`project=${projectRef}`);

const publicSupplier = await anon
  .from("suppliers_public")
  .select("id,profile_slug,country_code")
  .eq("profile_slug", smokeSupplierSlug)
  .maybeSingle();

if (publicSupplier.error) {
  fail("public_read_failed", "Could not read suppliers_public.", [
    `code=${publicSupplier.error.code ?? "n/a"}`,
    publicSupplier.error.message,
  ]);
}

if (!publicSupplier.data?.id) {
  skip("missing_seed", "Smoke supplier baseline is missing.", [
    "Run: npm run supabase:access-seed",
    "Then create or confirm a buyer auth user before rerunning this smoke.",
  ]);
}

console.log("public_read=ok");

const anonInsert = await anon
  .from("supplier_access_requests")
  .insert({
    buyer_user_id: "00000000-0000-0000-0000-000000000000",
    supplier_id: publicSupplier.data.id,
    status: "sent",
    message: "codex-anon-must-not-write",
  })
  .select("id")
  .maybeSingle();

if (!anonInsert.error) {
  fail("anon_write_unexpected", "Anon was able to insert supplier_access_requests.");
}

console.log(`anon_insert=blocked code=${anonInsert.error.code ?? "n/a"}`);

const smokeEmail = env.SUPABASE_SMOKE_EMAIL;
const smokePassword = env.SUPABASE_SMOKE_PASSWORD;

if (!smokeEmail || !smokePassword) {
  skip("missing_auth", "Authenticated smoke credentials are not configured.", [
    "Create a confirmed buyer in Supabase Auth.",
    "Run with SUPABASE_SMOKE_EMAIL and SUPABASE_SMOKE_PASSWORD in the shell environment.",
    "Do not write these credentials into tracked files.",
  ]);
}

const authed = createSmokeClient();
const signIn = await authed.auth.signInWithPassword({
  email: smokeEmail,
  password: smokePassword,
});

if (signIn.error || !signIn.data.user) {
  skip("auth_failed", "Could not sign in with configured smoke buyer.", [
    `status=${signIn.error?.status ?? "n/a"}`,
    `code=${signIn.error?.code ?? "n/a"}`,
    "Confirm the user exists, email is confirmed, and password is correct.",
  ]);
}

console.log("auth=ok");

const roles = await authed
  .from("user_roles")
  .select("role")
  .eq("user_id", signIn.data.user.id);

if (roles.error) {
  fail("role_read_failed", "Could not read current user roles.", [
    `code=${roles.error.code ?? "n/a"}`,
    roles.error.message,
  ]);
}

if (!roles.data?.some((row) => row.role === "buyer")) {
  skip("missing_buyer_role", "Smoke user does not have buyer role.", [
    "New confirmed users should receive buyer role through handle_new_user().",
    "If this user was created manually before the trigger existed, assign buyer role before rerunning.",
  ]);
}

console.log("buyer_role=ok");

const message = `codex-access-smoke-${new Date().toISOString()}`;
let requestId;

const inserted = await authed
  .from("supplier_access_requests")
  .insert({
    buyer_user_id: signIn.data.user.id,
    supplier_id: publicSupplier.data.id,
    status: "sent",
    message,
  })
  .select("id,status,supplier_id,created_at")
  .single();

if (inserted.error?.code === "23505") {
  const existing = await authed
    .from("supplier_access_requests")
    .select("id,status,supplier_id,created_at")
    .eq("buyer_user_id", signIn.data.user.id)
    .eq("supplier_id", publicSupplier.data.id)
    .maybeSingle();

  if (existing.error || !existing.data) {
    fail("existing_request_read_failed", "Access request already exists but could not be read.", [
      `code=${existing.error?.code ?? "n/a"}`,
      existing.error?.message ?? "No existing row returned.",
    ]);
  }

  requestId = existing.data.id;
  console.log(`request_insert=existing status=${existing.data.status}`);
} else if (inserted.error) {
  fail("request_insert_failed", "Could not insert supplier_access_requests.", [
    `code=${inserted.error.code ?? "n/a"}`,
    inserted.error.message,
  ]);
} else {
  requestId = inserted.data.id;
  console.log(`request_insert=ok status=${inserted.data.status}`);
}

const event = await authed.rpc("log_supplier_access_event", {
  p_supplier_access_request_id: requestId,
  p_event_type: "supplier_access_requested",
  p_metadata: { source: "supabase_access_write_smoke" },
});

if (event.error) {
  fail("event_rpc_failed", "log_supplier_access_event RPC failed.", [
    `code=${event.error.code ?? "n/a"}`,
    event.error.message,
  ]);
}

console.log("event_rpc=ok");

const eventRead = await authed
  .from("access_events")
  .select("id,event_type,supplier_access_request_id")
  .eq("id", event.data)
  .maybeSingle();

if (eventRead.error || !eventRead.data) {
  fail("event_read_failed", "Could not read the created access event.", [
    `code=${eventRead.error?.code ?? "n/a"}`,
    eventRead.error?.message ?? "No row returned.",
  ]);
}

if (eventRead.data.event_type !== "supplier_access_requested") {
  fail("event_type_mismatch", "Access event has unexpected event_type.", [
    `event_type=${eventRead.data.event_type}`,
  ]);
}

console.log("event_read=ok");
console.log("access_smoke=ok");
