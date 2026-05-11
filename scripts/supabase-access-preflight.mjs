import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const configPath = join(root, "supabase/config.toml");
const linkedProjectPath = join(root, "supabase/.temp/project-ref");
const projectIdFallback = "eaasthucczsduwrznrng";

const requiredMigrations = [
  "supabase/migrations/20260511130000_backend_access_foundation.sql",
  "supabase/migrations/20260511143000_access_event_logging_rpc.sql",
  "supabase/migrations/20260511150000_access_events_hardening.sql",
  "supabase/migrations/20260511153000_admin_access_events_view.sql",
];

const result = {
  ok: true,
  warnings: [],
  failures: [],
};

const readProjectId = () => {
  if (!existsSync(configPath)) return projectIdFallback;
  const config = readFileSync(configPath, "utf8");
  const match = config.match(/project_id\s*=\s*"([^"]+)"/);
  return match?.[1] ?? projectIdFallback;
};

const run = (command, args) =>
  spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });

const extractJsonArray = (text) => {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  return text.slice(start, end + 1);
};

const projectId = readProjectId();

console.log(`Supabase access preflight for project ${projectId}`);
console.log("");

const cliVersion = run("npx", ["supabase", "--version"]);
if (cliVersion.status !== 0) {
  result.ok = false;
  result.failures.push("Supabase CLI is unavailable through npx.");
} else {
  console.log(`CLI: ${cliVersion.stdout.trim()}`);
}

const missingMigrations = requiredMigrations.filter(
  (migrationPath) => !existsSync(join(root, migrationPath)),
);

if (missingMigrations.length > 0) {
  result.ok = false;
  result.failures.push("Required backend access migrations are missing:");
  for (const migrationPath of missingMigrations) {
    result.failures.push(`  - ${migrationPath}`);
  }
} else {
  console.log("Local migrations: present");
}

const linkedProjectRef = existsSync(linkedProjectPath)
  ? readFileSync(linkedProjectPath, "utf8").trim()
  : null;

if (linkedProjectRef === projectId) {
  console.log(`Linked project: ${linkedProjectRef}`);
} else if (linkedProjectRef) {
  result.ok = false;
  result.failures.push(
    `Supabase CLI is linked to ${linkedProjectRef}, expected ${projectId}.`,
  );
} else {
  result.ok = false;
  result.failures.push("Supabase CLI is not linked to the YORSO project.");
}

const projects = run("npx", ["supabase", "projects", "list", "-o", "json"]);
const projectsJson = extractJsonArray(
  `${projects.stdout ?? ""}\n${projects.stderr ?? ""}`,
);

if (projects.status !== 0 && !projectsJson) {
  result.ok = false;
  result.failures.push("Cannot list Supabase projects for the current login.");
  if (projects.stderr.trim()) result.failures.push(projects.stderr.trim());
} else if (projectsJson) {
  try {
    const parsed = JSON.parse(projectsJson);
    const matchingProject = parsed.find((project) => project.ref === projectId);
    if (matchingProject) {
      console.log(`Project access: found ${matchingProject.name}`);
    } else {
      result.ok = false;
      result.failures.push(
        `Current Supabase login cannot access project ${projectId}.`,
      );
      const visibleProjects = parsed
        .map((project) => `${project.name} (${project.ref})`)
        .join(", ");
      if (visibleProjects) {
        result.failures.push(`Visible projects: ${visibleProjects}`);
      }
    }
  } catch (error) {
    result.ok = false;
    result.failures.push(`Cannot parse Supabase projects output: ${error}`);
  }
}

const strict = run("npm", ["run", "check:supabase-types:strict"]);
if (strict.status === 0) {
  console.log("Generated types: strict check passed");
} else {
  result.warnings.push(
    "Generated types strict check is failing until live migrations are applied and types are regenerated.",
  );
}

console.log("");

if (result.warnings.length > 0) {
  console.log("Warnings:");
  for (const warning of result.warnings) {
    console.log(`- ${warning}`);
  }
  console.log("");
}

if (!result.ok) {
  console.error("Preflight failed. Do not apply live migrations yet.");
  for (const failure of result.failures) {
    console.error(`- ${failure}`);
  }
  console.error("");
  console.error("Required sequence:");
  console.error(`1. Log in with access to Supabase project ${projectId}.`);
  console.error(`2. Link the repo: npx supabase link --project-ref ${projectId}`);
  console.error("3. Run: npx supabase db push --dry-run");
  console.error("4. Review pending migrations.");
  console.error("5. Run live migration only after explicit approval.");
  console.error("6. Run: npm run supabase:types:regen");
  process.exit(1);
}

console.log("Preflight passed. Next safe command:");
console.log("npx supabase db push --dry-run");
