import { defineMiddlewares } from "@medusajs/framework/http"
import {
  tenantAdminDatabaseScopeMiddleware,
  tenantStoreDatabaseScopeMiddleware,
} from "../lib/tenant-db-scope"
import { tenantAdminShimMiddleware } from "../lib/tenant-admin-shim"

export default defineMiddlewares({
  routes: [
    {
      matcher: /^\/admin(\/|$)/,
      middlewares: [
        tenantAdminDatabaseScopeMiddleware,
        tenantAdminShimMiddleware,
      ],
    },
    {
      matcher: /^\/store(\/|$)/,
      middlewares: [tenantStoreDatabaseScopeMiddleware],
    },
    {
      matcher: /^\/admin\/storefront-theme\/banner-image$/,
      methods: ["POST"],
      bodyParser: false,
    },
  ],
})
