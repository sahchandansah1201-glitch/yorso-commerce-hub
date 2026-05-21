import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

type E2EPolicyModule = {
  analyzeE2EScriptPolicy: (pkg: { scripts?: Record<string, string> }) => {
    apiBackedScripts: Array<{ name: string; specs: string[] }>;
    failures: string[];
    genericSpecs: string[];
    passed: boolean;
  };
  extractPlaywrightSpecs: (script: string) => string[];
};

const root = process.cwd();
const policyModulePromise = import(
  pathToFileURL(`${root}/scripts/lib/e2e-script-policy.mjs`).href
) as Promise<E2EPolicyModule>;

const readPackage = () => JSON.parse(readFileSync("package.json", "utf8"));

describe("engineering lessons guard", () => {
  it("keeps API-backed e2e specs out of the generic browser smoke", async () => {
    const { analyzeE2EScriptPolicy } = await policyModulePromise;
    const result = analyzeE2EScriptPolicy(readPackage());

    expect(result.passed).toBe(true);
    expect(result.apiBackedScripts.map((script) => script.name)).toContain(
      "smoke:e2e:admin-access-grants",
    );
    expect(result.genericSpecs).not.toContain("e2e/admin-access-grants.spec.ts");
  });

  it("fails a synthetic package when an API-backed spec is also in smoke:e2e:run", async () => {
    const { analyzeE2EScriptPolicy } = await policyModulePromise;
    const result = analyzeE2EScriptPolicy({
      scripts: {
        "smoke:e2e:admin-access-grants":
          "VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api npm run build && npm run smoke:e2e:admin-access-grants:run",
        "smoke:e2e:admin-access-grants:run":
          "E2E_USE_WEB_SERVER=1 playwright test e2e/admin-access-grants.spec.ts --project=chromium",
        "smoke:e2e:run":
          "E2E_USE_WEB_SERVER=1 playwright test e2e/smoke-core.spec.ts e2e/admin-access-grants.spec.ts --project=chromium",
      },
    });

    expect(result.passed).toBe(false);
    expect(result.failures.join("\n")).toContain("must not be included in smoke:e2e:run");
  });

  it("fails a synthetic package when build-based e2e commands run in parallel", async () => {
    const { analyzeE2EScriptPolicy } = await policyModulePromise;
    const result = analyzeE2EScriptPolicy({
      scripts: {
        "smoke:e2e:run": "E2E_USE_WEB_SERVER=1 playwright test e2e/smoke-core.spec.ts",
        "smoke:e2e:parallel-risk":
          "npm run smoke:e2e:admin-access-grants & npm run smoke:e2e",
      },
    });

    expect(result.passed).toBe(false);
    expect(result.failures.join("\n")).toContain("shared dist/");
  });

  it("documents stable smoke assertions for memory repositories", () => {
    const smoke = readFileSync("scripts/smoke-self-hosted-admin-access-grants.mjs", "utf8");
    expect(smoke).toContain("admin grants supplier id");
    expect(smoke).not.toContain("admin grants supplier name");
  });
});
