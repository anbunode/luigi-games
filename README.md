# SkrepayShop — skrepay.com

Monorepo oficial SkrepayShop.

| Pieza | Host | Carpeta |
|-------|------|---------|
| Plataforma (lobby + login) | **skrepay.com** (Netlify) | `skrepayshop-platform/` |
| API + Panel Medusa | **api.skrepay.com** (Render) | `skrepayshop-api/` |
| Base de datos | Supabase | `supabase/` |

## Despliegue

Ver **[docs/DEPLOY-SKREPAY.md](docs/DEPLOY-SKREPAY.md)**

## Desarrollo local

```bash
cd skrepayshop-platform && npm install && npm run dev
```

http://localhost:3001
