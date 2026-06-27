import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Select,
  Badge,
} from "@medusajs/ui"
import { Plus, PencilSquare, Trash } from "@medusajs/icons"
import { 
  fetchRegions, 
  fetchCustomers, 
  AdminRegion, 
  AdminCustomer 
} from "../../../lib/draft-orders-api"
import { CustomItemModal } from "./components/CustomItemModal"
import { ProductSelectionModal, SelectedProductItem } from "./components/ProductSelectionModal"

type DraftOrderItem = {
  id: string // local id for list rendering
  title: string
  unit_price: number
  quantity: number
  variant_id?: string
  thumbnail?: string | null
}

function CreateDraftOrderPage() {
  const [regions, setRegions] = useState<AdminRegion[]>([])
  const [selectedRegionId, setSelectedRegionId] = useState<string>("")
  
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")

  const [items, setItems] = useState<DraftOrderItem[]>([])
  
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)

  // Fetch initial data
  useEffect(() => {
    fetchRegions().then((data) => {
      setRegions(data)
      if (data.length > 0 && !selectedRegionId) {
        setSelectedRegionId(data[0].id)
      }
    }).catch(console.error)
  }, [])

  // Customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(customerSearch).then(setCustomers).catch(console.error)
    }, 300)
    return () => clearTimeout(timer)
  }, [customerSearch])

  const selectedRegion = regions.find(r => r.id === selectedRegionId)
  const currencyCode = selectedRegion?.currency_code?.toUpperCase() || "USD"

  const handleAddProducts = (newItems: SelectedProductItem[]) => {
    const mapped = newItems.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      title: item.title,
      unit_price: item.unit_price / 100, // Assuming Medusa prices are in cents
      quantity: item.quantity,
      variant_id: item.variant_id,
      thumbnail: item.thumbnail
    }))
    setItems(prev => [...prev, ...mapped])
  }

  const handleAddCustomItem = (item: any) => {
    setItems(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      title: item.title,
      unit_price: item.unit_price,
      quantity: item.quantity,
    }])
  }

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const subtotal = items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0)

  return (
    <div className="flex flex-col gap-y-4 max-w-[1000px] mx-auto w-full pb-10">
      
      <ProductSelectionModal 
        open={showProductModal} 
        onOpenChange={setShowProductModal} 
        onAddItems={handleAddProducts} 
      />
      
      <CustomItemModal 
        open={showCustomModal} 
        onOpenChange={setShowCustomModal} 
        onAddItem={handleAddCustomItem} 
      />

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
                <Button variant="secondary" size="small" onClick={() => setShowProductModal(true)}>
                  <Plus /> Agregar producto
                </Button>
                <Button variant="secondary" size="small" onClick={() => setShowCustomModal(true)}>
                  <Plus /> Agregar artículo personalizado
                </Button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="flex flex-col gap-y-2 mt-6">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-ui-border-base last:border-0">
                    <div className="flex items-center gap-x-3">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="w-10 h-10 rounded border border-ui-border-base object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded border border-ui-border-base bg-ui-bg-subtle flex items-center justify-center">
                          <Text size="xsmall" className="text-ui-fg-muted">Img</Text>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <Text size="small" weight="plus">{item.title}</Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {new Intl.NumberFormat("es-ES", { style: "currency", currency: currencyCode }).format(item.unit_price)} x {item.quantity}
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center gap-x-4">
                      <Text size="small" weight="plus">
                        {new Intl.NumberFormat("es-ES", { style: "currency", currency: currencyCode }).format(item.unit_price * item.quantity)}
                      </Text>
                      <Button variant="transparent" size="small" onClick={() => handleRemoveItem(item.id)}>
                        <Trash className="text-ui-fg-muted hover:text-ui-fg-base" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Container>

          {/* Pago Card */}
          <Container className="p-0 overflow-hidden">
            <div className="p-6 pb-4">
              <Heading level="h2" className="text-ui-fg-base font-semibold mb-6">Pago</Heading>
              
              <div className="border border-ui-border-base rounded-lg p-4">
                <div className="flex flex-col gap-y-3">
                  <div className="flex justify-between items-center text-ui-fg-subtle">
                    <Text size="small">Subtotal</Text>
                    <Text size="small">
                      {new Intl.NumberFormat("es-ES", { style: "currency", currency: currencyCode }).format(subtotal)}
                    </Text>
                  </div>
                  <div className="flex justify-between items-center text-ui-fg-subtle">
                    <Text size="small" className="text-blue-500 cursor-pointer hover:underline">Agregar descuento</Text>
                    <Text size="small">—</Text>
                    <Text size="small">
                      {new Intl.NumberFormat("es-ES", { style: "currency", currency: currencyCode }).format(0)}
                    </Text>
                  </div>
                  <div className="flex justify-between items-center text-ui-fg-subtle">
                    <Text size="small" className="text-blue-500 cursor-pointer hover:underline">Agregar envío o entrega</Text>
                    <Text size="small">—</Text>
                    <Text size="small">
                      {new Intl.NumberFormat("es-ES", { style: "currency", currency: currencyCode }).format(0)}
                    </Text>
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
                    <Text size="base" weight="plus" className="text-ui-fg-base">
                      {new Intl.NumberFormat("es-ES", { style: "currency", currency: currencyCode }).format(subtotal)}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
            
            {items.length === 0 && (
              <div className="bg-ui-bg-subtle px-6 py-4 border-t border-ui-border-base">
                <Text size="small" className="text-ui-fg-subtle">
                  Agrega un producto para calcular el total y ver las opciones de pago
                </Text>
              </div>
            )}
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
            <div className="flex flex-col gap-y-2">
              <Input 
                type="search" 
                placeholder="Buscar cliente..." 
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {customers.length > 0 && customerSearch && (
                <div className="border border-ui-border-base rounded-lg p-2 max-h-[150px] overflow-y-auto">
                  {customers.map(c => (
                    <div 
                      key={c.id} 
                      className={`p-2 hover:bg-ui-bg-subtle cursor-pointer rounded-md flex flex-col ${selectedCustomerId === c.id ? 'bg-ui-bg-subtle' : ''}`}
                      onClick={() => {
                        setSelectedCustomerId(c.id)
                        setCustomerSearch(c.email) // populate search with email
                      }}
                    >
                      <Text size="small" weight="plus">{[c.first_name, c.last_name].filter(Boolean).join(" ") || "Sin nombre"}</Text>
                      <Text size="small" className="text-ui-fg-subtle">{c.email}</Text>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Container>

          {/* Mercados Card */}
          <Container className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading level="h2" className="text-ui-fg-base font-semibold">Mercados</Heading>
            </div>
            <div className="mb-4">
              <Badge color="grey" size="small" className="bg-ui-bg-subtle">
                <span className="mr-1">🌍</span> {selectedRegion?.name || "Seleccionando..."}
              </Badge>
            </div>
            <Text size="small" weight="plus" className="text-ui-fg-base mb-2">Moneda</Text>
            {regions.length > 0 ? (
              <Select value={selectedRegionId} onValueChange={setSelectedRegionId}>
                <Select.Trigger>
                  <Select.Value placeholder="Seleccionar mercado" />
                </Select.Trigger>
                <Select.Content>
                  {regions.map(r => (
                    <Select.Item key={r.id} value={r.id}>
                      {r.name} ({r.currency_code.toUpperCase()})
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            ) : (
              <Text size="small" className="text-ui-fg-subtle">Cargando mercados...</Text>
            )}
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
      
      {/* Save Draft Order Button */}
      <div className="flex justify-end pt-4">
        <Button variant="primary">
          Guardar como pedido preliminar
        </Button>
      </div>

    </div>
  )
}

export const config = defineRouteConfig({
  label: "Crear pedido preliminar",
})

export default CreateDraftOrderPage
