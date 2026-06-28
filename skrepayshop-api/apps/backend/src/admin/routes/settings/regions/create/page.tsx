import { ArrowLeft } from "@medusajs/icons"
import { Button, Container, toast } from "@medusajs/ui"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { RegionEditorForm } from "../../../../components/regions/RegionEditorForm"
import type { RegionFormValues } from "../../../../components/regions/RegionEditorForm"
import type { RegionSuggestion } from "../../../../lib/region-countries"
import { createRegion } from "../../../../lib/regions-api"

type CreateLocationState = {
  prefill?: RegionSuggestion
}

export default function CreateRegionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as CreateLocationState
  const prefill = state.prefill

  const [saving, setSaving] = useState(false)

  const initial: RegionFormValues = {
    name: prefill?.name ?? "",
    status: prefill?.status ?? "active",
    countries: prefill?.countries ?? [],
    currencies: prefill?.currencies ?? [{ currency_code: "USD", is_default: true }],
  }

  const handleSubmit = async (values: RegionFormValues) => {
    setSaving(true)
    try {
      const { region } = await createRegion(values)
      toast.success(`Región "${region.name}" creada.`)
      navigate(`/settings/regions/${region.id}`)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo crear la región"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="p-6">
      <Button
        variant="transparent"
        size="small"
        className="mb-4 p-0 text-ui-fg-subtle hover:text-ui-fg-base"
        onClick={() => navigate("/settings/regions")}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Regiones
      </Button>

      <RegionEditorForm
        title="Nueva región"
        initial={initial}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/settings/regions")}
      />
    </Container>
  )
}
