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

## Covered contract

- company identity edit persists after reload
- invalid identity fields keep the card in edit mode and show validation errors
- cancel discards unsaved identity changes
- commercial contacts edit persists email, phone and WhatsApp
- invalid contacts keep the card in edit mode and show validation errors
- description updates the supplier profile preview and survives reload
- trust, certificates and payment terms split list values for the preview
- publication and buyer qualification statuses persist as user-facing labels

## CI ownership

GitHub Actions runs this focused check as `Run account company save-flow smoke`
before the broader browser smoke suite. The broader suite still includes the
same spec, but the dedicated step makes failures easier to identify and lets
Lovable confirm the save-flow contract without modifying files.
