# Supabase — SkrepayShop

## Por qué no ves cambios en el Table Editor

Supabase **Table Editor** muestra por defecto el schema `public`. La arquitectura multi-tenant usa **schemas separados**:

| Schema | Contenido |
|--------|-----------|
| `public` | `skrepayshop_tenants`, `skrepayshop_store_domains`, OTP |
| `t_luigi_games` | Medusa de Luigi (productos, clientes, pedidos, users) |
| `t_{slug}` | Cada tienda nueva del signup |

### Ver la estructura de Luigi en Supabase

1. **SQL Editor** → ejecuta:

```sql
-- Tablas del tenant Luigi
select table_schema, table_name
from information_schema.tables
where table_schema = 't_luigi_games'
order by table_name;

-- Registro en plataforma
select slug, owner_email, database_schema, database_status
from public.skrepayshop_tenants
where slug = 'luigi-games';
```

2. En algunos paneles Supabase: **Database → Schema** (selector arriba del Table Editor) → elige `t_luigi_games`.

## ¿Conectar Supabase al repo de GitHub?

**Opcional.** Las migraciones de plataforma viven en:

```
supabase/migrations/*.sql
```

### Opción A — Script local (lo que usamos hoy)

```bash
node scripts/apply-platform-migrations.mjs
```

Aplica todos los `.sql` contra la BD configurada en `apps/backend/.env`.

### Reinicio completo (borrar tenants + plataforma)

```bash
node scripts/reset-ecosystem-database.mjs --confirm
```

Ver `docs/RESET-ECOSYSTEM.md`.

### Opción B — Supabase CLI + GitHub (recomendado a medio plazo)

1. Instala [Supabase CLI](https://supabase.com/docs/guides/cli)
2. En el dashboard: **Project Settings → General** → copia **Project ID** (`guylmkzfdreudpkcsvvx`)
3. En el repo:

```bash
npx supabase link --project-ref guylmkzfdreudpkcsvvx
npx supabase db push
```

4. **Integrations → GitHub** en Supabase: conecta `anbunode/luigi-games` para que `supabase db push` en CI aplique migraciones al hacer merge a `main`.

Los schemas de tenant (`t_*`) **no** se crean por migraciones SQL del repo: se crean **automáticamente** en signup vía API (`provisionTenantDatabase`).

Tras clonar la estructura, se copian **monedas y proveedores de pago** desde `public` (requerido para crear regiones en el panel).

Reparar tenants existentes sin esos datos:

```bash
node scripts/repair-tenant-reference-data.mjs
```

## Render

Una sola variable de conexión:

- `DATABASE_URL` = connection string Supabase
- `PLATFORM_DATABASE_URL` = **la misma URL** (o déjala vacía; el código usa `DATABASE_URL` como fallback)

No hace falta otra instancia Render por tienda.
