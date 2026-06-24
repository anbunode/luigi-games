import { Link } from "react-router-dom"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Swatch } from "@medusajs/icons"
import { Button, Container, Heading, Text } from "@medusajs/ui"

const StorefrontThemeWidget = () => {
  return (
    <Container className="p-0">
      <div className="flex flex-col gap-3 rounded-lg border border-ui-border-base bg-ui-bg-base p-4">
        <div className="flex items-start gap-3">
          <div className="bg-ui-bg-subtle flex size-8 items-center justify-center rounded-md">
            <Swatch />
          </div>
          <div className="flex-1">
            <Heading level="h2" className="txt-compact-medium-plus">
              Apariencia de la tienda
            </Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Edita la página de inicio: banner, colores, textos y secciones
              visibles.
            </Text>
          </div>
        </div>
        <Button asChild variant="secondary" className="w-fit">
          <Link to="/storefront-theme">Abrir editor de tema</Link>
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default StorefrontThemeWidget
