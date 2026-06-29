import draftOrderPlugin from "@medusajs/draft-order/admin"

type DraftOrderRoute = {
  path?: string
  children?: DraftOrderRoute[]
}

/**
 * El plugin oficial registra una lista rota en /draft-orders y un ítem "Drafts" duplicado.
 * Mantenemos solo create + detalle; la lista la sirve src/admin/routes/draft-orders/page.tsx.
 */
const listRoute = draftOrderPlugin.routeModule.routes.find(
  (route: DraftOrderRoute) => route.path === "/draft-orders"
)

const createRoute = listRoute?.children?.find(
  (child: DraftOrderRoute) => child.path === "/draft-orders/create"
)

const routes = [
  ...draftOrderPlugin.routeModule.routes.filter(
    (route: DraftOrderRoute) => route.path !== "/draft-orders"
  ),
  ...(createRoute ? [createRoute] : []),
]

const plugin = {
  ...draftOrderPlugin,
  routeModule: {
    ...draftOrderPlugin.routeModule,
    routes,
  },
  menuItemModule: {
    menuItems: [],
  },
}

export default plugin
