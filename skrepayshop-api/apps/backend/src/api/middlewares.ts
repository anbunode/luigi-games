import { defineMiddlewares } from "@medusajs/framework/http"
import {
  tenantAdminDatabaseScopeMiddleware,
  tenantStoreDatabaseScopeMiddleware,
} from "../lib/tenant-db-scope"
import { tenantRegionTaxSyncMiddleware } from "../lib/tenant-region-tax-middleware"
import { tenantRegionDeleteMiddleware } from "../lib/tenant-region-delete-middleware"
import { tenantRegionCountryPoolMiddleware } from "../lib/tenant-region-country-pool-middleware"
import {
  tenantAdminSalesChannelByIdGetShim,
  tenantAdminSalesChannelsShim,
  tenantAdminStoreByIdGetShim,
  tenantAdminStoreByIdPostShim,
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
      matcher: "/admin/stores/:id",
      middlewares: [tenantAdminStoreByIdGetShim],
    },
    {
      method: "POST",
      matcher: "/admin/stores/:id",
      middlewares: [tenantAdminStoreByIdPostShim],
    },
    {
      method: "GET",
      matcher: "/admin/sales-channels",
      middlewares: [tenantAdminSalesChannelsShim],
    },
    {
      method: "GET",
      matcher: "/admin/sales-channels/:id",
      middlewares: [tenantAdminSalesChannelByIdGetShim],
    },
    {
      method: "POST",
      matcher: "/admin/regions",
      middlewares: [tenantRegionCountryPoolMiddleware, tenantRegionTaxSyncMiddleware],
    },
    {
      method: "POST",
      matcher: "/admin/regions/:id",
      middlewares: [tenantRegionCountryPoolMiddleware, tenantRegionTaxSyncMiddleware],
    },
    {
      method: "PUT",
      matcher: "/admin/regions/:id",
      middlewares: [tenantRegionCountryPoolMiddleware, tenantRegionTaxSyncMiddleware],
    },
    {
      method: "PATCH",
      matcher: "/admin/regions/:id",
      middlewares: [tenantRegionCountryPoolMiddleware, tenantRegionTaxSyncMiddleware],
    },
    {
      method: "DELETE",
      matcher: "/admin/regions/:id",
      middlewares: [tenantRegionDeleteMiddleware],
    },
    {
      matcher: /^\/store(\/|$)/,
      middlewares: [tenantStoreDatabaseScopeMiddleware],
    },
  ],
})
