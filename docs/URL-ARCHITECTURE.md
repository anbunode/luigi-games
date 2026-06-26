# Arquitectura de URLs — SkrepayShop

Cómo funcionan dominios gratuitos, panel, tiendas y links de pago rápido.

## Capas del ecosistema

```
┌─────────────────────────────────────────────────────────────┐
│  skrepay.com          → Lobby + login (Netlify)             │
│  app.skrepay.com      → Panel comerciante (Medusa Admin)  │
│  api.skrepay.com      → API Medusa (Render)                 │
│  {slug}.skrepay.shop  → Tienda gratis del tenant            │
│  pay.skrepay.com/...  → Checkout de pago rápido           │
└─────────────────────────────────────────────────────────────┘
```

Hoy el **motor** sigue en `luigi-games-api1.onrender.com` hasta que configures CNAME `api.skrepay.com` → Render. La **interfaz** ya muestra URLs SkrepayShop; el login redirige al origen real configurado en `NEXT_PUBLIC_ADMIN_ORIGIN`.

## Al crear una tienda (flujo futuro)

1. Usuario se registra en **skrepay.com/login**
2. SkrepayShop crea un **tenant** en Supabase (`skrepayshop_tenants`)
3. Se asignan automáticamente:
   - **Subdominio gratis:** `mi-marca.skrepay.shop` (storefront Netlify o edge)
   - **Acceso al panel:** `app.skrepay.com` (mismo login, datos aislados por tenant en Medusa)
4. Opcional más adelante: **dominio propio** `www.mimarca.com` → CNAME a Netlify

### Luigi Games (primer tenant de prueba)

| Recurso | URL pública SkrepayShop | Estado |
|---------|-------------------------|--------|
| Tenant slug | `luigi-games` | En Supabase |
| Tienda | `luigi-games.skrepay.shop` o `luigigame.com` | Dominio propio del cliente |
| Panel | `app.skrepay.com` | Compartido plataforma |
| API | `api.skrepay.com` | CNAME → Render |

Luigi Games **no es** la plataforma: es un cliente que usa el mismo panel y API.

## Links de pago rápido (próxima feature)

**Problema:** muchos vendedores solo quieren cobrar por un servicio sin montar catálogo.

**Solución SkrepayShop:**

1. En el panel: sección **“Pago rápido”**
2. Campos: título, descripción corta, precio, moneda
3. El sistema crea en Medusa un **producto/checkout efímero** (o payment link vía Stripe/etc.)
4. Genera URL pública:

   `https://pay.skrepay.com/{tenant-slug}/{link-id}`

   Ejemplo: `https://pay.skrepay.com/luigi-games/consultoria-1h`

5. El comprador ve checkout instantáneo (sin navegar la tienda completa)
6. El link es **provisional gratis** en plan Starter; dominio propio opcional en Growth+

### ¿Genera también subdominio gratis?

| Producto | URL gratis incluida |
|----------|---------------------|
| Tienda completa | `{slug}.skrepay.shop` |
| Solo pago rápido | `pay.skrepay.com/{slug}/{id}` (no requiere tienda) |
| Dominio propio | CNAME del cliente → SkrepayShop (plan Growth+) |

Un merchant puede usar **solo links de pago** sin activar storefront, o tener ambos.

## Base de datos (Supabase)

- `skrepayshop_tenants` — registro de cada comerciante
- Futuro: `skrepayshop_payment_links` — links rápidos
- `skrepayshop_store_domains` — dominios custom verificados por tenant

## DNS recomendado (cuando compres skrepay.com)

| Registro | Destino |
|----------|---------|
| `skrepay.com` | Netlify (plataforma) |
| `app.skrepay.com` | Render (admin Medusa) o proxy |
| `api.skrepay.com` | Render (API) |
| `*.skrepay.shop` | Netlify wildcard o router tenant |
| `pay.skrepay.com` | App checkout (Netlify/edge) |

## Render — error Root Directory

Si ves `Root directory 'backend' does not exist`:

- **Opción A:** Settings → Root Directory → `skrepayshop-api`
- **Opción B:** dejar `backend` — el shim en `/backend/package.json` delega a `skrepayshop-api`

## Orden de implementación sugerido

1. ✅ Lobby + login + API en Render (ahora)
2. DNS `api.skrepay.com` + `app.skrepay.com` → Render
3. Wildcard `*.skrepay.shop` → deploy automático por tenant
4. Módulo **Pago rápido** en panel + ruta `pay.skrepay.com`
5. Luigi Games como tenant piloto con dominio propio `luigigame.com`
