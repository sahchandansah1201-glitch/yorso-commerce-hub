# Admin incident workload E2E

Batch: #106.

Script:

```bash
npm run smoke:e2e:admin-incident-workload
```

Spec:

```text
e2e/admin-incident-workload.spec.ts
```

The browser test runs with the self-hosted API adapter enabled through
`VITE_YORSO_API_URL=http://127.0.0.1:4173/__e2e-api`.

Covered behavior:

- `/admin/incident-workload` renders the workload page.
- Session headers `x-yorso-user-id` and `x-yorso-session-id` are sent.
- Filter controls update the workload API query.
- JSON and CSV exports use the export endpoint.
- Capacity forecast renders projected open and overdue pressure.
- Correlation drill-down renders audit/execution signals.
- Raw email and session identifiers are not visible in the DOM.

Primary forecast selectors:

- `admin-incident-workload-forecast-load`;
- `admin-incident-workload-forecast-summary`;
- `admin-incident-workload-forecast-owners`.
