import { defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/storefront-theme/banner-image",
      methods: ["POST"],
      bodyParser: false,
    },
  ],
})
