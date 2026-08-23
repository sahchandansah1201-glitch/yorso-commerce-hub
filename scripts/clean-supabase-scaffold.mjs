#!/usr/bin/env node
/**
 * Remove auto-regenerated hosted-provider scaffold.
 * The frontend is provider-free: src/integrations/supabase and supabase/
 * must never be part of the build or typecheck graph.
 */
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const targets = ["src/integrations/supabase", "supabase"];
let removed = 0;

for (const target of targets) {
  const path = resolve(process.cwd(), target);
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    removed += 1;
    console.log(`[clean-supabase-scaffold] removed ${target}`);
  }
}

if (removed === 0) {
  console.log("[clean-supabase-scaffold] nothing to remove");
}
