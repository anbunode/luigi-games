import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Map } from "@medusajs/icons"
import { Container, Heading, Text, Button, Table, toast } from "@medusajs/ui"
import { Plus } from "@medusajs/icons"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RegionStatusBadge } from "../../../components/regions/RegionStatusBadge"
import { RegionCreateDrawer } from "../../../components/regions/RegionCreateDrawer"
import { fetchRegions } from "../../../lib/regions-api"
import type { SkrepayRegion } from "../../../lib/regions-api"

function getFlagEmoji(iso2: string) {
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

function RegionsPage() {
  const [regions, setRegions] = useState<SkrepayRegion[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchRegions()
      setRegions(data.regions || [])
    } catch (err: any) {
      toast.error(err.message || "Error al cargar las regiones")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border-base">
          <div>
            <Heading level="h1" className="text-ui-fg-base">
              Regiones
            </Heading>
            <Text size="small" className="text-ui-fg-subtle mt-0.5">
              Gestiona los mercados geográficos de tu tienda y sus configuraciones.
            </Text>
          </div>
          <Button size="small" onClick={() => setDrawerOpen(true)}>
            <Plus />
            Crear Región
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="px-6 py-8 text-center">
            <Text className="text-ui-fg-muted">Cargando regiones...</Text>
          </div>
        ) : regions.length === 0 ? (
          <div className="px-6 py-12 text-center flex flex-col items-center gap-y-3">
            <Map className="w-8 h-8 text-ui-fg-muted" />
            <Text className="text-ui-fg-muted">
              Aún no tienes regiones. Crea la primera para comenzar.
            </Text>
            <Button size="small" variant="secondary" onClick={() => setDrawerOpen(true)}>
              <Plus />
              Crear Región
            </Button>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Nombre</Table.HeaderCell>
                <Table.HeaderCell>Estado</Table.HeaderCell>
                <Table.HeaderCell>Países</Table.HeaderCell>
                <Table.HeaderCell>Monedas</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {regions.map((region) => (
                <Table.Row
                  key={region.id}
                  className="cursor-pointer hover:bg-ui-bg-subtle"
                  onClick={() =>
                    navigate(`/settings/regions/${region.id}`)
                  }
                >
                  <Table.Cell className="font-medium text-ui-fg-base">
                    {region.name}
                  </Table.Cell>
                  <Table.Cell>
                    <RegionStatusBadge status={region.status} />
                  </Table.Cell>
                  <Table.Cell>
                    {region.countries?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {region.countries.slice(0, 5).map((c) => (
                          <span
                            key={c.iso_2}
                            title={c.display_name}
                            className="text-sm"
                          >
                            {getFlagEmoji(c.iso_2)}
                          </span>
                        ))}
                        {region.countries.length > 5 && (
                          <span className="text-xs text-ui-fg-muted">
                            +{region.countries.length - 5}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-ui-fg-muted text-xs">Sin países</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {region.currencies?.length > 0 ? (
                      <span className="text-xs text-ui-fg-base">
                        {region.currencies.map((c) => c.currency_code).join(", ")}
                      </span>
                    ) : (
                      <span className="text-ui-fg-muted text-xs">Sin moneda</span>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>

      <RegionCreateDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={() => {
          setDrawerOpen(false)
          load()
        }}
      />
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Regiones",
  icon: Map,
})

export default RegionsPage
