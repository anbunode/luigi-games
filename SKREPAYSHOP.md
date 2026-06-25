# SkrepayShop

Plataforma SaaS multi-tenant (lobby + login + panel Medusa).

## Estructura actual (borrón y cuenta nueva)

```
skrepayshop-platform/   → Netlify: skrepay.com (lobby + login)  ← EMPEZAMOS AQUÍ
skrepayshop-api/        → Render: api.skrepay.com (Medusa)
tenants/                → Tiendas cliente (más adelante, ej. luigi-games)
docs/NETLIFY-SETUP.md   → Guía para tu cuenta Netlify principal
```

## Despliegue rápido Netlify

1. Importa el repo en tu cuenta Netlify principal
2. El `netlify.toml` raíz ya configura `skrepayshop-platform`
3. Añade env vars (ver `skrepayshop-platform/.env.example`)
4. Deploy

## Desarrollo local

```bash
cd skrepayshop-platform
npm install
npm run dev
```

http://localhost:3001

## Login → Panel

`/login` valida contra la API Render y redirige a `{ADMIN_ORIGIN}/app`.

Configura en Netlify:

- `MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_ADMIN_ORIGIN`

Cuando tengas DNS: usa `https://api.skrepay.com` en ambas.
