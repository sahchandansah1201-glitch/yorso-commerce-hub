# Self-Hosted Admin Access Review Smoke

Batch #96 adds a real operator workflow for reviewing buyer requests for
supplier identity and exact price access.

## Command

```bash
npm run smoke:self-hosted-admin-access-review
```

The command builds the self-hosted API, starts it in memory mode and validates
the protected admin review path without Supabase or hosted backend services.

## Covered Contract

- Missing session cannot read `/v1/admin/access-requests`.
- Buyer sessions cannot read the admin queue.
- Admin sessions can list paginated review requests.
- Review responses do not include buyer email or raw session id.
- Admin can mark a request pending without creating grants.
- Admin approval creates `supplier_identity` and `offer_price` grants.
- Admin approval creates a buyer `price_access_approved` notification.
- Invalid decision payloads fail closed.

## Expected Markers

```text
admin_access_review_auth_guard=ok
admin_access_review_role_guard=ok
admin_access_review_list=ok
admin_access_review_pending=ok
admin_access_review_approve=ok
admin_access_review_filters=ok
admin_access_review_decision_notification=ok
admin_access_review_validation_guard=ok
self_hosted_admin_access_review_smoke=ok
```

## Production Notes

The review console is a low-frequency operator path. It is still production
relevant because a decision changes buyer access. Keep the endpoint paginated,
admin-only, audited and backed by the indexes in
`packages/db/migrations/0017_supplier_access_review_queue.sql`.
