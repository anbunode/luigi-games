import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Container, Heading, Text, Button, Input, Badge, Select, toast } from "@medusajs/ui"
import { Buildings, TagSolid, CurrencyDollar, ArrowRightMini, CheckCircleSolid, PencilSquare } from "@medusajs/icons"
import { fetchRegion, fetchCurrencies, updateRegion, AdminRegion, AdminCurrency } from "../../../../lib/regions-api"

function RegionDetailPage() {
  const { id } = useParams()
  const [region, setRegion] = useState<AdminRegion | null>(null)
  const [currencies, setCurrencies] = useState<AdminCurrency[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [currencyCode, setCurrencyCode] = useState("")

  useEffect(() => {
    if (!id) return

    Promise.all([
      fetchRegion(id),
      fetchCurrencies()
    ])
    .then(([regionData, currenciesData]) => {
      setRegion(regionData)
      setName(regionData.name)
      setCurrencyCode(regionData.currency_code)
      setCurrencies(currenciesData)
    })
    .catch((err) => {
      toast.error("Error", { description: err.message })
    })
    .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await updateRegion(id, {
        name,
        currency_code: currencyCode
      })
      setRegion(updated)
      toast.success("Mercado actualizado", { description: "Los cambios se guardaron correctamente." })
    } catch (err: any) {
      toast.error("Error", { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Text className="p-10 text-center text-ui-fg-subtle">Cargando...</Text>
  }

  if (!region) {
    return <Text className="p-10 text-center text-ui-fg-error">Mercado no encontrado.</Text>
  }

  const countriesText = region.countries?.length > 0 
    ? region.countries.map(c => c.display_name).join(", ") 
    : "Sin países configurados"

  return (
    <div className="flex flex-col gap-y-4 max-w-[1000px] mx-auto w-full pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-x-2">
          <Text size="small" className="text-ui-fg-subtle">
            <a href="/app/settings/regions" className="hover:text-ui-fg-base transition-colors">Mercados</a>
          </Text>
          <Text size="small" className="text-ui-fg-muted">›</Text>
          <Heading level="h2" className="flex items-center gap-x-2 text-ui-fg-base">
            <span className="text-ui-fg-muted">🌍</span> {region.name}
          </Heading>
          <Badge color="grey" size="small">Región</Badge>
          <Badge color="green" size="small">Activo</Badge>
        </div>
        <div className="flex gap-x-2">
          <Button variant="secondary" size="small">Más acciones</Button>
          <Button variant="primary" size="small" onClick={handleSave} isLoading={saving}>Guardar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        
        {/* Left Column */}
        <div className="flex flex-col gap-y-4">
          
          {/* General Box */}
          <Container className="p-6">
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <Text size="small" weight="plus" className="text-ui-fg-base">Nombre</Text>
                <div className="flex items-center gap-x-2">
                  <div className="flex-1">
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <Select value="activo">
                    <Select.Trigger className="w-[120px]">
                      <Select.Value placeholder="Activo" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="activo">Activo</Select.Item>
                      <Select.Item value="inactivo">Inactivo</Select.Item>
                    </Select.Content>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-y-2 mt-2">
                <Text size="small" weight="plus" className="text-ui-fg-base">Incluye</Text>
                <div className="border border-ui-border-base rounded-md p-3 flex items-center justify-between bg-ui-bg-subtle">
                  <Text size="small" className="text-ui-fg-base">{countriesText}</Text>
                  <PencilSquare className="text-ui-fg-muted cursor-pointer hover:text-ui-fg-base" />
                </div>
              </div>
            </div>
          </Container>

          {/* Personalizado / Heredado Box */}
          <Container className="p-0 overflow-hidden">
            <div className="p-6 border-b border-ui-border-base">
              <Heading level="h2" className="text-ui-fg-base font-semibold mb-1">Personalizado</Heading>
              <Text size="small" className="text-ui-fg-subtle">Crea configuraciones únicas para los clientes de este mercado</Text>
            </div>
            
            <div className="p-6 bg-ui-bg-base">
              <Heading level="h3" className="text-ui-fg-muted font-semibold text-xs uppercase tracking-wider mb-4">Heredado</Heading>
              
              <div className="flex flex-col gap-y-4">
                
                {/* Currency */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-x-2 w-1/3">
                    <CurrencyDollar className="text-ui-fg-muted" />
                    <Text size="small" weight="plus">Moneda</Text>
                  </div>
                  <div className="flex-1">
                    <Select value={currencyCode} onValueChange={setCurrencyCode}>
                      <Select.Trigger>
                        <Select.Value placeholder="Seleccionar moneda" />
                      </Select.Trigger>
                      <Select.Content>
                        {currencies.map(c => (
                          <Select.Item key={c.code} value={c.code}>
                            {c.name} ({c.code.toUpperCase()} {c.symbol})
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                </div>

                {/* Products */}
                <div className="flex items-center justify-between border-t border-ui-border-base pt-4">
                  <div className="flex items-center gap-x-2 w-1/3">
                    <TagSolid className="text-ui-fg-muted" />
                    <Text size="small" weight="plus">Catálogos</Text>
                  </div>
                  <div className="flex-1 flex items-center gap-x-2">
                    <Buildings className="text-ui-fg-muted w-4 h-4" />
                    <Text size="small" className="text-ui-fg-subtle flex-1">Todos los productos</Text>
                    <ArrowRightMini className="text-ui-fg-muted cursor-pointer hover:text-ui-fg-base" />
                  </div>
                </div>

                {/* Taxes */}
                <div className="flex items-center justify-between border-t border-ui-border-base pt-4">
                  <div className="flex items-center gap-x-2 w-1/3">
                    <span className="text-ui-fg-muted text-sm font-mono">%</span>
                    <Text size="small" weight="plus">Impuestos y aranceles</Text>
                  </div>
                  <div className="flex-1 flex items-center gap-x-2">
                    <Buildings className="text-ui-fg-muted w-4 h-4" />
                    <Text size="small" className="text-ui-fg-subtle flex-1">Recaudando impuesto sobre las ventas</Text>
                    <ArrowRightMini className="text-ui-fg-muted cursor-pointer hover:text-ui-fg-base" />
                  </div>
                </div>

              </div>
            </div>
          </Container>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-y-4">
          
          <Container className="p-6">
            <div className="bg-ui-bg-subtle rounded-md h-32 flex items-center justify-center mb-4 border border-ui-border-base border-dashed">
               <Text size="small" className="text-ui-fg-muted">Representación Visual</Text>
            </div>
            <Heading level="h3" className="text-ui-fg-base font-semibold mb-2">Mercado principal</Heading>
            <div className="border border-ui-border-base rounded-md p-3 flex items-center gap-x-2 bg-ui-bg-subtle">
              <Buildings className="text-ui-fg-muted" />
              <Text size="small" className="text-ui-fg-base">Predeterminado de la tienda</Text>
            </div>
          </Container>

          <div>
            <Text size="small" className="text-ui-fg-subtle mb-2">Más opciones de configuración para {region.name}</Text>
            
            <Container className="p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-ui-border-base hover:bg-ui-bg-subtle cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <Text size="small" weight="plus" className="text-ui-fg-base">Envío</Text>
                  <Text size="small" className="text-ui-fg-subtle">1 tarifa • Envío a {region.name}</Text>
                </div>
                <ArrowRightMini className="text-ui-fg-muted" />
              </div>
              <div className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <Text size="small" weight="plus" className="text-ui-fg-base">Privacidad del cliente</Text>
                  <Text size="small" className="text-ui-fg-subtle">Cookie banner, exclusión de uso compartido de datos</Text>
                </div>
                <ArrowRightMini className="text-ui-fg-muted" />
              </div>
            </Container>
          </div>

        </div>

      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Configuración de Mercado",
})

export default RegionDetailPage
