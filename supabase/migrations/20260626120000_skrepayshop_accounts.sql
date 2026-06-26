-- SkrepayShop — cuentas de plataforma, códigos de correo y vínculo tenant↔usuario

alter table public.skrepayshop_tenants
  add column if not exists owner_email text,
  add column if not exists medusa_user_id text,
  add column if not exists email_verified_at timestamptz;

create unique index if not exists idx_skrepayshop_tenants_owner_email
  on public.skrepayshop_tenants (lower(owner_email))
  where owner_email is not null;

create table if not exists public.skrepayshop_verification_code (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  purpose text not null check (purpose in ('signup', 'password_reset')),
  code_hash text not null,
  payload jsonb not null default '{}',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_skrepayshop_verification_active
  on public.skrepayshop_verification_code (lower(email), purpose)
  where consumed_at is null;

comment on table public.skrepayshop_verification_code is
  'OTP de un solo uso para registro y restablecimiento de contraseña SkrepayShop.';
