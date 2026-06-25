# SkrepayShop — Ecosistema

Plataforma SaaS multi-tenant sobre **Medusa v2**, con storefronts por cliente.

## Estructura del monorepo

```
skrepayshop-api/          → Motor Medusa (Render)
skrepayshop-platform/     → Lobby + login oficial (Netlify → skrepay.com)
tenants/
  luigi-games/            → Tienda del cliente Luigi Games (Netlify / luigigame.com)
supabase/                 → Postgres (datos compartidos + scrapers)
```

## URLs en producción

| Servicio | URL actual | Dominio futuro |
|----------|------------|----------------|
| **SkrepayShop** (plataforma) | https://strong-cascaron-2e0511.netlify.app | https://skrepay.com |
| **Panel Medusa** | https://luigi-games-api1.onrender.com/app | api.skrepay.com |
| **API** | https://luigi-games-api1.onrender.com | api.skrepay.com |
| **Luigi Games** (tenant) | Tienda cliente | https://luigigame.com |

## Despliegue

### Netlify — Plataforma SkrepayShop (sitio principal del repo)

- `netlify.toml` en la raíz → construye `skrepayshop-platform/`
- Conectar **skrepay.com** cuando esté listo
- Mientras tanto: **strong-cascaron-2e0511.netlify.app** = lobby + login

### Netlify — Tenant Luigi Games (sitio separado)

- Crear segundo sitio Netlify apuntando al mismo repo
- Base directory: `tenants/luigi-games`
- Usar `tenants/luigi-games/netlify.toml`

### Render — API

- `render.yaml` → `skrepayshop-api/`
- Base de datos: **Supabase** (`DATABASE_URL`)

## Login

1. Usuario entra a **SkrepayShop** → `/login`
2. Credenciales se validan contra la API Medusa en Render
3. Redirección al **panel oficial** en `/app`

No usar `localhost` en producción: todas las variables están en `netlify.toml` y `render.yaml`.

## Luigi Games como tenant

Luigi Games **no es** la plataforma. Es un **cliente** de SkrepayShop con su propia tienda (`tenants/luigi-games`). El botón **Panel** en el header lleva al login de SkrepayShop.

## Supabase

- Medusa usa `DATABASE_URL` (Postgres Supabase)
- Tabla `skrepayshop_tenants` registra tenants de la plataforma
- Tabla `scraped_products` para pipeline de importación
