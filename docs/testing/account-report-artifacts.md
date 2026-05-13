# Account report artifacts

Account report smoke tests create compact debugging packs for critical account
workspace flows. Each pack includes screenshots, Markdown, structured JSON and
Playwright JSON.

## Local commands

Run and verify the company report:

```bash
npm run smoke:e2e:account-company:report
npm run smoke:e2e:account-company:report:verify
```

Run and verify the products report:

```bash
npm run smoke:e2e:account-products:report
npm run smoke:e2e:account-products:report:verify
```

Run both account report packs and verify them as a suite:

```bash
npm run smoke:e2e:account-reports
```

Playwright clears `test-results/` at the start of each independent run. The
suite command copies each generated report into the ignored `account-report-packs/`
directory before starting the next report run, so both reports remain available
for one suite verification and summary.

Run the largest local gate before pushing a larger QA/CI change:

```bash
npm run ci:full
```

The Playwright config defaults web-server E2E runs to 4 workers to reduce
preview-server navigation flakes during broad smoke runs. Override only when
needed:

```bash
E2E_WORKERS=2 npm run smoke:e2e
E2E_WORKERS=6 npm run smoke:e2e
```

## Artifact locations

- `test-results/account-company-save-flow/`
- `test-results/account-products-save-flow/`
- `account-report-packs/account-company-save-flow/`
- `account-report-packs/account-products-save-flow/`

Each directory must contain:

- `report.md`
- `report.json`
- `playwright-report.json`
- all expected PNG screenshots referenced by `report.json`

`report.json` is a versioned contract. It must include:

- `schemaVersion: 1`
- `title`
- `artifactSubdir`
- `generatedAt` as an ISO timestamp
- `passed` / `failed`
- ordered `steps`
- for every screenshot step: `screenshot`, `screenshotBytes`, `screenshotSha256`

## CI artifacts

GitHub Actions uploads:

- `account-company-save-flow-report`
- `account-products-save-flow-report`

The verify scripts run before upload. If a report is incomplete, CI fails before
the artifact can be treated as valid.

After upload, CI downloads both artifacts back into the runner and verifies the
downloaded directories with the same script. This guards the full artifact
lifecycle:

1. Playwright creates report files.
2. Verify checks local runner files.
3. GitHub uploads artifact.
4. CI downloads the uploaded artifact.
5. Verify checks downloaded files.
6. CI writes a job summary and comments the report summary on the PR.

## Verify criteria

`scripts/check-report-artifacts.mjs` fails when any of these checks fail:

- `report.md` exists, is non-empty, has the expected title and `Result: passed`
- `report.json` has schema version `1`, expected title, expected artifact subdir and valid timestamp
- `report.json` exists, is valid JSON and has the expected passed/failed counts
- `report.json.steps` has the expected step names in order
- every step is `passed`
- every step has a meaningful `detail`
- every expected screenshot is referenced by `report.json`
- every expected screenshot exists, is non-empty and has a PNG file signature
- every screenshot has matching byte size and SHA-256 checksum in `report.json`
- `playwright-report.json` exists, is valid JSON and has at least one suite
- Playwright JSON does not contain `failed` or `timedOut` statuses

Use verbose or JSON diagnostics when a report fails:

```bash
node scripts/check-report-artifacts.mjs account-company-save-flow --verbose
node scripts/check-report-artifacts.mjs account-products-save-flow --json
```

Verify both report directories in one command:

```bash
npm run account:reports:verify-suite -- \
  --company-root test-results/account-company-save-flow \
  --products-root test-results/account-products-save-flow \
  --summary-output test-results/account-report-summary/verification.md
```

To create a Markdown summary from local or downloaded report directories:

```bash
npm run account:reports:summary -- \
  --company-root test-results/account-company-save-flow \
  --products-root test-results/account-products-save-flow
```

## Download from GitHub Actions

To download artifacts from the latest successful CI run:

```bash
gh run list --workflow CI --branch main --status success --limit 1
gh run download <run-id> -n account-company-save-flow-report -D /tmp/yorso-company-report
gh run download <run-id> -n account-products-save-flow-report -D /tmp/yorso-products-report
```

To verify a downloaded artifact directory:

```bash
node scripts/check-report-artifacts.mjs account-company-save-flow /tmp/yorso-company-report
node scripts/check-report-artifacts.mjs account-products-save-flow /tmp/yorso-products-report
```

On pull requests from the same repository, CI also updates a PR comment marked
with `<!-- yorso-account-report-artifacts -->`. The comment summarizes both
account report artifacts, step counts, screenshot counts and the GitHub Actions
run URL.

The workflow sets `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` so the repository
tests the upcoming GitHub Actions runtime before GitHub makes Node 24 the
default for JavaScript actions. GitHub may still display a Node 20 advisory
annotation while confirming that the listed actions are forced onto Node 24.
