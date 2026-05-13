-- YORSO self-hosted account workspace sections.
-- Stores editable cabinet collections behind /v1/account/* endpoints.

create type yorso_branch_type as enum (
  'registered_address',
  'office',
  'warehouse',
  'processing_plant',
  'sales_office',
  'loading_point'
);

create type yorso_product_state as enum ('frozen', 'fresh', 'chilled', 'alive', 'cooked');
create type yorso_product_role as enum ('buying', 'selling', 'both');

create type yorso_meta_region_logistics_reason as enum (
  'similar_freight_cost',
  'same_customs_zone',
  'same_sales_market',
  'same_warehouse_route',
  'manual'
);

create type yorso_meta_region_used_for as enum (
  'notifications',
  'price_access',
  'campaigns',
  'landed_cost',
  'supplier_matching'
);

create type yorso_notification_channel as enum ('email', 'messenger', 'in_app', 'agent');
create type yorso_notification_event as enum (
  'price_access_approved',
  'new_matching_product',
  'rfq_response',
  'price_movement',
  'document_readiness',
  'country_news',
  'supplier_profile_review'
);
create type yorso_notification_frequency as enum ('instant', 'daily', 'weekly');

create table if not exists yorso_company_branches (
  id text not null check (char_length(id) between 1 and 80),
  company_id uuid not null references yorso_companies(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  type yorso_branch_type not null,
  country text not null check (char_length(country) between 2 and 80),
  region text not null default '' check (char_length(region) <= 120),
  city text not null check (char_length(city) between 1 and 120),
  address_line text not null default '' check (char_length(address_line) <= 220),
  default_incoterms text not null check (char_length(default_incoterms) between 2 and 20),
  port_or_pickup_point text not null default '' check (char_length(port_or_pickup_point) <= 160),
  notes text not null default '' check (char_length(notes) <= 600),
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists yorso_company_products (
  id text not null check (char_length(id) between 1 and 80),
  company_id uuid not null references yorso_companies(id) on delete cascade,
  commercial_name text not null check (char_length(commercial_name) between 2 and 140),
  latin_name text not null default '' check (char_length(latin_name) <= 140),
  category text not null check (char_length(category) between 2 and 80),
  state yorso_product_state not null,
  format text not null default '' check (char_length(format) <= 180),
  role yorso_product_role not null,
  monthly_volume text not null default '' check (char_length(monthly_volume) <= 80),
  certificates text[] not null default '{}'::text[] check (array_length(certificates, 1) is null or array_length(certificates, 1) <= 30),
  target_countries text[] not null default '{}'::text[] check (array_length(target_countries, 1) is null or array_length(target_countries, 1) <= 60),
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists yorso_company_meta_regions (
  id text not null check (char_length(id) between 1 and 80),
  company_id uuid not null references yorso_companies(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  countries text[] not null default '{}'::text[] check (array_length(countries, 1) is null or array_length(countries, 1) <= 80),
  logistics_reason yorso_meta_region_logistics_reason not null,
  default_currency char(3) not null,
  notes text not null default '' check (char_length(notes) <= 600),
  used_for yorso_meta_region_used_for[] not null default '{}'::yorso_meta_region_used_for[],
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint yorso_meta_regions_currency_uppercase check (default_currency = upper(default_currency)),
  primary key (company_id, id)
);

create table if not exists yorso_notification_preferences (
  id text not null check (char_length(id) between 1 and 80),
  user_id uuid not null references yorso_users(id) on delete cascade,
  channel yorso_notification_channel not null,
  enabled boolean not null default true,
  events yorso_notification_event[] not null default '{}'::yorso_notification_event[],
  frequency yorso_notification_frequency not null default 'instant',
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint yorso_notification_enabled_has_events check (not enabled or array_length(events, 1) > 0),
  primary key (user_id, id)
);

create index if not exists idx_yorso_company_branches_company_id on yorso_company_branches(company_id);
create index if not exists idx_yorso_company_products_company_id on yorso_company_products(company_id);
create index if not exists idx_yorso_company_products_role on yorso_company_products(role);
create index if not exists idx_yorso_company_meta_regions_company_id on yorso_company_meta_regions(company_id);
create index if not exists idx_yorso_notification_preferences_user_id on yorso_notification_preferences(user_id);
create index if not exists idx_yorso_notification_preferences_channel on yorso_notification_preferences(channel);

comment on table yorso_company_branches is 'Self-hosted account branch and loading point records.';
comment on table yorso_company_products is 'Self-hosted company product matching matrix.';
comment on table yorso_company_meta_regions is 'Self-hosted logistics meta-region definitions.';
comment on table yorso_notification_preferences is 'Self-hosted buyer/supplier notification channel preferences.';
