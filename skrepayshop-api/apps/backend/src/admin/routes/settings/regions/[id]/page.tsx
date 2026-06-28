import { ArrowLeft } from "@medusajs/icons"
import { Button, Container, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { RegionEditorForm } from "../../../../components/regions/RegionEditorForm"
import type { RegionFormValues } from "../../../../components/regions/RegionEditorForm"
import {
  deleteRegion,
  fetchRegion,
  updateRegion,
  type SkrepayRegion,
} from "../../../../lib/regions-api"

export default function RegionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [region, setRegion] = useState<SkrepayRegion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await fetchRegion(id)
      setRegion(data.region)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo cargar la región"
      )
      navigate("/settings/regions")
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    load()
  }, [load])

  const toFormValues = (r: SkrepayRegion): RegionFormValues => ({
    name: r.name,
    status: r.status,
    countries: r.countries ?? [],
    currencies:
      r.currencies?.length > 0
        ? r.currencies.map((c) => ({
            currency_code: c.currency_code.toUpperCase(),
            is_default: c.is_default,
          }))
        : [{ currency_code: (r.currency_code ?? "usd").toUpperCase(), is_default: true }],
  })

  const handleSubmit = async (values: RegionFormValues) => {
    if (!id) return
    setSaving(true)
    try {
      const { region: updated } = await updateRegion(id, values)
      setRegion(updated)
      toast.success("Región actualizada.")
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al guardar la región"
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !region) return
    if (
      !window.confirm(
        `¿Eliminar la región "${region.name}"? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }
    setDeleting(true)
    try {
      await deleteRegion(id)
      toast.success("Región eliminada.")
      navigate("/settings/regions")
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar la región"
      )
    } finally {
      setDeleting(false)
    }
  }

  if (loading || !region) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-muted">Cargando región...</Text>
      </Container>
    )
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
        key={region.updated_at ?? region.id}
        title={region.name}
        initial={toFormValues(region)}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/settings/regions")}
        deleteAction={{
          label: "Eliminar región",
          onDelete: handleDelete,
          loading: deleting,
        }}
      />
    </Container>
  )
}
