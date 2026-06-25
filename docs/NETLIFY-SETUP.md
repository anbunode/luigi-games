# Despliegue SkrepayShop en Netlify (cuenta principal)

Guía para publicar **solo la plataforma** (lobby + login + acceso al panel).

## Qué despliega este sitio

| Ruta | Función |
|------|---------|
| `/` | Lobby SkrepayShop |
| `/login` | Inicio de sesión oficial |
| `/panel` | Redirección al panel Medusa |
| `/api/auth/login` | Valida credenciales contra Render |

**No despliega** tiendas de clientes ni checkout — eso van en sitios Netlify separados más adelante.

## Pasos en tu cuenta Netlify

### 1. Nuevo sitio desde Git

1. **Add new site** → **Import an existing project**
2. Conecta GitHub → repo `luigi-games` (o el nombre actual)
3. Branch: `main`

### 2. Build settings (automático con `netlify.toml` en la raíz)

| Campo | Valor |
|-------|--------|
| Base directory | *(vacío — usa raíz del repo)* |
| Build command | `npm run build` (en `skrepayshop-platform`) |
| Publish directory | `.next` |

El archivo raíz `netlify.toml` ya apunta a `skrepayshop-platform/`.

### 3. Variables de entorno (obligatorias)

En **Site configuration → Environment variables**, añade:

```
MEDUSA_BACKEND_URL          = https://tu-api.onrender.com
NEXT_PUBLIC_ADMIN_ORIGIN    = https://tu-api.onrender.com
NEXT_PUBLIC_PLATFORM_URL    = https://skrepay.com  (o URL temporal Netlify)
NEXT_PUBLIC_PANEL_URL       = https://app.skrepay.com
```

Copia la plantilla desde `skrepayshop-platform/.env.example`.

**Importante:** `MEDUSA_BACKEND_URL` debe ser la API con `DATABASE_URL` configurada en Render (Supabase). Sin eso el login falla.

### 4. Dominio

- **Provisional:** `https://tu-sitio.netlify.app`
- **Definitivo:** `skrepay.com` → Domain management → Add custom domain

Actualiza `NEXT_PUBLIC_PLATFORM_URL` cuando conectes el dominio.

### 5. Render (API + panel)

En el **mismo** servicio Render:

1. `DATABASE_URL` = connection string Supabase
2. Custom domain `api.skrepay.com` → CNAME Render
3. Opcional: `app.skrepay.com` → mismo servicio (admin en `/app`)

Cuando `api.skrepay.com` funcione, cambia en Netlify:

```
MEDUSA_BACKEND_URL=https://api.skrepay.com
NEXT_PUBLIC_ADMIN_ORIGIN=https://api.skrepay.com
```

### 6. Probar login

1. Abre `https://tu-sitio.netlify.app/login`
2. Credenciales admin de Medusa
3. Debe redirigir al **panel** (`/app` en tu API)

## Varios sitios en la misma cuenta Netlify

| Sitio Netlify | Carpeta | Propósito |
|---------------|---------|-----------|
| **SkrepayShop** | raíz → `skrepayshop-platform` | Lobby + login |
| Checkout (existente) | tu proyecto checkout | Pagos |
| Tiendas tenant (futuro) | `tenants/*` | Una app multi-tenant, no un sitio por tema |

## Checklist antes del deploy

- [ ] Render con `DATABASE_URL` y deploy en verde
- [ ] Variables en Netlify (`MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_ADMIN_ORIGIN`)
- [ ] Usuario admin creado en Medusa (`medusa user` o seed)
- [ ] CORS en Render incluye tu URL Netlify y `skrepay.com`
