const PLAYWRIGHT_SPEC_RE = /(?:^|\s)(e2e\/[^\s"']+\.spec\.ts)(?=\s|$)/g;
const PARALLEL_TOKENS = [
  /\s&\s/,
  /\bconcurrently\b/,
  /\bnpm-run-all\b[^\n"]*--parallel\b/,
  /\brun-p\b/,
];

export const API_BACKED_E2E_ENV = "VITE_YORSO_API_URL=";
export const GENERIC_BROWSER_SMOKE_SCRIPT = "smoke:e2e:run";

export function extractPlaywrightSpecs(scriptValue = "") {
  const specs = [];
  for (const match of scriptValue.matchAll(PLAYWRIGHT_SPEC_RE)) {
    specs.push(match[1]);
  }
  return [...new Set(specs)];
}

export function extractNpmRunTargets(scriptValue = "") {
  const targets = [];
  for (const match of scriptValue.matchAll(/\bnpm\s+run\s+([A-Za-z0-9:_-]+)/g)) {
    targets.push(match[1]);
  }
  return targets;
}

export function hasParallelBuildRisk(scriptValue = "") {
  return PARALLEL_TOKENS.some((pattern) => pattern.test(scriptValue));
}

export function findApiBackedE2EScripts(pkg) {
  const scripts = pkg.scripts ?? {};
  const result = [];

  for (const [name, value] of Object.entries(scripts)) {
    if (!name.startsWith("smoke:e2e:")) continue;
    if (name.endsWith(":run")) continue;
    if (!value.includes(API_BACKED_E2E_ENV)) continue;

    const runTargets = extractNpmRunTargets(value);
    const runSpecs = runTargets.flatMap((target) => extractPlaywrightSpecs(scripts[target] ?? ""));
    result.push({
      name,
      value,
      runTargets,
      specs: [...new Set(runSpecs)],
    });
  }

  return result;
}

export function analyzeE2EScriptPolicy(pkg) {
  const scripts = pkg.scripts ?? {};
  const failures = [];
  const apiBackedScripts = findApiBackedE2EScripts(pkg);
  const genericSmoke = scripts[GENERIC_BROWSER_SMOKE_SCRIPT] ?? "";
  const genericSpecs = extractPlaywrightSpecs(genericSmoke);
  const genericSpecSet = new Set(genericSpecs);

  if (!genericSmoke) {
    failures.push(`package.json: ${GENERIC_BROWSER_SMOKE_SCRIPT} is missing`);
  }

  for (const apiScript of apiBackedScripts) {
    if (!apiScript.value.includes(`${API_BACKED_E2E_ENV}http://127.0.0.1:4173/__e2e-api`)) {
      failures.push(`package.json: ${apiScript.name} must build with ${API_BACKED_E2E_ENV}http://127.0.0.1:4173/__e2e-api`);
    }
    if (!apiScript.value.includes("npm run build")) {
      failures.push(`package.json: ${apiScript.name} must rebuild before running API-backed e2e`);
    }
    if (apiScript.specs.length === 0) {
      failures.push(`package.json: ${apiScript.name} must reference a :run script with at least one Playwright spec`);
    }
    for (const spec of apiScript.specs) {
      if (genericSpecSet.has(spec)) {
        failures.push(`package.json: API-backed spec ${spec} from ${apiScript.name} must not be included in ${GENERIC_BROWSER_SMOKE_SCRIPT}`);
      }
    }
  }

  for (const [name, value] of Object.entries(scripts)) {
    if (!name.startsWith("smoke:e2e")) continue;
    if (hasParallelBuildRisk(value)) {
      failures.push(`package.json: ${name} must not run build-based e2e commands in parallel against shared dist/`);
    }
  }

  return {
    apiBackedScripts,
    failures,
    genericSpecs,
    passed: failures.length === 0,
  };
}

export function formatE2EScriptPolicyReport(result) {
  const lines = [
    `apiBackedScripts=${result.apiBackedScripts.length}`,
    `genericSpecs=${result.genericSpecs.length}`,
    `passed=${result.passed}`,
  ];
  for (const apiScript of result.apiBackedScripts) {
    lines.push(`- ${apiScript.name}: ${apiScript.specs.join(", ") || "no specs"}`);
  }
  for (const failure of result.failures) {
    lines.push(`FAIL ${failure}`);
  }
  return lines.join("\n");
}
