/**
 * KPI mapping acceptance test.
 * Maps to .lovable/analytics-acceptance.md section 3.
 *
 * Scans src/ for live track(...) call sites and asserts that every Phase 0
 * KPI has at least one event firing somewhere in the code.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(__dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const sources = walk(SRC).map((f) => readFileSync(f, "utf8")).join("\n");

const KPI: Record<string, string[]> = {
  REG: [
    "registration_role_selected",
    "registration_email_submitted",
    "registration_email_verified",
    "registration_complete",
  ],
  TRAFFIC: [
    "hero_primary_cta_click",
    "live_offer_card_click",
    "offers_list_view",
  ],
  RET: ["signin_email", "signin_phone", "registration_onboarding_completed"],
  TRUST: ["offer_detail_view", "register_cta_offer_detail", "phone_verified"],
};

describe("KPI coverage", () => {
  for (const [kpi, events] of Object.entries(KPI)) {
    it(`${kpi} has at least one live event`, () => {
      const hits = events.filter((e) => sources.includes(`"${e}"`));
      expect(hits.length, `expected one of ${events.join(", ")} to be tracked`).toBeGreaterThan(0);
    });
  }
});
