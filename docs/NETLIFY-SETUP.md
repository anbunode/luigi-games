# Netlify — skrepay.com (cuenta oficial)

Tu dominio **skrepay.com** ya está en un proyecto Netlify. Actualízalo para servir **SkrepayShop**.

## Configuración del sitio

1. Netlify → sitio con **skrepay.com**
2. **Site configuration** → **Build & deploy**
3. **Repository:** `anbunode/luigi-games` branch `main`
4. El `netlify.toml` en la raíz define:
   - Base: `skrepayshop-platform`
   - Build: `npm run build`

Si el sitio apuntaba a otra carpeta (ej. `storefront`), cámbialo para usar el repo tal cual (raíz).

## Variables de entorno

Site configuration → Environment variables:

```
NEXT_PUBLIC_PLATFORM_NAME=SkrepayShop
NEXT_PUBLIC_PLATFORM_URL=https://skrepay.com
NEXT_PUBLIC_PANEL_URL=https://app.skrepay.com
MEDUSA_BACKEND_URL=https://api.skrepay.com
NEXT_PUBLIC_ADMIN_ORIGIN=https://api.skrepay.com
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.skrepay.com
```

**Temporal** (hasta que `api.skrepay.com` resuelva a Render):

```
MEDUSA_BACKEND_URL=https://skrepayshop-api.onrender.com
NEXT_PUBLIC_ADMIN_ORIGIN=https://skrepayshop-api.onrender.com
```

## Deploy

**Deploys** → **Trigger deploy** → Clear cache and deploy

## Dominio

skrepay.com ya asignado — no cambiar salvo que muevas a otro sitio.

## Checkout existente

Mantén el proyecto de checkout como **sitio Netlify separado**. No mezclar con SkrepayShop platform.
