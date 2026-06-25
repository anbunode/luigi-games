-- URLs por tenant: subdominio gratis, dominio propio, links de pago
alter table public.skrepayshop_tenants
  add column if not exists free_subdomain text,
  add column if not exists custom_domain text,
  add column if not exists payment_link_base text not null default 'pay.skrepay.com';

update public.skrepayshop_tenants
set
  free_subdomain = slug || '.skrepay.shop',
  custom_domain = coalesce(custom_domain, domain)
where slug = 'luigi-games';

create table if not exists public.skrepayshop_payment_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.skrepayshop_tenants(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  amount numeric(12, 2) not null,
  currency text not null default 'EUR',
  medusa_product_id text,
  medusa_cart_id text,
  public_path text not null,
  status text not null default 'active'
    check (status in ('active', 'expired', 'disabled')),
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists idx_skrepayshop_payment_links_tenant
  on public.skrepayshop_payment_links (tenant_id);

comment on table public.skrepayshop_payment_links is
  'Links de pago rápido SkrepayShop: pay.skrepay.com/{tenant}/{slug}';
