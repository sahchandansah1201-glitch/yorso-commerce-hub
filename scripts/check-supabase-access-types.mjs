import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const typesPath = join(root, "src/integrations/supabase/types.ts");

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

if (missingMigrations.length > 0) {
  console.error("Missing backend access migrations:");
  for (const migrationPath of missingMigrations) {
    console.error(`- ${migrationPath}`);
  }
  process.exit(1);
}

if (!existsSync(typesPath)) {
  console.error("Missing Supabase generated types file:");
  console.error(`- ${typesPath}`);
  process.exit(1);
}

const types = readFileSync(typesPath, "utf8");
const missingMarkers = requiredTypeMarkers.filter(
  (marker) => !types.includes(marker),
);

if (missingMarkers.length > 0) {
  console.error(
    "Supabase generated types are out of sync with backend access migrations.",
  );
  console.error(
    "Apply the migrations and regenerate src/integrations/supabase/types.ts.",
  );
  console.error("Missing type markers:");
  for (const marker of missingMarkers) {
    console.error(`- ${marker}`);
  }
  process.exit(1);
}

console.log("Supabase access types are in sync with backend access migrations.");
