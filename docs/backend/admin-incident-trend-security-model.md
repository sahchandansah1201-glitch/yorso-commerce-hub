# Admin Incident Trend Security Model

Batch #107 expands the admin incident console. The risk is not public traffic;
the risk is accidental exposure of operational details in admin analytics,
exports or browser DOM.

## Protected Data

Trend analytics must not expose:

- raw email addresses;
- raw user ids;
- raw session ids;
- passwords;
- API keys;
- database URLs;
- Redis URLs;
- S3 or MinIO credentials;
- raw free-form notes containing secrets.

The trend contracts are aggregate-first to reduce this risk.

## Allowed Data

The following data is allowed:

- incident source;
- incident status;
- incident severity;
- route path;
- aggregate counts;
- load score;
- SLA posture;
- sanitized evidence labels;
- recommended operator action.

Route paths are operational data. They are allowed only inside admin-only
surfaces and exports.

## Access Boundary

The route must enforce:

- self-hosted session validation;
- admin role;
- no anonymous access;
- no buyer-only or supplier-only access.

The frontend must send the same self-hosted session headers as other admin
incident pages.

## Export Boundary

JSON and CSV exports use the same aggregate data. Export must not call a broader
repository path than the page read. CSV is a handoff artifact, not an internal
raw-table dump.

## Browser Boundary

The e2e smoke includes negative checks for:

- `admin@yorso.test`;
- raw session id;
- `postgres://`;
- `redis://`;
- secret-like strings.

These checks protect against regression in UI fixtures and actual API-backed
flows.

## Production Policy

This feature stays in the self-hosted product. It does not introduce Supabase,
Firebase, Appwrite, Clerk, Auth0 or any hosted BaaS as a production dependency.

Marker: Batch #107.
Marker: no Supabase.
Marker: admin-incident-trends-page.
