import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { sha256 } from "./checksum.js";

export interface MigrationManifestEntry {
  id: string;
  file: string;
  description: string;
  ownedTables: string[];
  dependsOn: string[];
}

export interface MigrationManifest {
  package: "@yorso/db";
  productionTarget: "self-hosted-postgresql";
  supabaseRole: "prototype-reference-only";
  migrations: MigrationManifestEntry[];
}

export interface MigrationPlanItem extends MigrationManifestEntry {
  absoluteFile: string;
  sql: string;
  checksum: string;
}

export interface MigrationPlan {
  rootDir: string;
  manifestFile: string;
  migrations: MigrationPlanItem[];
}

export class MigrationManifestError extends Error {
  constructor(public readonly failures: string[]) {
    super(`Invalid YORSO DB migration manifest:\n- ${failures.join("\n- ")}`);
    this.name = "MigrationManifestError";
  }
}

const defaultRootDir = () => path.resolve("packages/db");

const readJson = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export function loadMigrationManifest(rootDir = defaultRootDir()): MigrationManifest {
  const manifestFile = path.join(rootDir, "migration-manifest.json");
  const raw = readJson(manifestFile);

  if (!isObject(raw)) {
    throw new MigrationManifestError(["migration-manifest.json must be an object"]);
  }

  const migrations = raw.migrations;
  if (!Array.isArray(migrations)) {
    throw new MigrationManifestError(["migrations must be an array"]);
  }

  return {
    package: raw.package,
    productionTarget: raw.productionTarget,
    supabaseRole: raw.supabaseRole,
    migrations: migrations.map((migration, index) => {
      if (!isObject(migration)) {
        throw new MigrationManifestError([`migrations[${index}] must be an object`]);
      }

      return {
        id: migration.id,
        file: migration.file,
        description: migration.description,
        ownedTables: migration.ownedTables,
        dependsOn: migration.dependsOn,
      } as MigrationManifestEntry;
    }),
  } as MigrationManifest;
}

export function buildMigrationPlan(rootDir = defaultRootDir()): MigrationPlan {
  const manifestFile = path.join(rootDir, "migration-manifest.json");
  const manifest = loadMigrationManifest(rootDir);
  const failures = validateManifestShape(manifest);
  const ids = new Set<string>();

  for (const migration of manifest.migrations) {
    if (ids.has(migration.id)) {
      failures.push(`duplicate migration id: ${migration.id}`);
    }
    ids.add(migration.id);
  }

  for (const migration of manifest.migrations) {
    validateMigrationEntry(rootDir, migration, ids, failures);
  }

  const ordered = [...manifest.migrations].sort((a, b) => a.id.localeCompare(b.id));
  const declaredIds = manifest.migrations.map((migration) => migration.id).join("\n");
  const orderedIds = ordered.map((migration) => migration.id).join("\n");

  if (declaredIds !== orderedIds) {
    failures.push("migrations must be declared in deterministic id order");
  }

  if (failures.length > 0) {
    throw new MigrationManifestError(failures);
  }

  return {
    rootDir,
    manifestFile,
    migrations: ordered.map((migration) => {
      const absoluteFile = path.join(rootDir, migration.file);
      const sql = readFileSync(absoluteFile, "utf8");

      return {
        ...migration,
        absoluteFile,
        sql,
        checksum: sha256(sql),
      };
    }),
  };
}

function validateManifestShape(manifest: MigrationManifest): string[] {
  const failures: string[] = [];

  if (manifest.package !== "@yorso/db") {
    failures.push("package must be @yorso/db");
  }
  if (manifest.productionTarget !== "self-hosted-postgresql") {
    failures.push("productionTarget must be self-hosted-postgresql");
  }
  if (manifest.supabaseRole !== "prototype-reference-only") {
    failures.push("supabaseRole must be prototype-reference-only");
  }
  if (manifest.migrations.length === 0) {
    failures.push("at least one migration is required");
  }

  return failures;
}

function validateMigrationEntry(
  rootDir: string,
  migration: MigrationManifestEntry,
  ids: Set<string>,
  failures: string[],
): void {
  for (const [field, value] of Object.entries(migration)) {
    if (field === "ownedTables" || field === "dependsOn") continue;
    if (typeof value !== "string" || value.trim() === "") {
      failures.push(`${migration.id || "unknown migration"}: ${field} must be a non-empty string`);
    }
  }

  if (!isStringArray(migration.ownedTables) || migration.ownedTables.length === 0) {
    failures.push(`${migration.id}: ownedTables must contain at least one table`);
  }
  if (!isStringArray(migration.dependsOn)) {
    failures.push(`${migration.id}: dependsOn must be a string array`);
  }

  for (const dependency of migration.dependsOn ?? []) {
    if (!ids.has(dependency)) {
      failures.push(`${migration.id}: unknown dependency ${dependency}`);
    }
    if (dependency >= migration.id) {
      failures.push(`${migration.id}: dependency ${dependency} must sort before dependent migration`);
    }
  }

  if (!migration.file.startsWith("migrations/")) {
    failures.push(`${migration.id}: file must live under migrations/`);
  }
  if (!path.basename(migration.file).startsWith(migration.id)) {
    failures.push(`${migration.id}: file name must start with migration id`);
  }
  if (path.isAbsolute(migration.file) || migration.file.includes("..")) {
    failures.push(`${migration.id}: file must be a safe relative path`);
  }

  const absoluteFile = path.join(rootDir, migration.file);
  if (!existsSync(absoluteFile)) {
    failures.push(`${migration.id}: missing SQL file ${migration.file}`);
    return;
  }

  const sql = readFileSync(absoluteFile, "utf8");
  const lowered = sql.toLowerCase();
  if (sql.trim().length === 0) {
    failures.push(`${migration.id}: SQL file is empty`);
  }
  if (lowered.includes("auth.users")) {
    failures.push(`${migration.id}: must not depend on auth.users`);
  }
  if (lowered.includes("supabase")) {
    failures.push(`${migration.id}: must not mention Supabase in self-hosted SQL`);
  }
  if (lowered.includes("enable row level security")) {
    failures.push(`${migration.id}: self-hosted DB baseline must not depend on RLS as API authorization`);
  }
}
