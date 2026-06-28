import { defineWidgetConfig } from "@medusajs/admin-sdk"

/**
 * Oculta secciones de la página /settings/store que no aplica a comerciantes SkrepayShop.
 * La lógica de monedas (API + store_currency) sigue activa para regiones y editar tienda.
 */
const hideStoreSectionsStyles = `
  .flex.flex-col.gap-y-3 > div:has(a[href="currencies"]) {
    display: none !important;
  }

  .flex.flex-col.gap-y-3 > div:has(a[href="metadata/edit"]) {
    display: none !important;
  }

  .flex.flex-col.gap-y-3 > div.flex.items-center.justify-between.px-6.py-4:has(h2) {
    display: none !important;
  }
`

const HideStoreSections = () => {
  return <style>{hideStoreSectionsStyles}</style>
}

export const config = defineWidgetConfig({
  zone: ["store.details.before", "store.details.after"],
})

export default HideStoreSections
