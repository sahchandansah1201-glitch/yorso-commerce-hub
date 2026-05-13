#!/usr/bin/env node
import { buildMigrationPlan, MigrationManifestError } from "./migrator.js";
import { MigrationRuntimeError } from "./runtime.js";

type Command = "plan" | "check" | "status" | "apply";

const command = process.argv[2] as Command | undefined;
const flags = new Set(process.argv.slice(3));

function usage(): never {
  console.error("Usage: node packages/db/dist/cli.js <plan|check|status|apply --dry-run>");
  process.exit(2);
}

if (command !== "plan" && command !== "check" && command !== "status" && command !== "apply") {
  usage();
}

try {
  const plan = buildMigrationPlan();

  if (command === "plan") {
    console.log(`YORSO self-hosted DB migration plan: ${plan.migrations.length} migrations`);
    for (const migration of plan.migrations) {
      console.log(`${migration.id} ${migration.checksum} ${migration.file}`);
    }
  } else if (command === "check") {
    console.log(`Self-hosted DB migration check passed. ${plan.migrations.length} migrations.`);
  } else if (command === "status") {
    console.log("Database connection is not wired yet. Static status from local plan:");
    for (const migration of plan.migrations) console.log(`${migration.id} planned ${migration.checksum}`);
  } else if (flags.has("--dry-run")) {
    console.log("Database connection is not wired yet. Dry-run apply preview from local plan:");
    console.log(`dryRun=true`);
    console.log(`applied=0`);
    console.log(`pending=${plan.migrations.length}`);
    console.log(`skipped=0`);
    for (const migration of plan.migrations) console.log(`pending ${migration.id}`);
  } else {
    console.error("Live apply is intentionally disabled until a PostgreSQL connection adapter is added.");
    console.error("Run: npm run db:migrations:apply:dry-run");
    process.exit(2);
  }
} catch (error) {
  if (error instanceof MigrationManifestError) {
    console.error(error.message);
    process.exit(1);
  }
  if (error instanceof MigrationRuntimeError) {
    console.error(error.message);
    process.exit(1);
  }

  throw error;
}
