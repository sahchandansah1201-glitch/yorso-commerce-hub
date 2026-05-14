#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";

const files = [
  "docs/backend/yorso-backend-implementation-plan.md",
  "docs/backend/yorso-backend-implementation-plan.ru.md",
  "docs/backend/frontend-backend-contract.md",
  "docs/backend/self-hosted-backend-architecture.md",
  "docs/backend/self-hosted-api-skeleton.md",
  "docs/backend/self-hosted-validation.md",
  "docs/backend/self-hosted-db-migrations.md",
  "docs/backend/production-scale-baseline.md",
];

const requiredMarkers = [
  {
    file: "docs/backend/yorso-backend-implementation-plan.md",
    markers: [
      "Build a self-hosted YORSO backend as the production target.",
      "Supabase is no longer the future production backend.",
    ],
  },
  {
    file: "docs/backend/yorso-backend-implementation-plan.ru.md",
    markers: [
      "Production target: self-hosted backend.",
      "Supabase больше не рассматривается как будущий production backend.",
    ],
  },
  {
    file: "docs/backend/frontend-backend-contract.md",
    markers: [
      "Production backend target is self-hosted YORSO API plus PostgreSQL.",
      "Frontend pages must not import Supabase clients as production data gateways.",
    ],
  },
  {
    file: "docs/backend/self-hosted-backend-architecture.md",
    markers: [
      "YORSO production backend must be self-hosted",
      "Supabase is not the future production backend.",
    ],
  },
  {
    file: "docs/backend/self-hosted-api-skeleton.md",
    markers: [
      "`apps/api` is the first concrete backend service",
      "The API skeleton does not import the Supabase client.",
    ],
  },
  {
    file: "docs/backend/self-hosted-validation.md",
    markers: [
      "one deployable YORSO product",
      "`check:self-hosted-api` validates",
      "`check:production-scale-baseline` validates",
    ],
  },
  {
    file: "docs/backend/self-hosted-db-migrations.md",
    markers: [
      "self-hosted PostgreSQL source of truth",
      "Do not design production migrations around Supabase-specific tables",
    ],
  },
  {
    file: "docs/backend/production-scale-baseline.md",
    markers: [
      "10,000 concurrent web users",
      "Every production-facing change must document",
      "Supabase may remain as prototype/reference tooling",
    ],
  },
];

const forbiddenPatterns = [
  /Use Supabase as the first backend layer\./i,
  /Рекомендуемый первый backend-слой:\s*Supabase\./i,
  /Custom backend can be added later only when Supabase becomes a constraint\./i,
  /Supabase becomes a constraint/i,
  /production backend target is Supabase/i,
  /Supabase as (the )?production backend/i,
];

const failures = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) failures.push(`${file}: forbidden Supabase production wording matched ${pattern}`);
  }
}

for (const { file, markers } of requiredMarkers) {
  const text = readFileSync(file, "utf8");
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${file}: missing required marker ${JSON.stringify(marker)}`);
  }
}

if (failures.length > 0) {
  console.error("Self-hosted backend policy check failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Self-hosted backend policy check passed for ${files.length} files.`);
for (const file of files) console.log(`- ${path.normalize(file)}`);
