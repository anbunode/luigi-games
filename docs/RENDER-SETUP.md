# Render — SkrepayShop API

Servicio: **skrepayshop-api**  
URL pública objetivo: **https://api.skrepay.com**  
Panel Medusa: **https://api.skrepay.com/app** (o **https://app.skrepay.com** con CNAME)

## Crear / actualizar en Render

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint** o edita el servicio existente
2. Conecta repo `anbunode/luigi-games`
3. **Root Directory:** `skrepayshop-api`
4. **Build:** `npm run render:build`
5. **Start:** `npm run render:start`

## Variables obligatorias (Environment)

Copia desde `apps/backend/.env.production.example`. **Mínimo:**

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | Connection string Supabase (la misma de siempre) |
| `PLATFORM_DATABASE_URL` | **Misma URL que DATABASE_URL** (registro plataforma; opcional si DATABASE_URL ya está) |
| `TENANT_AUTO_PROVISION` | `true` — crea schema `t_{slug}` automático en signup |
| `MEDUSA_BACKEND_URL` | `https://api.skrepay.com` |
| `STORE_CORS` | `https://skrepay.com,https://www.skrepay.com,https://app.skrepay.com` |
| `ADMIN_CORS` | igual + `https://api.skrepay.com` |
| `AUTH_CORS` | igual que ADMIN_CORS |
| `JWT_SECRET` | auto o secreto largo |
| `COOKIE_SECRET` | auto o secreto largo |

Sin `DATABASE_URL` el deploy falla con `ECONNREFUSED 127.0.0.1:5432`.

## Custom domain

Render → skrepayshop-api → **Settings** → **Custom Domains**:

- `api.skrepay.com` → CNAME al host que indique Render
- Opcional: `app.skrepay.com` → mismo servicio (admin en `/app`)

## Health check

`https://api.skrepay.com/health` debe responder `200`.
