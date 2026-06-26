# SkrepayShop — Arquitectura de bases de datos

## Capas

| Capa | Contenido | Dónde vive |
|------|-----------|------------|
| **Plataforma Skrepay** | `skrepayshop_tenants`, `skrepayshop_store_domains`, OTP, payment links | BD central Supabase (`DATABASE_URL` del API) |
| **Tienda (tenant)** | Medusa: productos, clientes, pedidos, `storefront_theme` | BD dedicada por tenant (`database_url` en el registro) |

Skrepay conserva **control total** de todas las URLs de conexión en `skrepayshop_tenants.database_url`.

## Estados de `database_status`

| Valor | Significado |
|-------|-------------|
| `shared` | Usa la BD compartida (fase transición / piloto) |
| `provisioning` | Creando BD dedicada |
| `dedicated` | BD creada, migrando datos |
| `active` | BD dedicada en producción |

## Dominios

- Tabla: `skrepayshop_store_domains`
- Panel: **Configuración → Dominios** (`/app/settings/domains`)
- Subdominio gratis: `{slug}.skrepay.shop` (auto en signup)
- Dominio custom: manual + DNS o mock Cloudflare

## Próximo paso: BD dedicada Luigi Games

```bash
node scripts/provision-tenant-database.mjs luigi-games
```

Crea un proyecto/schema Supabase, ejecuta `medusa db:migrate` contra esa URL y actualiza `skrepayshop_tenants.database_url`.

## Aislamiento actual vs objetivo

**Hoy (shared):** temas y dominios ya están scoped por `tenant_id` / `medusa_user_id`. Clientes y pedidos siguen en tablas Medusa compartidas hasta migrar la BD.

**Objetivo:** cada fila en `skrepayshop_tenants` con `database_url` propia + router de API por tenant (fase posterior).
