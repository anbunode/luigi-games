import draftOrderPlugin from "@medusajs/draft-order/admin"
import DraftOrdersListPage from "../components/draft-orders/draft-orders-list-page"

type DraftOrderRoute = {
  path?: string
  Component?: unknown
  children?: DraftOrderRoute[]
}

/**
 * El listado oficial lanza en error de API/filtros (`if (isError) throw error`)
 * y además pide customers/regions con throwOnError. Sustituimos solo ese componente.
 */
const routes = draftOrderPlugin.routeModule.routes.map((route: DraftOrderRoute) => {
  if (route.path !== "/draft-orders") {
    return route
  }

  return {
    ...route,
    Component: DraftOrdersListPage,
  }
})

const plugin = {
  ...draftOrderPlugin,
  routeModule: {
    ...draftOrderPlugin.routeModule,
    routes,
  },
}

export default plugin
