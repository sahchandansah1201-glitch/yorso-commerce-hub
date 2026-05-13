#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const files = [
  "packages/db/README.md",
  "packages/db/migration-manifest.json",
  "packages/db/migrations/0001_account_company_baseline.sql",
];

const failures = [];

for (const file of files) {
  if (!existsSync(file)) failures.push(`missing ${file}`);
}

const read = (file) => readFileSync(file, "utf8");
const sql = read("packages/db/migrations/0001_account_company_baseline.sql");
const manifest = JSON.parse(read("packages/db/migration-manifest.json"));
const readme = read("packages/db/README.md");
const pkg = JSON.parse(read("package.json"));

const requireText = (name, text, marker) => {
  if (!text.includes(marker)) failures.push(`${name}: missing ${JSON.stringify(marker)}`);
};

const forbidText = (name, text, marker) => {
  if (text.includes(marker)) failures.push(`${name}: forbidden ${JSON.stringify(marker)}`);
};

for (const marker of [
  "create table if not exists yorso_users",
  "create table if not exists yorso_companies",
  "create table if not exists yorso_company_media",
  "create type yorso_account_role",
  "create type yorso_company_publication_status",
  "create type yorso_buyer_qualification_status",
  "references yorso_users(id)",
  "references yorso_companies(id)",
  "idx_yorso_companies_owner_user_id",
  "idx_yorso_companies_country_code",
  "Self-hosted YORSO",
]) {
  requireText("packages/db/migrations/0001_account_company_baseline.sql", sql, marker);
}

forbidText("packages/db/migrations/0001_account_company_baseline.sql", sql, "auth.users");
forbidText("packages/db/migrations/0001_account_company_baseline.sql", sql, "supabase");

if (manifest.productionTarget !== "self-hosted-postgresql") {
  failures.push("packages/db/migration-manifest.json: productionTarget must be self-hosted-postgresql");
}
if (!manifest.migrations?.some((migration) => migration.id === "0001_account_company_baseline")) {
  failures.push("packages/db/migration-manifest.json: missing 0001_account_company_baseline");
}

requireText("packages/db/README.md", readme, "self-hosted PostgreSQL baseline");
requireText("packages/db/README.md", readme, "Supabase migrations may still exist as prototype references");

if (pkg.scripts["check:self-hosted-db"] !== "node scripts/check-self-hosted-db.mjs") {
  failures.push("package.json: check:self-hosted-db script missing or incorrect");
}
if (!pkg.scripts["ci:core"]?.includes("npm run check:self-hosted-db")) {
  failures.push("package.json: ci:core must run check:self-hosted-db");
}

if (failures.length > 0) {
  console.error("Self-hosted DB check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Self-hosted DB check passed.");
console.log("- packages/db owns the account/company PostgreSQL baseline.");
console.log("- Supabase auth/RLS dependencies are not used by the self-hosted DB baseline.");
