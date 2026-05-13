#!/usr/bin/env node
import { buildMigrationPlan, MigrationManifestError } from "./migrator.js";
import {
  applyPendingMigrations,
  formatApplyResult,
  formatMigrationStatus,
  getMigrationStatus,
  MigrationRuntimeError,
} from "./runtime.js";
import {
  createPostgresMigrationClient,
  maskDatabaseUrl,
  resolveMigrationAppliedBy,
  resolveMigrationDatabaseUrl,
} from "./postgres-client.js";

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

async function main(): Promise<void> {
  const plan = buildMigrationPlan();

  if (command === "plan") {
    console.log(`YORSO self-hosted DB migration plan: ${plan.migrations.length} migrations`);
    for (const migration of plan.migrations) {
      console.log(`${migration.id} ${migration.checksum} ${migration.file}`);
    }
  } else if (command === "check") {
    console.log(`Self-hosted DB migration check passed. ${plan.migrations.length} migrations.`);
  } else if (command === "status" && !flags.has("--live")) {
    console.log("Database connection is not wired yet. Static status from local plan:");
    for (const migration of plan.migrations) console.log(`${migration.id} planned ${migration.checksum}`);
  } else if (command === "status" && flags.has("--live")) {
    const databaseUrl = resolveMigrationDatabaseUrl();
    const connection = await createPostgresMigrationClient({ connectionString: databaseUrl });
    try {
      console.log(`Connected to ${maskDatabaseUrl(databaseUrl)}`);
      const status = await getMigrationStatus(connection.client, plan);
      for (const line of formatMigrationStatus(status)) console.log(line);
      if (status.drifted.length > 0) process.exitCode = 1;
    } finally {
      await connection.close();
    }
  } else if (command === "apply" && !flags.has("--live") && flags.has("--dry-run")) {
    console.log("Database connection is not wired yet. Dry-run apply preview from local plan:");
    console.log(`dryRun=true`);
    console.log(`applied=0`);
    console.log(`pending=${plan.migrations.length}`);
    console.log(`skipped=0`);
    for (const migration of plan.migrations) console.log(`pending ${migration.id}`);
  } else if (command === "apply" && flags.has("--live")) {
    const dryRun = flags.has("--dry-run");
    const confirmed = flags.has("--confirm");

    if (!dryRun && !confirmed) {
      console.error("Live apply requires --confirm. For preview, run with --live --dry-run.");
      process.exit(2);
    }

    const databaseUrl = resolveMigrationDatabaseUrl();
    const connection = await createPostgresMigrationClient({ connectionString: databaseUrl });
    try {
      console.log(`Connected to ${maskDatabaseUrl(databaseUrl)}`);
      const result = await applyPendingMigrations(connection.client, plan, {
        dryRun,
        appliedBy: resolveMigrationAppliedBy(),
      });
      for (const line of formatApplyResult(result)) console.log(line);
    } finally {
      await connection.close();
    }
  } else {
    console.error("Live apply requires --live --confirm. Static apply requires --dry-run.");
    console.error("Run: npm run db:migrations:apply:dry-run or npm run db:migrations:apply:live:dry-run.");
    process.exit(2);
  }
}

try {
  await main();
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
