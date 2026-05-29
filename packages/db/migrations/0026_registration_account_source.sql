-- Backend Phase 2A: self-hosted registration draft and account creation source.
-- Registration state is owned by the YORSO backend, not by browser storage or a hosted BaaS.

create table if not exists yorso_registration_drafts (
  id text primary key check (char_length(id) between 32 and 160),
  email citext not null,
  role text not null check (role in ('buyer', 'supplier')),
  email_code_secret text not null check (
    email_code_secret like 'plain:%'
    or email_code_secret like 'sha256:%:%'
  ),
  email_verified_at timestamptz,
  phone text check (phone is null or char_length(phone) between 5 and 40),
  phone_code_secret text check (
    phone_code_secret is null
    or phone_code_secret like 'plain:%'
    or phone_code_secret like 'sha256:%:%'
  ),
  phone_code_requests integer not null default 0 check (phone_code_requests >= 0 and phone_code_requests <= 20),
  phone_verified_at timestamptz,
  full_name text check (full_name is null or char_length(full_name) between 2 and 160),
  company_name text check (company_name is null or char_length(company_name) between 2 and 180),
  country text check (country is null or char_length(country) between 2 and 80),
  country_code char(2) check (country_code is null or country_code = upper(country_code)),
  vat_tin text check (vat_tin is null or char_length(vat_tin) between 3 and 80),
  password_secret text check (
    password_secret is null
    or password_secret like 'plain:%'
    or password_secret like 'sha256:%:%'
  ),
  categories text[] not null default '{}'::text[] check (array_length(categories, 1) is null or array_length(categories, 1) <= 30),
  certifications text[] not null default '{}'::text[] check (array_length(certifications, 1) is null or array_length(certifications, 1) <= 30),
  target_countries text[] not null default '{}'::text[] check (array_length(target_countries, 1) is null or array_length(target_countries, 1) <= 80),
  volume text not null default '' check (char_length(volume) <= 80),
  completed_user_id uuid references yorso_users(id) on delete set null,
  completed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint yorso_registration_drafts_expiry_order check (expires_at > created_at)
);

create index if not exists idx_yorso_registration_drafts_email_recent
  on yorso_registration_drafts(email, created_at desc);

create index if not exists idx_yorso_registration_drafts_active_expiry
  on yorso_registration_drafts(expires_at)
  where completed_at is null;

create index if not exists idx_yorso_registration_drafts_completed_user
  on yorso_registration_drafts(completed_user_id)
  where completed_user_id is not null;

comment on table yorso_registration_drafts is
  'Self-hosted registration draft state for account creation. Browser registration storage is not the production source of truth.';

