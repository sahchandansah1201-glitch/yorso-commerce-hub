import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const typesPath = join(root, "src/integrations/supabase/types.ts");
const projectId = "eaasthucczsduwrznrng";
const isStrict =
  process.argv.includes("--strict") ||
  process.env.SUPABASE_TYPES_STRICT === "1";

const requiredMigrations = [
  "supabase/migrations/20260511130000_backend_access_foundation.sql",
  "supabase/migrations/20260511143000_access_event_logging_rpc.sql",
  "supabase/migrations/20260511150000_access_events_hardening.sql",
  "supabase/migrations/20260511153000_admin_access_events_view.sql",
];

const requiredTypeMarkers = [
  'access_events: {',
  'access_grants: {',
  'supplier_access_requests: {',
  'access_events_admin: {',
  'log_supplier_access_event: {',
  'access_event_type:',
  'access_grant_scope:',
  'access_request_status:',
];

const missingMigrations = requiredMigrations.filter(
  (migrationPath) => !existsSync(join(root, migrationPath)),
);

const driftHeader = [
  "Supabase generated types are out of sync with backend access migrations.",
  `Mode: ${isStrict ? "strict backend-readiness gate" : "non-strict diagnostic guard"}.`,
  `Project: ${projectId}.`,
];

const driftActions = [
  "Required backend sequence:",
  "1. Apply pending Supabase migrations to the live project.",
  "2. Regenerate src/integrations/supabase/types.ts from that migrated project.",
  "3. Run npm run check:supabase-types:strict.",
  "Suggested command after migrations are applied:",
  "npm run supabase:types:regen",
];

const finishWithDrift = (lines) => {
  const write = isStrict ? console.error : console.warn;
  for (const line of [...driftHeader, ...lines, ...driftActions]) write(line);
  if (isStrict) {
    process.exit(1);
  }
  console.warn(
    "Non-strict mode: continuing for diagnostics only.",
  );
  console.warn(
    "Run `npm run check:supabase-types:strict` after applying migrations and regenerating types.",
  );
};

if (missingMigrations.length > 0) {
  console.error("Missing backend access migrations:");
  for (const migrationPath of missingMigrations) {
    console.error(`- ${migrationPath}`);
  }
  process.exit(1);
}

if (!existsSync(typesPath)) {
  finishWithDrift([
    "Missing Supabase generated types file:",
    `- ${typesPath}`,
  ]);
  process.exit(0);
}

const types = readFileSync(typesPath, "utf8");
const missingMarkers = requiredTypeMarkers.filter(
  (marker) => !types.includes(marker),
);

if (missingMarkers.length > 0) {
  finishWithDrift([
    "Missing type markers:",
    ...missingMarkers.map((marker) => `- ${marker}`),
  ]);
  process.exit(0);
}

console.log("Supabase access types are in sync with backend access migrations.");
