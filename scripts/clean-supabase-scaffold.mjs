#!/usr/bin/env node
// P1N: Removes stale Supabase scaffold the environment occasionally
// auto-regenerates. This project is provider-free / self-hosted —
// the SDK and integration folders must never ship.
//
// Do NOT fix TS2307 "Cannot find module '@supabase/supabase-js'" by
// installing the SDK. Run this script (or `npm run clean:supabase-scaffold`)
// and the import error disappears with the stale scaffold.
import { existsSync, rmSync } from "node:fs";

const targets = ["src/integrations/supabase", "supabase"];
let removed = 0;

for (const target of targets) {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(`[clean-supabase-scaffold] removed stale path: ${target}`);
    removed += 1;
  }
}

if (removed === 0) {
  console.log("[clean-supabase-scaffold] no stale Supabase scaffold found.");
} else {
  console.log(
    `[clean-supabase-scaffold] removed ${removed} stale path(s). ` +
      "Project is provider-free; do not install @supabase/supabase-js to fix TS2307.",
  );
}
