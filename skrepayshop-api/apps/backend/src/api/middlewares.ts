import { defineMiddlewares } from "@medusajs/framework/http"
import { tenantDatabaseScopeMiddleware } from "../lib/tenant-db-scope"
import { tenantAdminShimMiddleware } from "../lib/tenant-admin-shim"

export default defineMiddlewares({
  routes: [
    {
      matcher: /^\/admin(\/|$)/,
      middlewares: [tenantDatabaseScopeMiddleware, tenantAdminShimMiddleware],
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
