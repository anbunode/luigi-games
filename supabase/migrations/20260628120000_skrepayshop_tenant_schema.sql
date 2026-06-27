-- Schema dedicado por tenant (misma instancia Supabase, coste cero extra)
alter table public.skrepayshop_tenants
  add column if not exists database_schema text;

comment on column public.skrepayshop_tenants.database_schema is
  'Schema Postgres del tenant (ej. t_luigi_games). Una sola API Render usa search_path por request.';

update public.skrepayshop_tenants
set database_schema = 't_' || replace(slug, '-', '_')
where database_status in ('active', 'dedicated')
  and database_schema is null
  and slug is not null;
