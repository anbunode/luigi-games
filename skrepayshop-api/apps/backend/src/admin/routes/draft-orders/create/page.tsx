import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Select,
  Badge,
} from "@medusajs/ui"
import { Plus, PencilSquare } from "@medusajs/icons"

function CreateDraftOrderPage() {
  return (
    <div className="flex flex-col gap-y-4 max-w-[1000px] mx-auto w-full pb-10">
      <div className="flex items-center gap-x-2 pb-2">
        <Text size="small" className="text-ui-fg-subtle">
          <a href="/app/draft-orders" className="hover:text-ui-fg-base transition-colors">Borradores</a>
        </Text>
        <Text size="small" className="text-ui-fg-muted">›</Text>
        <Heading level="h2" className="text-ui-fg-base">Create order</Heading>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Left Column */}
        <div className="flex flex-col gap-y-4">
          
          {/* Productos Card */}
          <Container className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h2" className="text-ui-fg-base font-semibold">Productos</Heading>
              <div className="flex gap-x-2">
                <Button variant="secondary" size="small">
                  <Plus /> Agregar producto
                </Button>
                <Button variant="secondary" size="small">
                  <Plus /> Agregar artículo personalizado
                </Button>
              </div>
            </div>
          </Container>

          {/* Pago Card */}
          <Container className="p-0 overflow-hidden">
            <div className="p-6 pb-4">
              <Heading level="h2" className="text-ui-fg-base font-semibold mb-6">Pago</Heading>
              
              <div className="border border-ui-border-base rounded-lg p-4">
                <div className="flex flex-col gap-y-3">
                  <div className="flex justify-between items-center text-ui-fg-subtle">
                    <Text size="small">Subtotal</Text>
                    <Text size="small">$0,00</Text>
                  </div>
                  <div className="flex justify-between items-center text-ui-fg-subtle">
                    <Text size="small" className="text-blue-500 cursor-pointer hover:underline">Agregar descuento</Text>
                    <Text size="small">—</Text>
                    <Text size="small">$0,00</Text>
                  </div>
                  <div className="flex justify-between items-center text-ui-fg-subtle">
                    <Text size="small" className="text-blue-500 cursor-pointer hover:underline">Agregar envío o entrega</Text>
                    <Text size="small">—</Text>
                    <Text size="small">$0,00</Text>
                  </div>
                  <div className="flex justify-between items-center text-ui-fg-subtle">
                    <div className="flex items-center gap-x-1">
                      <Text size="small">Impuesto estimado</Text>
                      <span className="w-4 h-4 border border-ui-border-base rounded-full inline-flex items-center justify-center text-[10px] cursor-help font-mono">i</span>
                    </div>
                    <Text size="small" className="text-ui-fg-base font-semibold">No calculado</Text>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-ui-border-base">
                    <Text size="base" weight="plus" className="text-ui-fg-base">Total</Text>
                    <Text size="base" weight="plus" className="text-ui-fg-base">$0,00</Text>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-ui-bg-subtle px-6 py-4 border-t border-ui-border-base">
              <Text size="small" className="text-ui-fg-subtle">
                Agrega un producto para calcular el total y ver las opciones de pago
              </Text>
            </div>
          </Container>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-y-4">
          
          {/* Notas Card */}
          <Container className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h2" className="text-ui-fg-base font-semibold">Notas</Heading>
              <PencilSquare className="text-ui-fg-subtle cursor-pointer hover:text-ui-fg-base w-4 h-4" />
            </div>
            <Text size="small" className="text-ui-fg-subtle">Sin notas</Text>
          </Container>

          {/* Cliente Card */}
          <Container className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h2" className="text-ui-fg-base font-semibold">Cliente</Heading>
            </div>
            <Input 
              type="search" 
              placeholder="Buscar cliente..." 
            />
          </Container>

          {/* Mercados Card */}
          <Container className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h2" className="text-ui-fg-base font-semibold">Mercados</Heading>
            </div>
            <div className="mb-4">
              <Badge color="grey" size="small" className="bg-ui-bg-subtle">
                <span className="mr-1">🌍</span> Venezuela
              </Badge>
            </div>
            <Text size="small" weight="plus" className="text-ui-fg-base mb-2">Moneda</Text>
            <Select>
              <Select.Trigger>
                <Select.Value placeholder="Dólar estadounidense (USD $)" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="usd">Dólar estadounidense (USD $)</Select.Item>
                <Select.Item value="ves">Bolívar Soberano (VES)</Select.Item>
                <Select.Item value="eur">Euro (EUR €)</Select.Item>
              </Select.Content>
            </Select>
          </Container>

          {/* Etiquetas Card */}
          <Container className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h2" className="text-ui-fg-base font-semibold">Etiquetas</Heading>
              <PencilSquare className="text-ui-fg-subtle cursor-pointer hover:text-ui-fg-base w-4 h-4" />
            </div>
            <Input placeholder="Agregar etiquetas..." />
          </Container>

        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Crear pedido preliminar",
})

export default CreateDraftOrderPage
