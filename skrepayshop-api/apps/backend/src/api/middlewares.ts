import { defineMiddlewares } from "@medusajs/framework/http"
import {
  tenantAdminDatabaseScopeMiddleware,
  tenantStoreDatabaseScopeMiddleware,
} from "../lib/tenant-db-scope"
import {
  tenantAdminRegionsShim,
  tenantAdminSalesChannelsShim,
  tenantAdminStoresShim,
  tenantAdminUsersMeShim,
} from "../lib/tenant-admin-shim"

export default defineMiddlewares({
  routes: [
    {
      matcher: /^\/admin(\/|$)/,
      middlewares: [tenantAdminDatabaseScopeMiddleware],
    },
    {
      method: "GET",
      matcher: "/admin/users/me",
      middlewares: [tenantAdminUsersMeShim],
    },
    {
      method: "GET",
      matcher: "/admin/stores",
      middlewares: [tenantAdminStoresShim],
    },
    {
      method: "GET",
      matcher: "/admin/regions",
      middlewares: [tenantAdminRegionsShim],
    },
    {
      method: "GET",
      matcher: "/admin/sales-channels",
      middlewares: [tenantAdminSalesChannelsShim],
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
