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

## Artifact locations

- `test-results/account-company-save-flow/`
- `test-results/account-products-save-flow/`

Each directory must contain:

- `report.md`
- `report.json`
- `playwright-report.json`
- all expected PNG screenshots referenced by `report.json`

## CI artifacts

GitHub Actions uploads:

- `account-company-save-flow-report`
- `account-products-save-flow-report`

The verify scripts run before upload. If a report is incomplete, CI fails before
the artifact can be treated as valid.

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
