-- SkrepayShop: dominios por tenant + preparación BD dedicada por tienda
-- Tablas de PLATAFORMA (permanecen en la BD central de Skrepay)

alter table public.skrepayshop_tenants
  add column if not exists database_url text,
  add column if not exists database_status text not null default 'shared'
    check (database_status in ('shared', 'provisioning', 'dedicated', 'active'));

comment on column public.skrepayshop_tenants.database_url is
  'URL Postgres dedicada del tenant. NULL = usa DATABASE_URL compartida (fase transición).';
comment on column public.skrepayshop_tenants.database_status is
  'shared: motor compartido | provisioning: creando BD | dedicated/active: BD propia.';

create table if not exists public.skrepayshop_store_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.skrepayshop_tenants(id) on delete cascade,
  domain_name text not null,
  is_primary boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'verifying', 'active', 'failed')),
  is_cloudflare_automated boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skrepayshop_store_domains_domain_name_unique unique (domain_name)
);

create index if not exists idx_skrepayshop_store_domains_tenant
  on public.skrepayshop_store_domains (tenant_id);

create unique index if not exists idx_skrepayshop_store_domains_one_primary
  on public.skrepayshop_store_domains (tenant_id)
  where is_primary = true;

comment on table public.skrepayshop_store_domains is
  'Dominios públicos por tenant (subdominio gratis + dominios personalizados).';

-- Subdominio provisional Luigi Games
insert into public.skrepayshop_store_domains (
  tenant_id, domain_name, is_primary, status, is_cloudflare_automated
)
select
  t.id,
  coalesce(t.free_subdomain, t.slug || '.skrepay.shop'),
  true,
  'active',
  false
from public.skrepayshop_tenants t
where t.slug = 'luigi-games'
  and not exists (
    select 1 from public.skrepayshop_store_domains d where d.tenant_id = t.id
  );

-- Dominio personalizado Luigi (pendiente verificación DNS hasta que el cliente lo active)
insert into public.skrepayshop_store_domains (
  tenant_id, domain_name, is_primary, status, is_cloudflare_automated
)
select
  t.id,
  'www.luigigame.com',
  false,
  'pending',
  false
from public.skrepayshop_tenants t
where t.slug = 'luigi-games'
  and not exists (
    select 1
    from public.skrepayshop_store_domains d
    where d.tenant_id = t.id and d.domain_name = 'www.luigigame.com'
  );
