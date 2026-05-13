import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const root = process.cwd();
const tempRoots: string[] = [];
const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const pngSha256 = createHash("sha256").update(pngBytes).digest("hex");

const reports = {
  "account-company-save-flow": {
    title: "Account company save-flow report",
    steps: [
      ["signed-in company profile opened", "01-company-profile-loaded.png"],
      ["invalid contacts blocked", "02-contacts-validation-error.png"],
      ["valid contacts saved", "03-contacts-saved.png"],
      ["saved contacts survived reload", "04-contacts-after-reload.png"],
    ],
  },
  "account-products-save-flow": {
    title: "Account products matrix save-flow report",
    steps: [
      ["signed-in product matrix opened", "01-products-matrix-loaded.png"],
      ["incomplete product blocked", "02-product-validation-error.png"],
      ["new selling product saved", "03-product-added.png"],
      ["duplicate product blocked", "04-product-duplicate-blocked.png"],
      ["pagination advances through matrix", "05-product-pagination-page-two.png"],
      ["filtered view shared", "06-product-filter-share-link.png"],
      ["detail panel starts edit flow", "07-product-detail-edit-saved.png"],
      ["delete and reload persistence verified", "08-product-delete-after-reload.png"],
      ["Russian product matrix remains localized", "09-product-ru-localized.png"],
    ],
  },
};

const makeTempRoot = () => {
  const dir = mkdtempSync(join(tmpdir(), "yorso-report-artifacts-"));
  tempRoots.push(dir);
  return dir;
};

const createReport = (
  reportName: keyof typeof reports,
  options: { invalidPng?: boolean; omitSchema?: boolean; wrongChecksum?: boolean } = {},
) => {
  const dir = makeTempRoot();
  const report = reports[reportName];
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "report.md"), `# ${report.title}\n\nResult: passed\n`);
  const screenshotBuffer = options.invalidPng ? Buffer.from("not-png") : pngBytes;
  const screenshotSha256 = options.wrongChecksum ? "0".repeat(64) : pngSha256;
  writeFileSync(
    join(dir, "report.json"),
    JSON.stringify(
      {
        ...(options.omitSchema
          ? {}
          : {
              schemaVersion: 1,
              title: report.title,
              artifactSubdir: reportName,
            }),
        generatedAt: "2026-05-13T00:00:00.000Z",
        passed: report.steps.length,
        failed: 0,
        steps: report.steps.map(([name, screenshot]) => ({
          name,
          screenshot,
          screenshotBytes: screenshotBuffer.byteLength,
          screenshotSha256,
          status: "passed",
          detail: `Verified report step "${name}" with enough detail for diagnostics.`,
        })),
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(dir, "playwright-report.json"),
    JSON.stringify({ suites: [{ title: report.title, specs: [] }] }, null, 2),
  );
  for (const [, screenshot] of report.steps) {
    writeFileSync(join(dir, screenshot), screenshotBuffer);
  }
  return dir;
};

const runNode = (args: string[]) =>
  execFileSync("node", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

afterEach(() => {
  for (const dir of tempRoots.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

describe("account report artifact tooling", () => {
  it("checks a valid report and can return structured diagnostics", () => {
    const companyRoot = createReport("account-company-save-flow");
    const output = runNode([
      "scripts/check-report-artifacts.mjs",
      "account-company-save-flow",
      companyRoot,
      "--json",
    ]);

    const jsonStart = output.indexOf("{");
    const diagnostics = JSON.parse(output.slice(jsonStart, output.lastIndexOf("}") + 1));
    expect(output).toContain("Report artifact check passed for account-company-save-flow");
    expect(diagnostics.passed).toBe(true);
    expect(diagnostics.fileChecks).toHaveLength(7);
    expect(diagnostics.steps).toHaveLength(4);
    expect(diagnostics.reportJson.schemaVersion).toBe(1);
    expect(diagnostics.checksumChecks).toHaveLength(4);
    expect(diagnostics.checksumChecks.every((check: { passed: boolean }) => check.passed)).toBe(
      true,
    );
  });

  it("fails when a screenshot is present but not a PNG", () => {
    const companyRoot = createReport("account-company-save-flow", { invalidPng: true });

    expect(() =>
      runNode(["scripts/check-report-artifacts.mjs", "account-company-save-flow", companyRoot]),
    ).toThrow(/invalid PNG signature/);
  });

  it("fails when the report schema marker is missing", () => {
    const companyRoot = createReport("account-company-save-flow", { omitSchema: true });

    expect(() =>
      runNode(["scripts/check-report-artifacts.mjs", "account-company-save-flow", companyRoot]),
    ).toThrow(/schemaVersion is missing/);
  });

  it("fails when report.json screenshot checksums do not match PNG files", () => {
    const companyRoot = createReport("account-company-save-flow", { wrongChecksum: true });

    expect(() =>
      runNode(["scripts/check-report-artifacts.mjs", "account-company-save-flow", companyRoot]),
    ).toThrow(/screenshotSha256 does not match/);
  });

  it("verifies the full account report suite and writes a Markdown summary", () => {
    const companyRoot = createReport("account-company-save-flow");
    const productsRoot = createReport("account-products-save-flow");
    const summaryPath = resolve(makeTempRoot(), "suite-summary.md");
    const output = runNode([
      "scripts/verify-account-report-suite.mjs",
      "--company-root",
      companyRoot,
      "--products-root",
      productsRoot,
      "--summary-output",
      summaryPath,
    ]);

    expect(output).toContain("passed account-company-save-flow");
    expect(output).toContain("passed account-products-save-flow");
    const summary = runNode([
      "-e",
      `console.log(require('fs').readFileSync(${JSON.stringify(summaryPath)}, 'utf8'))`,
    ]);
    expect(summary).toContain(
      "Account report suite verification",
    );
    expect(summary).toContain("Checksums");
    expect(summary).toContain("4/4");
    expect(summary).toContain("9/9");
  });

  it("copies a report pack before a later Playwright run can clear test-results", () => {
    const companyRoot = createReport("account-company-save-flow");
    const copiedRoot = resolve(makeTempRoot(), "copied-company-report");

    const output = runNode([
      "scripts/copy-account-report-pack.mjs",
      "account-company-save-flow",
      copiedRoot,
      companyRoot,
    ]);

    expect(output).toContain("Copied account-company-save-flow report pack");
    expect(
      runNode(["scripts/check-report-artifacts.mjs", "account-company-save-flow", copiedRoot]),
    ).toContain("Report artifact check passed for account-company-save-flow");
    expect(companyRoot).toContain("yorso-report-artifacts-");
  });

  it("keeps CI wired to Node 24 actions, report suite verification and full CI", () => {
    const workflow = runNode(["-e", "console.log(require('fs').readFileSync('.github/workflows/ci.yml', 'utf8'))"]);
    const playwrightConfig = runNode([
      "-e",
      "console.log(require('fs').readFileSync('playwright.config.ts', 'utf8'))",
    ]);
    const pkg = JSON.parse(runNode(["-e", "console.log(require('fs').readFileSync('package.json', 'utf8'))"]));

    expect(workflow).toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true");
    expect(workflow).toContain("Verify downloaded account report suite");
    expect(workflow).toContain("Upload account report summary");
    expect(playwrightConfig).toContain("E2E_WORKERS");
    expect(playwrightConfig).toContain('useWebServer ? "4" : "6"');
    expect(pkg.scripts["account:reports:run"]).toContain("copy-account-report-pack.mjs");
    expect(pkg.scripts["account:reports:verify-suite"]).toBe(
      "node scripts/verify-account-report-suite.mjs --company-root account-report-packs/account-company-save-flow --products-root account-report-packs/account-products-save-flow",
    );
    expect(pkg.scripts["ci:full"]).toContain("npm run smoke:e2e:account-reports");
  });
});
