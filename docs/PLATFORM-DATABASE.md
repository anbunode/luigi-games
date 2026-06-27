# SkrepayShop — Arquitectura de bases de datos (multi-tenant barato)

## Una sola Supabase + una sola API Render

No hace falta un proyecto Supabase ni un servicio Render por tienda.

| Capa | Dónde | Coste extra |
|------|--------|-------------|
| Plataforma (`skrepayshop_*`, OTP, dominios) | Schema `public` | $0 |
| Tienda (Medusa: productos, clientes, pedidos) | Schema `t_{slug}` en la **misma** Supabase | $0 |
| API | **Una** instancia Render | $7/mes total |

Cada tenant recibe su schema Postgres (`t_luigi_games`, `t_mi-tienda`, …). La API cambia `search_path` por request según el usuario logueado o el header `x-skrepay-tenant`.

## Signup 100% automático

Al registrarse en `skrepay.com`:

1. Se crea el schema `t_{slug}`
2. Se migran tablas Medusa en ese schema
3. Se crea admin + canal de ventas solo ahí
4. Se guarda en `skrepayshop_tenants` (`database_schema`, `database_status = active`)

Sin intervención manual. Escala a cientos/miles de tiendas en la misma instancia.

## Variables de entorno (Render)

```env
DATABASE_URL=postgresql://...supabase.../postgres
PLATFORM_DATABASE_URL=postgresql://...   # misma URL si quieres
# TENANT_AUTO_PROVISION=false           # solo para desactivar signup automático
```

No necesitas `LUIGI_GAMES_DATABASE_URL` ni URLs por cliente.

## Luigi Games

Script único de arranque (schema vacío, sin migrar datos viejos):

```bash
node scripts/connect-luigi-database.mjs --bootstrap
```

Requiere en `.env`:

```env
LUIGI_ADMIN_EMAIL=tu@correo.com
LUIGI_ADMIN_PASSWORD=...
```

## Login y panel

- Login: `/skrepay/auth/login` → autentica en el schema del tenant
- Panel `/admin/*`: middleware aplica `search_path` del tenant del JWT/sesión
- Storefront `/store/*`: middleware usa `x-skrepay-tenant` o `tenant_slug`

## Migraciones SQL de plataforma

```bash
node scripts/apply-platform-migrations.mjs
```

Aplica archivos en `supabase/migrations/` sin borrar datos.
