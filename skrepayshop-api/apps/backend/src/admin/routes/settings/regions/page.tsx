import { defineRouteConfig } from "@medusajs/admin-sdk"
import { GlobeEurope, MagnifyingGlass, Plus, XMark } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RegionCountriesCell } from "../../../components/regions/RegionCountriesCell"
import { RegionStatusBadge } from "../../../components/regions/RegionStatusBadge"
import {
  dismissSuggestion,
  getDismissedSuggestions,
  REGION_SUGGESTIONS,
  suggestionStillRelevant,
} from "../../../lib/region-countries"
import {
  createRegion,
  fetchRegions,
  regionCustomizationsSummary,
  type SkrepayRegion,
} from "../../../lib/regions-api"

function RegionsSettingsPage() {
  const navigate = useNavigate()
  const [regions, setRegions] = useState<SkrepayRegion[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [dismissed, setDismissed] = useState<string[]>(() =>
    getDismissedSuggestions()
  )
  const [creatingSuggestion, setCreatingSuggestion] = useState<string | null>(
    null
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchRegions()
      setRegions(data.regions ?? [])
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al cargar las regiones"
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const usedCountries = useMemo(() => {
    const set = new Set<string>()
    regions.forEach((r) =>
      r.countries?.forEach((c) => set.add(c.iso_2.toUpperCase()))
    )
    return set
  }, [regions])

  const suggestions = useMemo(
    () =>
      REGION_SUGGESTIONS.filter(
        (s) =>
          !dismissed.includes(s.id) && suggestionStillRelevant(s, usedCountries)
      ),
    [dismissed, usedCountries]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return regions
    return regions.filter((r) => {
      const inName = r.name.toLowerCase().includes(q)
      const inCountries = r.countries?.some((c) =>
        c.display_name.toLowerCase().includes(q)
      )
      return inName || inCountries
    })
  }, [query, regions])

  const handleCreateFromSuggestion = async (suggestionId: string) => {
    const suggestion = REGION_SUGGESTIONS.find((s) => s.id === suggestionId)
    if (!suggestion) return

    setCreatingSuggestion(suggestionId)
    try {
      const { region } = await createRegion({
        name: suggestion.name,
        status: suggestion.status,
        countries: suggestion.countries,
        currencies: suggestion.currencies,
      })
      toast.success(`Región "${region.name}" creada.`)
      navigate(`/settings/regions/${region.id}`)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo crear la región"
      )
    } finally {
      setCreatingSuggestion(null)
    }
  }

  const handleDismissSuggestion = (id: string) => {
    dismissSuggestion(id)
    setDismissed(getDismissedSuggestions())
  }

  return (
    <Container className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
        <div className="flex items-center gap-x-2">
          <GlobeEurope className="text-ui-fg-subtle" />
          <Heading level="h1">Regiones</Heading>
        </div>
        <Button
          size="small"
          onClick={() => navigate("/settings/regions/create")}
        >
          Crear región
        </Button>
      </div>

      <div className="border-b border-ui-border-base px-6 py-3">
        <div className="relative max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-fg-muted" />
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
        <div className="px-6 py-10 text-center">
          <Text className="text-ui-fg-muted">Cargando regiones...</Text>
        </div>
      ) : (
        <>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Región</Table.HeaderCell>
                <Table.HeaderCell>Estado</Table.HeaderCell>
                <Table.HeaderCell>Incluye</Table.HeaderCell>
                <Table.HeaderCell>Personalizaciones</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filtered.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={4}>
                    <div className="py-8 text-center">
                      <Text className="text-ui-fg-muted">
                        {regions.length === 0
                          ? "Aún no tienes regiones. Crea la primera o usa una sugerencia."
                          : "No hay regiones que coincidan con tu búsqueda."}
                      </Text>
                      {regions.length === 0 ? (
                        <Button
                          className="mt-3"
                          size="small"
                          variant="secondary"
                          onClick={() => navigate("/settings/regions/create")}
                        >
                          <Plus />
                          Crear región
                        </Button>
                      ) : null}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filtered.map((region) => (
                  <Table.Row
                    key={region.id}
                    className="cursor-pointer hover:bg-ui-bg-subtle"
                    onClick={() => navigate(`/settings/regions/${region.id}`)}
                  >
                    <Table.Cell>
                      <div className="flex items-center gap-x-2">
                        <GlobeEurope className="h-4 w-4 text-ui-fg-muted" />
                        <span className="font-medium text-ui-fg-base">
                          {region.name}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <RegionStatusBadge status={region.status} />
                    </Table.Cell>
                    <Table.Cell>
                      <RegionCountriesCell countries={region.countries ?? []} />
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="text-ui-fg-subtle">
                        {regionCustomizationsSummary(region)}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}

              {suggestions.map((suggestion) => (
                <Table.Row
                  key={suggestion.id}
                  className="bg-ui-tag-purple-bg hover:bg-ui-tag-purple-bg/80"
                >
                  <Table.Cell colSpan={4}>
                    <div className="flex items-center justify-between gap-x-4 py-0.5">
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-x-2 text-left text-sm text-ui-tag-purple-text"
                        disabled={creatingSuggestion === suggestion.id}
                        onClick={() => handleCreateFromSuggestion(suggestion.id)}
                      >
                        <span aria-hidden>✨</span>
                        <span>
                          Crear región {suggestion.label}
                        </span>
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="text-ui-fg-muted hover:text-ui-fg-base p-1"
                        onClick={() => handleDismissSuggestion(suggestion.id)}
                        aria-label="Descartar sugerencia"
                      >
                        <XMark className="h-4 w-4" />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          <div className="border-t border-ui-border-base px-6 py-4 text-center">
            <Text size="small" className="text-ui-fg-muted">
              Más información sobre regiones
            </Text>
          </div>
        </>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Regiones",
})

export default RegionsSettingsPage
