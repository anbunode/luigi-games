import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"
import { Container, Heading, Text, Button, Input, Table, Badge } from "@medusajs/ui"
import { Plus } from "@medusajs/icons"
import { fetchRegions, AdminRegion } from "../../../lib/regions-api"

function SettingsRegionsPage() {
  const [regions, setRegions] = useState<AdminRegion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchRegions()
      .then(setRegions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredRegions = regions.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.countries?.some(c => c.display_name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-y-4 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Heading level="h1" className="text-ui-fg-base">Markets</Heading>
        </div>
        <div className="flex gap-x-2">
          <Button variant="secondary" size="small">
            Vista de gráfico
          </Button>
          <Button variant="primary" size="small">
            <Plus /> Crear mercado
          </Button>
        </div>
      </div>

      <Container className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-ui-border-base">
          <Input 
            type="search" 
            placeholder="Buscar en todos los mercados"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Mercado</Table.HeaderCell>
              <Table.HeaderCell>Estado</Table.HeaderCell>
              <Table.HeaderCell>Incluye</Table.HeaderCell>
              <Table.HeaderCell>Personalizaciones</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-subtle py-10">
                  Cargando...
                </Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            ) : filteredRegions.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center text-ui-fg-subtle py-10">
                  No se encontraron mercados.
                </Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            ) : (
              filteredRegions.map((region) => (
                <Table.Row key={region.id} className="cursor-pointer hover:bg-ui-bg-subtle transition-colors">
                  <Table.Cell>
                    <a href={`/app/settings/regions/${region.id}`} className="flex items-center gap-x-2 text-ui-fg-base font-medium w-full h-full">
                      <span className="text-ui-fg-muted">🌍</span> {region.name}
                    </a>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="green">Activo</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {region.countries?.length > 0 ? (
                      <Text size="small" className="text-ui-fg-subtle truncate max-w-[200px]">
                        {region.countries.map(c => c.display_name).join(", ")}
                      </Text>
                    ) : (
                      <Text size="small" className="text-ui-fg-muted">Sin países</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-muted">—</Text>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>

        <div className="bg-ui-bg-subtle px-6 py-4 border-t border-ui-border-base text-center">
          <Text size="small" className="text-ui-fg-subtle cursor-pointer hover:underline">
            Más información sobre mercados
          </Text>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Mercados",
})

export default SettingsRegionsPage
