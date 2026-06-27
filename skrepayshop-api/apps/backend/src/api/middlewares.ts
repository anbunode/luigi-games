import { defineMiddlewares } from "@medusajs/framework/http"
import { tenantDatabaseScopeMiddleware } from "../lib/tenant-db-scope"

export default defineMiddlewares({
  routes: [
    {
      matcher: /^\/admin(\/|$)/,
      middlewares: [tenantDatabaseScopeMiddleware],
    },
    {
      matcher: /^\/store(\/|$)/,
      middlewares: [tenantDatabaseScopeMiddleware],
    },
    {
      matcher: /^\/admin\/storefront-theme\/banner-image$/,
      methods: ["POST"],
      bodyParser: false,
    },
  ],
})
