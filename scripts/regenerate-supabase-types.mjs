import { existsSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const projectId = "eaasthucczsduwrznrng";
const outputPath = join(root, "src/integrations/supabase/types.ts");

const requiredTypeMarkers = [
  "access_events: {",
  "access_grants: {",
  "supplier_access_requests: {",
  "access_events_admin: {",
  "log_supplier_access_event: {",
  "access_event_type:",
  "access_grant_scope:",
  "access_request_status:",
];

const supabaseArgs = [
  "supabase",
  "gen",
  "types",
  "typescript",
  "--project-id",
  projectId,
  "--schema",
  "public",
];

const result = spawnSync("npx", supabaseArgs, {
  cwd: root,
  encoding: "utf8",
  env: process.env,
});

if (result.status !== 0) {
  console.error("Failed to regenerate Supabase types.");
  console.error("");
  console.error("Required prerequisites:");
  console.error("- live Supabase project migrations are applied");
  console.error("- Supabase CLI can authenticate, usually via SUPABASE_ACCESS_TOKEN");
  console.error(`- project id is ${projectId}`);
  console.error("");
  console.error("Underlying command:");
  console.error(`npx ${supabaseArgs.join(" ")}`);
  if (result.stderr.trim()) {
    console.error("");
    console.error(result.stderr.trim());
  }
  process.exit(result.status ?? 1);
}

if (!result.stdout.trim()) {
  console.error("Supabase CLI returned empty types output.");
  process.exit(1);
}

const missingMarkers = requiredTypeMarkers.filter(
  (marker) => !result.stdout.includes(marker),
);

if (missingMarkers.length > 0) {
  console.error("Generated Supabase types are still missing access markers.");
  console.error("The live Supabase schema likely has not received access migrations yet.");
  console.error("No files were modified.");
  console.error("Missing type markers:");
  for (const marker of missingMarkers) {
    console.error(`- ${marker}`);
  }
  process.exit(1);
}

writeFileSync(outputPath, result.stdout);

const check = spawnSync(
  "npm",
  ["run", "check:supabase-types:strict"],
  {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
  },
);

if (check.status !== 0) {
  console.error("");
  console.error("Types were regenerated, but strict access type check failed.");
  console.error("This usually means the live Supabase schema is still pre-access.");
  process.exit(check.status ?? 1);
}

if (!existsSync(outputPath)) {
  console.error(`Expected output file was not created: ${outputPath}`);
  process.exit(1);
}

console.log(`Regenerated Supabase types: ${outputPath}`);
