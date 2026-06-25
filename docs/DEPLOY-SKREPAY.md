# SkrepayShop — despliegue desde cero

## 1. Git (dispara Netlify + Render si están conectados)

```powershell
cd "C:\Open Source Shop"
git add -A
git commit -m "SkrepayShop: deploy config skrepay.com + api.skrepay.com"
git push origin main
```

## 2. Render — servicio `skrepayshop-api`

1. Dashboard → servicio **skrepayshop-api** (o créalo desde Blueprint con `render.yaml`)
2. **Root Directory:** `skrepayshop-api`
3. **Environment** → pegar `DATABASE_URL` de Supabase (misma que ya usas)
4. Verificar:
   - `MEDUSA_BACKEND_URL` = `https://api.skrepay.com`
   - CORS con `https://skrepay.com`
5. **Custom Domains** → `api.skrepay.com`
6. Manual Deploy

Detalle: `docs/RENDER-SETUP.md`

## 3. Netlify — skrepay.com (proyecto existente)

En el sitio que ya tiene **skrepay.com**:

| Setting | Valor |
|---------|--------|
| Base directory | *(vacío — usa `netlify.toml` raíz)* |
| Build command | *(automático)* |
| Branch | `main` |

**Environment variables** (Site configuration):

```
MEDUSA_BACKEND_URL=https://api.skrepay.com
NEXT_PUBLIC_ADMIN_ORIGIN=https://api.skrepay.com
NEXT_PUBLIC_PLATFORM_URL=https://skrepay.com
NEXT_PUBLIC_PANEL_URL=https://app.skrepay.com
```

Si `api.skrepay.com` aún no apunta a Render, usa temporalmente:
`https://skrepayshop-api.onrender.com` en las dos primeras variables.

Trigger deploy: **Deploys** → **Trigger deploy**

## 4. Probar

- https://skrepay.com → lobby
- https://skrepay.com/login → credenciales Medusa → panel
- https://api.skrepay.com/health → OK

## 5. Usuario admin (primera vez)

```powershell
cd skrepayshop-api/apps/backend
npx medusa user -e admin@skrepay.com -p TuPasswordSegura2026!
```
