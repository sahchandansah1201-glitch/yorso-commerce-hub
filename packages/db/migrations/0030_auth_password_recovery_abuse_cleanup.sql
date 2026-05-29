-- Backend Phase 2H: password recovery abuse-control and cleanup policy.
-- Adds an explicit security-event type for password-reset throttling and
-- bounded indexes for cleanup of expired tokens and terminal delivery rows.

alter type yorso_auth_security_event_type add value if not exists 'password_reset_rate_limited';

create index if not exists idx_yorso_auth_password_recovery_cleanup_expired
  on yorso_auth_password_recovery_tokens(expires_at, created_at, id)
  where used_at is null;

create index if not exists idx_yorso_auth_password_recovery_cleanup_used
  on yorso_auth_password_recovery_tokens(used_at, created_at, id)
  where used_at is not null;

create index if not exists idx_yorso_auth_password_recovery_outbox_terminal_cleanup
  on yorso_auth_password_recovery_outbox(updated_at, created_at, id)
  where status in ('sent', 'failed', 'cancelled');

comment on index idx_yorso_auth_password_recovery_cleanup_expired is
  'Supports bounded cleanup of expired unused password recovery tokens without table scans at the 10,000 concurrent-user baseline.';

comment on index idx_yorso_auth_password_recovery_cleanup_used is
  'Supports bounded cleanup of already-used password recovery tokens after the configured retention window.';

comment on index idx_yorso_auth_password_recovery_outbox_terminal_cleanup is
  'Supports bounded cleanup of sent, failed and cancelled password recovery delivery rows.';
