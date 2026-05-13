# Account products save-flow report

This report smoke verifies the `/account/products` product matrix as a
diagnostic flow, not just as a pass/fail check.

The test installs a deterministic buyer session in `sessionStorage` before the
page loads. It does not call Supabase auth and does not require a real browser
login. This matches the current frontend-first account workspace.

## Command

```bash
npm run smoke:e2e:account-products:report
```

For CI jobs that already built the Vite bundle, use:

```bash
npm run smoke:e2e:account-products:report:run
```

To verify that the generated report artifact is complete, use:

```bash
npm run smoke:e2e:account-products:report:verify
```

## Covered contract

- product matrix opens for a deterministic signed-in buyer
- required fields block incomplete product drafts
- new product save persists into account profile storage
- duplicate product matching records are rejected
- pagination advances through the visible matrix
- search, filters, sort and row count generate a shareable product URL
- product detail panel can start an edit flow
- edited products survive reload
- deleted products stay removed after reload
- Russian UI stays localized and hides raw enum/sort keys

## Report artifacts

The report command writes artifacts to:

- `test-results/account-products-save-flow/report.md`
- `test-results/account-products-save-flow/report.json`
- `test-results/account-products-save-flow/playwright-report.json`
- `test-results/account-products-save-flow/*.png`

The screenshots intentionally cover both happy paths and blocked states:
validation errors, duplicate guard, pagination, share link, detail-edit save,
delete/reload persistence and RU localization. This gives Lovable and Codex a
compact debugging pack when a product matrix regression appears.

## CI ownership

GitHub Actions runs `Run account products save-flow report` after the company
report and uploads `account-products-save-flow-report` immediately after that
step. The upload happens before the broader smoke suite because each Playwright
run can clean `test-results/`.

Before uploading, CI runs `Verify account products save-flow report` to fail the
job if `report.md`, `report.json`, Playwright JSON or any expected screenshot is
missing.
