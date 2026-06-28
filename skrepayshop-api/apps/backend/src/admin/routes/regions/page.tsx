import { defineRouteConfig } from "@medusajs/admin-sdk"
import { GlobeEurope, MagnifyingGlass, Plus } from "@medusajs/icons"
import { Button, Container, Heading, Input, Table, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RegionCreateDrawer } from "../../components/regions/RegionCreateDrawer"
import { RegionStatusBadge } from "../../components/regions/RegionStatusBadge"
import { fetchRegions } from "../../lib/regions-api"
import type { SkrepayRegion } from "../../lib/regions-api"

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
  const [query, setQuery] = useState("")
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchRegions()
      setRegions(data.regions || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al cargar las regiones")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return regions

    return regions.filter((region) => {
      const inName = region.name.toLowerCase().includes(q)
      const inCountries = region.countries?.some((c) =>
        c.display_name.toLowerCase().includes(q)
      )
      return inName || inCountries
    })
  }, [query, regions])

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border-base">
          <div className="flex items-start gap-x-3">
            <div className="mt-0.5 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-2">
              <GlobeEurope className="text-ui-fg-subtle" />
            </div>
            <div>
              <Heading level="h1" className="text-ui-fg-base">
                Regiones
              </Heading>
              <Text size="small" className="text-ui-fg-subtle mt-0.5">
                Administra las regiones geográficas de tu tienda, monedas e impuestos.
              </Text>
            </div>
          </div>
          <Button size="small" onClick={() => setDrawerOpen(true)}>
            <Plus />
            Crear Región
          </Button>
        </div>

        <div className="px-6 py-3 border-b border-ui-border-base bg-ui-bg-subtle">
          <div className="relative max-w-xl">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-fg-muted w-4 h-4" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en todas las regiones"
              size="small"
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center">
            <Text className="text-ui-fg-muted">Cargando regiones...</Text>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center flex flex-col items-center gap-y-3">
            <GlobeEurope className="w-8 h-8 text-ui-fg-muted" />
            <Text className="text-ui-fg-muted">
              {regions.length === 0
                ? "Aún no tienes regiones. Crea la primera para comenzar."
                : "No hay regiones que coincidan con tu búsqueda."}
            </Text>
            {regions.length === 0 ? (
              <Button size="small" variant="secondary" onClick={() => setDrawerOpen(true)}>
                <Plus />
                Crear Región
              </Button>
            ) : null}
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Región</Table.HeaderCell>
                <Table.HeaderCell>Estado</Table.HeaderCell>
                <Table.HeaderCell>Incluye</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filtered.map((region) => (
                <Table.Row
                  key={region.id}
                  className="cursor-pointer hover:bg-ui-bg-subtle"
                  onClick={() => navigate(`/regions/${region.id}`)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-x-2">
                      <GlobeEurope className="text-ui-fg-muted w-4 h-4" />
                      <span className="font-medium text-ui-fg-base">{region.name}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <RegionStatusBadge status={region.status} />
                  </Table.Cell>
                  <Table.Cell>
                    {region.countries?.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {region.countries.slice(0, 4).map((c) => (
                          <span
                            key={c.iso_2}
                            title={c.display_name}
                            className="inline-flex items-center gap-x-1 text-sm text-ui-fg-base"
                          >
                            <span>{getFlagEmoji(c.iso_2)}</span>
                            <span>{c.display_name}</span>
                          </span>
                        ))}
                        {region.countries.length > 4 ? (
                          <span className="text-xs text-ui-fg-muted">
                            +{region.countries.length - 4}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-ui-fg-muted text-xs">Sin países</span>
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
  icon: GlobeEurope,
})

export default RegionsPage
