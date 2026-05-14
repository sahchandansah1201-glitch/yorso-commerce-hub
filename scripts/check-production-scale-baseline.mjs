#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/backend/production-scale-baseline.md",
  "docs/backend/self-hosted-backend-architecture.md",
  "docs/backend/self-hosted-validation.md",
  "packages/db/migrations/0005_supplier_directory_search_scaling.sql",
  "packages/db/migration-manifest.json",
  "package.json",
  "src/lib/supplier-directory-api.ts",
  "src/pages/Suppliers.tsx",
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required file ${file}`);
}

const read = (file) => readFileSync(file, "utf8");
const baseline = read("docs/backend/production-scale-baseline.md");
const architecture = read("docs/backend/self-hosted-backend-architecture.md");
const validation = read("docs/backend/self-hosted-validation.md");
const supplierScaling = read("packages/db/migrations/0005_supplier_directory_search_scaling.sql");
const manifest = JSON.parse(read("packages/db/migration-manifest.json"));
const pkg = JSON.parse(read("package.json"));
const supplierApi = read("src/lib/supplier-directory-api.ts");
const suppliersPage = read("src/pages/Suppliers.tsx");

const requireText = (name, text, marker) => {
  if (!text.includes(marker)) failures.push(`${name}: missing ${JSON.stringify(marker)}`);
};

for (const marker of [
  "10,000 concurrent web users",
  "Required Capacity Review",
  "Connection strategy",
  "Queue/backpressure",
  "Observability",
  "Load test",
  "Supabase may remain as prototype/reference tooling, not as production",
  "Batch #36 promotes the target",
]) {
  requireText("docs/backend/production-scale-baseline.md", baseline, marker);
}

for (const marker of [
  "10,000 concurrent web users",
  "10,000 direct PostgreSQL connections are not an acceptable architecture",
  "PgBouncer",
  "Redis",
  "queue workers",
  "0005_supplier_directory_search_scaling",
]) {
  requireText("docs/backend/self-hosted-backend-architecture.md", architecture, marker);
}

for (const marker of [
  "check:production-scale-baseline",
  "10,000 concurrent-user read path",
  "supplier-directory trigram search indexes",
]) {
  requireText("docs/backend/self-hosted-validation.md", validation, marker);
}

for (const marker of [
  "create extension if not exists pg_trgm",
  "gin_trgm_ops",
  "idx_yorso_suppliers_directory_public_search_text",
  "idx_yorso_suppliers_directory_private_search_text",
  "idx_yorso_suppliers_directory_product_focus_search",
  "idx_yorso_suppliers_directory_certifications_search",
  "idx_yorso_suppliers_directory_verification_level",
  "high-concurrency catalog traffic",
]) {
  requireText("packages/db/migrations/0005_supplier_directory_search_scaling.sql", supplierScaling, marker);
}

if (!manifest.migrations?.some((migration) => migration.id === "0005_supplier_directory_search_scaling")) {
  failures.push("packages/db/migration-manifest.json: missing 0005_supplier_directory_search_scaling");
}

if (pkg.scripts["check:production-scale-baseline"] !== "node scripts/check-production-scale-baseline.mjs") {
  failures.push("package.json: check:production-scale-baseline script missing or incorrect");
}

if (!pkg.scripts["ci:core"]?.includes("npm run check:production-scale-baseline")) {
  failures.push("package.json: ci:core must run check:production-scale-baseline");
}

for (const marker of [
  "limit",
  "offset",
  "verificationLevel",
]) {
  requireText("src/lib/supplier-directory-api.ts", supplierApi, marker);
}

for (const marker of [
  "setTimeout",
  "limit: 50",
  "offset: 0",
]) {
  requireText("src/pages/Suppliers.tsx", suppliersPage, marker);
}

if (failures.length > 0) {
  console.error("Production scale baseline check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production scale baseline check passed.");
console.log("- 10,000 concurrent-user target is documented.");
console.log("- supplier directory read path has scaling guardrails.");
console.log("- ci:core enforces the baseline check.");
