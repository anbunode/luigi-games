-- Staging table for scraped catalog data (future import pipeline → Medusa API)
-- Run in Supabase SQL Editor or via Supabase CLI

create extension if not exists "pgcrypto";

create table if not exists public.scraped_products (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  source_store text not null,
  title text not null,
  description text,
  handle text,
  product_type text default 'key',
  platform text,
  region text default 'Global',
  price numeric(12, 2),
  original_price numeric(12, 2),
  currency text not null default 'EUR',
  discount_percent integer,
  promo_label text,
  image_url text,
  source_url text,
  genres text[] default '{}',
  metadata jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'synced', 'rejected', 'error')),
  medusa_product_id text,
  scrape_batch_id uuid,
  scraped_at timestamptz not null default now(),
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists scraped_products_source_external_idx
  on public.scraped_products (source_store, external_id)
  where external_id is not null;

create index if not exists scraped_products_status_idx
  on public.scraped_products (status);

create index if not exists scraped_products_batch_idx
  on public.scraped_products (scrape_batch_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists scraped_products_updated_at on public.scraped_products;
create trigger scraped_products_updated_at
  before update on public.scraped_products
  for each row execute function public.set_updated_at();

comment on table public.scraped_products is
  'Staging catalog from external stores. Scripts insert here; sync job pushes to Medusa.';
