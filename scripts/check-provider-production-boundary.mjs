#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const roots = [
  "apps/api/src",
  "packages/contracts/src",
  "packages/db/src",
  "src/components",
  "src/hooks",
  "src/lib",
  "src/pages",
];

const forbiddenPatterns = [
  [/@supabase\//i, "@supabase SDK import"],
  [/supabase/i, "Supabase production source reference"],
  [/@\/integrations\/supabase\/client/i, "Supabase integration client import"],
  [/VITE_SUPABASE/i, "Supabase frontend env key"],
  [/supabase_prototype/i, "Supabase prototype runtime branch"],
  [/legacy-[\w-]+-supabase-adapter/i, "legacy Supabase adapter"],
  [/supabaseProductionBackend/i, "Supabase production policy field"],
  [/prototypeSupabaseConfigured/i, "Supabase prototype policy field"],
];

const files = [];

const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!stats.isFile()) continue;
    if (!/\.(ts|tsx|js|mjs|json)$/.test(entry)) continue;
    if (/\.(test|spec)\.(ts|tsx|js)$/.test(entry)) continue;
    files.push(path.normalize(fullPath));
  }
};

for (const root of roots) walk(root);

const violations = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(text)) violations.push(`${file}: ${label}`);
  }
}

if (existsSync("src/integrations/supabase")) {
  violations.push("src/integrations/supabase: Supabase integration directory must not exist");
}

if (existsSync("supabase")) {
  violations.push("supabase: Supabase reference project directory must not exist");
}

if (violations.length > 0) {
  console.error("Provider-free production boundary check failed.");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("Provider-free production boundary check passed.");
console.log(`Scanned ${files.length} production source files.`);
console.log("No production code imports Supabase or hosted BaaS SDKs.");
