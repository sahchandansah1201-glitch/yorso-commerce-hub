# Account company save-flow smoke

This smoke check verifies that `/account/company` can be tested without manual
authentication.

The test installs a deterministic buyer session in `sessionStorage` before the
page loads. It does not call Supabase auth and does not require a real browser
login. This is intentional because the current account workspace is still a
frontend-first prototype.

## Command

```bash
npm run smoke:e2e:account-company
```

For CI jobs that already built the Vite bundle, use:

```bash
npm run smoke:e2e:account-company:run
```

To generate a focused debugging pack with screenshots and machine-readable
output, use:

```bash
npm run smoke:e2e:account-company:report
```

For CI jobs that already built the Vite bundle, use:

```bash
npm run smoke:e2e:account-company:report:run
```

## Covered contract

- company identity edit persists after reload
- invalid identity fields keep the card in edit mode and show validation errors
- cancel discards unsaved identity changes
- commercial contacts edit persists email, phone and WhatsApp
- invalid contacts keep the card in edit mode and show validation errors
- description updates the supplier profile preview and survives reload
- trust, certificates and payment terms split list values for the preview
- publication and buyer qualification statuses persist as user-facing labels

## Report artifacts

The report command writes artifacts to:

- `test-results/account-company-save-flow/report.md`
- `test-results/account-company-save-flow/report.json`
- `test-results/account-company-save-flow/playwright-report.json`
- `test-results/account-company-save-flow/*.png`

The report covers the critical contacts branch of the company save-flow:
initial load, invalid field blocking, successful save and persistence after
reload. It is intentionally separate from the broader contract spec so CI can
attach a compact visual/debug pack without making the primary smoke command
harder to read.

## CI ownership

GitHub Actions runs this focused check as `Run account company save-flow smoke`
before the broader browser smoke suite. The broader suite still includes the
same spec, but the dedicated step makes failures easier to identify and lets
Lovable confirm the save-flow contract without modifying files.

GitHub Actions also runs `Run account company save-flow report` and uploads
`account-company-save-flow-report` with the generated screenshots, Markdown
report, JSON report and Playwright JSON output.
