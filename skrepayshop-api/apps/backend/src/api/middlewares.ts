import { defineMiddlewares } from "@medusajs/framework/http"
import {
  tenantAdminDatabaseScopeMiddleware,
  tenantStoreDatabaseScopeMiddleware,
} from "../lib/tenant-db-scope"
import { tenantRegionTaxSyncMiddleware } from "../lib/tenant-region-tax-middleware"
import { tenantRegionDeleteMiddleware } from "../lib/tenant-region-delete-middleware"
import { tenantRegionCountryPoolMiddleware } from "../lib/tenant-region-country-pool-middleware"
import {
  tenantAdminPricePreferenceByIdDeleteShim,
  tenantAdminPricePreferenceByIdGetShim,
  tenantAdminPricePreferenceByIdPostShim,
  tenantAdminPricePreferencesPostShim,
  tenantAdminPricePreferencesShim,
  tenantAdminSalesChannelByIdGetShim,
  tenantAdminSalesChannelsShim,
  tenantAdminStoreByIdGetShim,
  tenantAdminStoreByIdPostShim,
  tenantAdminStoresShim,
  tenantAdminUsersMeShim,
} from "../lib/tenant-admin-shim"
import {
  tenantAdminStockLocationByIdGetShim,
  tenantAdminStockLocationByIdPostShim,
  tenantAdminStockLocationsListShim,
  tenantAdminStockLocationsPostShim,
} from "../lib/tenant-stock-locations-shim"

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
      matcher: "/admin/price-preferences",
      middlewares: [tenantAdminPricePreferencesShim],
    },
    {
      method: "POST",
      matcher: "/admin/price-preferences",
      middlewares: [tenantAdminPricePreferencesPostShim],
    },
    {
      method: "GET",
      matcher: "/admin/price-preferences/:id",
      middlewares: [tenantAdminPricePreferenceByIdGetShim],
    },
    {
      method: "POST",
      matcher: "/admin/price-preferences/:id",
      middlewares: [tenantAdminPricePreferenceByIdPostShim],
    },
    {
      method: "DELETE",
      matcher: "/admin/price-preferences/:id",
      middlewares: [tenantAdminPricePreferenceByIdDeleteShim],
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
      method: "GET",
      matcher: "/admin/stock-locations",
      middlewares: [tenantAdminStockLocationsListShim],
    },
    {
      method: "POST",
      matcher: "/admin/stock-locations",
      middlewares: [tenantAdminStockLocationsPostShim],
    },
    {
      method: "GET",
      matcher: "/admin/stock-locations/:id",
      middlewares: [tenantAdminStockLocationByIdGetShim],
    },
    {
      method: "POST",
      matcher: "/admin/stock-locations/:id",
      middlewares: [tenantAdminStockLocationByIdPostShim],
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
