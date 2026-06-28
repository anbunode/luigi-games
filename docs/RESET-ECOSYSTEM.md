# Reinicio del ecosistema SkrepayShop

Medusa vuelve a funcionar **de forma nativa** (panel, regiones, productos, pedidos). Solo se conserva:

| Capa | Qué se mantiene |
|------|-----------------|
| **Multi-tenant** | Schemas `t_{slug}`, `tenant-db-scope`, provisioning en signup, `clone-medusa-schema` |
| **Login** | `skrepayshop-platform` (skrepay.com/login) + `/skrepay/*` + session bridge |
| **Email** | Resend (`RESEND_API_KEY`, `SKREPAY_EMAIL_FROM`) |

## Qué se eliminó

- Módulos custom: `storefront_theme`, `skrepay_region`
- UI admin custom: regiones, dominios, tema, borradores, carritos abandonados, SEO
- APIs custom que reemplazaban Medusa: `/admin/regions`, storefront-theme, etc.

## Qué se mantiene en el backend (multi-tenant, no es UI custom)

- `tenant-admin-shim.ts` — necesario para que `/admin/users/me`, `/admin/stores` y `/admin/sales-channels` lean el schema `t_{slug}`. Sin esto el panel rebota al login de skrepay.com.

## Reiniciar base de datos (Supabase)

```bash
node scripts/reset-ecosystem-database.mjs --confirm
```

Esto borra schemas `t_*`, tablas `skrepayshop_*` y reaplica `supabase/migrations/`.

**Importante:** Medusa core (`public` o schema base) no se toca. Cada tenant nuevo recibe su schema `t_{slug}` al registrarse.

## Después del reset

1. **Render** — redeploy automático al push a `main` (o manual en dashboard)
2. **Netlify** — skrepay.com (platform) se redeploya igual
3. **Primera cuenta** — https://skrepay.com/signup crea tenant + schema + admin Medusa
4. **Panel** — login en skrepay.com → redirige a `/app` (Medusa admin nativo en español)

## Variables de entorno (Render)

Sin cambios respecto a `render.yaml`:

- `DATABASE_URL` / `PLATFORM_DATABASE_URL`
- `RESEND_API_KEY`, `SKREPAY_EMAIL_FROM`
- `PLATFORM_URL`, `MEDUSA_BACKEND_URL`
- CORS para skrepay.com

## Desarrollo local

```bash
cd skrepayshop-api/apps/backend
npm run dev
# Admin: http://localhost:9000/app (requiere login vía skrepay.com o session-bridge)
```
