-- Batch #49: acknowledge self-hosted access notifications.
-- Keeps buyer notification read-state in PostgreSQL instead of browser-only
-- localStorage flags.

alter type yorso_access_event_type add value if not exists 'notification_read';

comment on type yorso_access_event_type is
  'Access audit event types including request lifecycle, notification creation and notification read acknowledgements.';

comment on column yorso_access_notifications.status is
  'Buyer notification state. Frontend acknowledges read access notifications through PATCH /v1/access/notifications.';

comment on column yorso_access_notifications.read_at is
  'Timestamp when the buyer acknowledged the notification through the self-hosted API.';

comment on index idx_yorso_access_notifications_buyer_status_created is
  'Buyer notification feed and unread lookup path after supplier approval.';
