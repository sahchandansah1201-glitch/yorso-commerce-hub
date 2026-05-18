#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const roots = ["src/pages", "src/components"];
const supabaseClientImportPattern = /from\s+["']@\/integrations\/supabase\/client["']|from\s+["']\.\.\/.*integrations\/supabase\/client["']/;
const files = [];

const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) walk(fullPath);
    if (stats.isFile() && /\.(ts|tsx)$/.test(entry)) files.push(path.normalize(fullPath));
  }
};

for (const root of roots) walk(root);

const violations = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (!supabaseClientImportPattern.test(text)) continue;
  violations.push(file);
}

if (violations.length > 0) {
  console.error("Supabase production boundary check failed.");
  console.error("Page/component files must not import the Supabase client directly. Use typed API adapters instead.");
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

console.log("Supabase production boundary check passed.");
console.log(`Scanned ${files.length} page/component files.`);
console.log("No page/component direct Supabase imports remain.");
