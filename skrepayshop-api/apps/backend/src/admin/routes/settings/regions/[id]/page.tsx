import { useCallback, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import {
  ArrowLeft,
  CurrencyDollar,
  ReceiptPercent,
  Truck,
  CreditCard,
} from "@medusajs/icons"
import { RegionStatusBadge } from "../../../../components/regions/RegionStatusBadge"
import { RegionConfigItem } from "../../../../components/regions/RegionConfigItem"
import { CountryMultiSelect } from "../../../../components/regions/CountryMultiSelect"
import { CurrencySelect } from "../../../../components/regions/CurrencySelect"
import { fetchRegion, updateRegion, deleteRegion } from "../../../../lib/regions-api"
import type { SkrepayRegion, CountryInput, CurrencyInput } from "../../../../lib/regions-api"

export default function RegionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [region, setRegion] = useState<SkrepayRegion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [status, setStatus] = useState<"active" | "draft">("draft")
  const [countries, setCountries] = useState<CountryInput[]>([])
  const [currencies, setCurrencies] = useState<CurrencyInput[]>([])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await fetchRegion(id)
      const r = data.region
      setRegion(r)
      setName(r.name)
      setStatus(r.status)
      setCountries(r.countries ?? [])
      setCurrencies(r.currencies ?? [])
    } catch (err: any) {
      toast.error(err.message || "No se pudo cargar la región.")
      navigate("/settings/regions")
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    if (!id || !name.trim()) {
      toast.error("El nombre de la región es requerido.")
      return
    }
    setSaving(true)
    try {
      const data = await updateRegion(id, {
        name: name.trim(),
        status,
        countries,
        currencies,
      })
      setRegion(data.region)
      toast.success("Región actualizada correctamente.")
    } catch (err: any) {
      toast.error(err.message || "Error al guardar la región.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!window.confirm(`¿Eliminar la región "${region?.name}"? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try {
      await deleteRegion(id)
      toast.success("Región eliminada.")
      navigate("/settings/regions")
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la región.")
    } finally {
      setDeleting(false)
    }
  }

  const comingSoonToast = (section: string) => {
    toast.info(`"${section}" estará disponible en el próximo sprint.`)
  }

  const defaultCurrency = currencies.find((c) => c.is_default)?.currency_code

  if (loading) {
    return (
      <div className="flex flex-col gap-y-4">
        <Container className="p-6">
          <Text className="text-ui-fg-muted">Cargando región...</Text>
        </Container>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-x-2">
        <Button
          variant="transparent"
          size="small"
          onClick={() => navigate("/settings/regions")}
          className="p-0 text-ui-fg-subtle hover:text-ui-fg-base"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Regiones
        </Button>
        <span className="text-ui-fg-muted">/</span>
        <span className="text-ui-fg-base text-sm font-medium">{region?.name}</span>
        {region && <RegionStatusBadge status={region.status} />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Left column: editable form ── */}
        <div className="lg:col-span-2 flex flex-col gap-y-4">

          {/* Identity card */}
          <Container className="p-6 flex flex-col gap-y-5">
            <div className="flex items-center justify-between">
              <Heading level="h2">Detalles</Heading>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-y-1.5">
              <Label htmlFor="region-name" size="small" weight="plus">
                Nombre de la región
              </Label>
              <Input
                id="region-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                size="small"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-y-1.5">
              <Label size="small" weight="plus">
                Estado
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "active" | "draft")}
              >
                <Select.Trigger size="small">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="active">Activo</Select.Item>
                  <Select.Item value="draft">Borrador</Select.Item>
                </Select.Content>
              </Select>
            </div>

            {/* Countries */}
            <div className="flex flex-col gap-y-1.5">
              <Label size="small" weight="plus">
                Países incluidos
              </Label>
              <CountryMultiSelect selected={countries} onChange={setCountries} />
            </div>
          </Container>

          {/* Currencies card */}
          <Container className="p-6 flex flex-col gap-y-4">
            <Heading level="h2">Monedas</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Agrega una o más monedas a esta región. La primera será la predeterminada para el checkout.
            </Text>
            <CurrencySelect selected={currencies} onChange={setCurrencies} />
          </Container>

          {/* Save / Delete actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="danger"
              size="small"
              onClick={handleDelete}
              isLoading={deleting}
            >
              Eliminar región
            </Button>
            <Button size="small" onClick={handleSave} isLoading={saving}>
              Guardar cambios
            </Button>
          </div>
        </div>

        {/* ── Right column: configuration items ── */}
        <div className="flex flex-col gap-y-4">
          <Container className="p-6 flex flex-col gap-y-1">
            <Heading level="h2" className="mb-3">
              Configuración
            </Heading>
            <Text size="xsmall" className="text-ui-fg-subtle mb-4">
              Configura el comportamiento de esta región en cada área de la tienda.
            </Text>

            <RegionConfigItem
              icon={<CurrencyDollar className="w-4 h-4" />}
              label="Moneda"
              value={defaultCurrency ? `${defaultCurrency} (predeterminada)` : "Sin moneda"}
            />

            <RegionConfigItem
              icon={<ReceiptPercent className="w-4 h-4" />}
              label="Impuestos y aranceles"
              value=""
              comingSoon
              onClick={() => comingSoonToast("Impuestos y aranceles")}
            />

            <RegionConfigItem
              icon={<Truck className="w-4 h-4" />}
              label="Envío"
              value=""
              comingSoon
              onClick={() => comingSoonToast("Envío")}
            />

            <RegionConfigItem
              icon={<CreditCard className="w-4 h-4" />}
              label="Pago y cuentas de clientes"
              value=""
              comingSoon
              onClick={() => comingSoonToast("Pago y cuentas de clientes")}
            />
          </Container>
        </div>
      </div>
    </div>
  )
}
