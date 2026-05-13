#!/usr/bin/env node
import { buildMigrationPlan, MigrationManifestError } from "./migrator.js";

type Command = "plan" | "check";

const command = process.argv[2] as Command | undefined;

function usage(): never {
  console.error("Usage: node packages/db/dist/cli.js <plan|check>");
  process.exit(2);
}

if (command !== "plan" && command !== "check") {
  usage();
}

try {
  const plan = buildMigrationPlan();

  if (command === "plan") {
    console.log(`YORSO self-hosted DB migration plan: ${plan.migrations.length} migrations`);
    for (const migration of plan.migrations) {
      console.log(`${migration.id} ${migration.checksum} ${migration.file}`);
    }
  } else {
    console.log(`Self-hosted DB migration check passed. ${plan.migrations.length} migrations.`);
  }
} catch (error) {
  if (error instanceof MigrationManifestError) {
    console.error(error.message);
    process.exit(1);
  }

  throw error;
}
