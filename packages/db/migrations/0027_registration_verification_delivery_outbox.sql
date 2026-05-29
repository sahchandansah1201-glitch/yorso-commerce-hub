-- Backend Phase 2B: self-hosted registration verification delivery outbox.
-- Delivery intent is owned by the YORSO backend. The outbox stores routing
-- metadata and masked destinations. Phase 2E adds sealed backend-only code
-- material for the self-hosted delivery worker; browser responses still do
-- not expose verification codes or raw contacts.

create table if not exists yorso_registration_delivery_outbox (
  id uuid primary key default gen_random_uuid(),
  draft_id text not null references yorso_registration_drafts(id) on delete cascade,
  purpose text not null check (purpose in ('email_verification', 'phone_verification')),
  channel text not null check (channel in ('email', 'sms', 'whatsapp')),
  status text not null default 'queued' check (status in ('queued', 'leased', 'sent', 'failed', 'cancelled')),
  destination_hash text not null check (destination_hash like 'sha256:%'),
  destination_preview text not null check (char_length(destination_preview) between 1 and 80),
  template_key text not null check (char_length(template_key) between 1 and 120),
  request_id uuid,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text check (locked_by is null or char_length(locked_by) <= 120),
  last_error text check (last_error is null or char_length(last_error) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint yorso_registration_delivery_attempts_within_limit check (attempt_count <= max_attempts)
);

create index if not exists idx_yorso_registration_delivery_outbox_ready
  on yorso_registration_delivery_outbox(available_at, created_at)
  where status = 'queued' and attempt_count < max_attempts;

create index if not exists idx_yorso_registration_delivery_outbox_draft_recent
  on yorso_registration_delivery_outbox(draft_id, purpose, created_at desc);

create index if not exists idx_yorso_registration_delivery_outbox_status_recent
  on yorso_registration_delivery_outbox(status, created_at desc);

comment on table yorso_registration_delivery_outbox is
  'Self-hosted registration verification delivery outbox. Stores delivery intent without raw email, phone or hosted BaaS coupling.';

comment on index idx_yorso_registration_delivery_outbox_ready is
  'Supports bounded worker leasing for pending registration verification delivery jobs.';
