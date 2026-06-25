-- SkrepayShop platform registry (multi-tenant foundation)
-- Run in Supabase SQL Editor or via Supabase CLI

create table if not exists public.skrepayshop_tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  domain text,
  storefront_url text,
  medusa_sales_channel_id text,
  plan text not null default 'starter'
    check (plan in ('starter', 'growth', 'scale')),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'trial')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_skrepayshop_tenants_slug
  on public.skrepayshop_tenants (slug);

insert into public.skrepayshop_tenants (slug, display_name, domain, storefront_url, plan)
values (
  'luigi-games',
  'Luigi Games',
  'luigigame.com',
  'https://luigigame.com',
  'starter'
)
on conflict (slug) do update set
  display_name = excluded.display_name,
  domain = excluded.domain,
  storefront_url = excluded.storefront_url,
  updated_at = now();

comment on table public.skrepayshop_tenants is
  'SkrepayShop SaaS tenant registry. Each row is one merchant store on the platform.';
