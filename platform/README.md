# Luigi Commerce Platform

Lobby SaaS multi-tenant y login oficial del ecosistema.

## Rutas

- `/` — Página de recepción (video hero, producto, ecosistema, planes)
- `/login` — Inicio de sesión oficial
- `/api/auth/login` — Valida credenciales contra Medusa y redirige al panel

## Desarrollo local

```bash
cd platform
npm install
npm run dev
```

Abre http://localhost:3001

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_PLATFORM_NAME` | Nombre de la plataforma |
| `NEXT_PUBLIC_ADMIN_URL` | URL del panel Medusa (`/app`) |
| `MEDUSA_BACKEND_URL` | API Medusa (solo servidor) |
| `NEXT_PUBLIC_DEMO_STORE_URL` | Tienda demo pública |
| `NEXT_PUBLIC_HERO_VIDEO_URL` | Video de fondo del lobby |

## Deploy en Netlify

1. Nuevo sitio desde el repo
2. Base directory: `platform`
3. Usar `platform/netlify.toml`
4. Dominio sugerido: `app.luigigame.com`

## Arquitectura

```
platform/     → Lobby + login SaaS
storefront/   → Tienda pública del tenant
backend/      → Medusa API + admin
```
