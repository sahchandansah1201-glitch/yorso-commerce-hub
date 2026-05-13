import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runNode = (args: string[]) => execFileSync("node", args, { encoding: "utf8" });

describe("self-hosted API policy", () => {
  it("passes the API skeleton guard", () => {
    const output = runNode(["scripts/check-self-hosted-api.mjs"]);

    expect(output).toContain("Self-hosted API skeleton check passed");
    expect(output).toContain("apps/api exposes health and account-contract endpoints");
  });

  it("keeps the API service wired into compose as a deployable backend process", () => {
    const compose = readFileSync("infra/docker-compose.yml", "utf8");
    const dockerfile = readFileSync("apps/api/Dockerfile", "utf8");

    expect(compose).toContain("api:");
    expect(compose).toContain("pgbouncer:");
    expect(compose).toContain("redis:");
    expect(compose).toContain("minio:");
    expect(compose).toContain("VITE_SUPABASE_URL: \"\"");
    expect(dockerfile).toContain("RUN npm run api:build");
    expect(dockerfile).toContain("CMD [\"node\", \"apps/api/dist/index.js\"]");
  });
});
