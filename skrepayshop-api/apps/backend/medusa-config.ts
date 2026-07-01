import { loadEnv, defineConfig } from "@medusajs/framework/utils"
import { patchAdminEntryVitePlugin } from "./src/admin/lib/patch-admin-entry"
import { patchDraftOrderVitePlugin } from "./src/admin/lib/patch-draft-order-vite"
import { patchRegionCreateCurrencyVitePlugin } from "./src/admin/lib/patch-region-create-currency-vite"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  plugins: [
    {
      resolve: "@medusajs/draft-order",
      options: {},
    },
  ],
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL,
    storefrontUrl:
      process.env.PLATFORM_URL ||
      process.env.STOREFRONT_URL ||
      "https://skrepay.com",
    vite: () => ({
      define: {
        "import.meta.env.VITE_PLATFORM_URL": JSON.stringify(
          process.env.PLATFORM_URL || "https://skrepay.com"
        ),
      },
      plugins: [
        patchAdminEntryVitePlugin(),
        patchRegionCreateCurrencyVitePlugin(),
        patchDraftOrderVitePlugin(),
      ],
    }),
  },
})
