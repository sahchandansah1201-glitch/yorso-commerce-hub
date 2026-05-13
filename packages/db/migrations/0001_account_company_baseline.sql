-- YORSO self-hosted PostgreSQL baseline.
-- Source of truth for account and company profiles owned by YORSO.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type yorso_account_role as enum ('buyer', 'supplier', 'both');
create type yorso_company_publication_status as enum ('draft', 'review', 'published', 'blocked');
create type yorso_buyer_qualification_status as enum ('not_started', 'pending', 'qualified', 'rejected');
create type yorso_logo_fit as enum ('contain', 'cover');

create table if not exists yorso_users (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  email citext not null unique,
  phone text check (phone is null or char_length(phone) between 5 and 40),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'ru', 'es')),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists yorso_companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references yorso_users(id) on delete restrict,
  legal_name text not null check (char_length(legal_name) between 2 and 180),
  trade_name text not null check (char_length(trade_name) between 2 and 120),
  account_role yorso_account_role not null default 'buyer',
  country_code char(2) not null,
  website text,
  year_founded integer check (year_founded is null or year_founded between 1800 and 2100),
  contact_email citext,
  contact_phone text check (contact_phone is null or char_length(contact_phone) between 5 and 40),
  messenger_handle text check (messenger_handle is null or char_length(messenger_handle) <= 80),
  description text check (description is null or char_length(description) <= 1200),
  product_focus text[] not null default '{}'::text[] check (array_length(product_focus, 1) is null or array_length(product_focus, 1) <= 20),
  certificates text[] not null default '{}'::text[] check (array_length(certificates, 1) is null or array_length(certificates, 1) <= 30),
  payment_terms text[] not null default '{}'::text[] check (array_length(payment_terms, 1) is null or array_length(payment_terms, 1) <= 20),
  publication_status yorso_company_publication_status not null default 'draft',
  buyer_qualification_status yorso_buyer_qualification_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint yorso_companies_country_code_uppercase check (country_code = upper(country_code))
);

create table if not exists yorso_company_media (
  company_id uuid primary key references yorso_companies(id) on delete cascade,
  logo_object_key text,
  cover_object_key text,
  logo_alt text check (logo_alt is null or char_length(logo_alt) <= 160),
  cover_alt text check (cover_alt is null or char_length(cover_alt) <= 160),
  logo_fit yorso_logo_fit not null default 'contain',
  cover_focal_x numeric(4, 3) not null default 0.5 check (cover_focal_x >= 0 and cover_focal_x <= 1),
  cover_focal_y numeric(4, 3) not null default 0.5 check (cover_focal_y >= 0 and cover_focal_y <= 1),
  updated_at timestamptz not null default now()
);

create index if not exists idx_yorso_companies_owner_user_id on yorso_companies(owner_user_id);
create index if not exists idx_yorso_companies_country_code on yorso_companies(country_code);
create index if not exists idx_yorso_companies_account_role on yorso_companies(account_role);
create index if not exists idx_yorso_companies_publication_status on yorso_companies(publication_status);

comment on table yorso_users is 'Self-hosted YORSO user profiles.';
comment on table yorso_companies is 'Self-hosted YORSO company profiles used by account workspace and supplier catalog.';
comment on table yorso_company_media is 'Object-storage references for company logo and cover media.';
