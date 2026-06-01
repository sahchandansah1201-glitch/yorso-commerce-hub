# Local UI verification

This checklist is for local review of the YORSO account workspace and other
browser-rendered pages. It complements unit tests: it verifies real layout,
scrolling, button targets and screenshots.

## Account workspace

Run the focused account UI audit:

```bash
npm run account:ui:audit
```

The command builds the app and runs:

```bash
E2E_USE_WEB_SERVER=1 playwright test e2e/account-workspace-ui-audit.spec.ts --project=chromium
```

It opens all account sections at desktop `1440x1000` and mobile `390x844`,
checks there is no horizontal overflow, no nested interactive controls, one
visible account navigation shell per viewport, one visible completion panel,
and visible field labels. It saves viewport screenshots to:

```text
test-results/account-workspace-ui-audit/
```

Use viewport screenshots for this layout. Full-page screenshots can repeat
sticky sidebars and sticky completion panels in the captured bitmap even when
the DOM has only one visible instance.

## Manual local review

For manual inspection:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173/account/personal
http://127.0.0.1:5173/account/company
http://127.0.0.1:5173/account/branches
http://127.0.0.1:5173/account/products
http://127.0.0.1:5173/account/meta-regions
http://127.0.0.1:5173/account/notifications
```

Sign-in is simulated in e2e through `yorso_buyer_session`. For manual browser
review, use the sign-in flow or set a local buyer session in DevTools.

## Account UI pattern

- Page shell: warm light background, white cards, navy text, orange primary
  actions, Inter body text and Plus Jakarta Sans headings.
- Read-only data: `<dl>` grids with muted uppercase labels and stronger values.
  This lets users scan labels first and then read only the values that matter.
- Edit mode: label above field, hint/error close to the control, one clear
  save/cancel action cluster in the card header or at the end of inline forms.
- Lists: prefer cards for operational profile data that must fit mobile without
  horizontal scrolling. Tables are reserved for dense comparison workflows where
  column scanning is the main task.
- Buttons: visible text labels, actions close to the object they affect, one
  primary action per section header.

## Research basis

- [Nielsen Norman Group](https://www.nngroup.com/articles/how-users-read-on-the-web/):
  users scan web pages and rely on headings, labels and visible structure
  before reading detail.
- [GOV.UK Design System text input guidance](https://design-system.service.gov.uk/components/text-input/):
  form labels stay visible above controls; hint text belongs close to the field
  it explains.
- [Playwright screenshots](https://playwright.dev/docs/screenshots): local
  viewport captures are useful regression artifacts when paired with explicit
  layout assertions.

## Wider service checks

Run the broad public/app smoke suite when changes touch shared shell behavior:

```bash
npm run smoke:e2e
```

Run account persistence/report packs when changes touch save flows:

```bash
npm run test:account-workspace
npm run smoke:e2e:account-reports
```
