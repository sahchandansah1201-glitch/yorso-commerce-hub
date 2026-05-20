# Self-hosted admin access grants smoke

Batch #97 adds the admin access grants console and revoke runtime.

Command:

```bash
npm run smoke:self-hosted-admin-access-grants
```

The smoke starts the compiled self-hosted API with the memory repository, signs in a buyer and an admin, approves a supplier access request, lists active grants, revokes the grant group, and verifies the offer catalog masks exact price and supplier identity again.

Expected markers:

- `admin_access_grants_auth_guard=ok`
- `admin_access_grants_role_guard=ok`
- `admin_access_grants_list=ok`
- `admin_access_grants_revoke=ok`
- `admin_access_grants_revoke_masks_catalog=ok`
- `admin_access_grants_filters=ok`
- `admin_access_grants_validation_guard=ok`
- `self_hosted_admin_access_grants_smoke=ok`

Production meaning:

- Read path: `/v1/admin/access-grants` is admin-only, paginated, and bounded to 100 rows by contract.
- Write path: `/v1/admin/access-grants/:grantId/revoke` expires active `supplier_identity` and `offer_price` grants for the same buyer and supplier.
- Failure mode: missing session, non-admin session, invalid grant id, and revoked access all fail closed.
- Scale guard: migration `0018_admin_access_grants_console.sql` adds active, expired, buyer, supplier and revoke-event indexes for the 10,000 concurrent-user baseline.
