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
  TruckFast,
  CreditCard,
  GlobeEurope,
} from "@medusajs/icons"
import { RegionStatusBadge } from "../../../components/regions/RegionStatusBadge"
import { RegionConfigItem } from "../../../components/regions/RegionConfigItem"
import { CountryMultiSelect } from "../../../components/regions/CountryMultiSelect"
import { CurrencySelect } from "../../../components/regions/CurrencySelect"
import {
  deleteRegion,
  fetchRegion,
  formatCurrencyLabel,
  updateRegion,
} from "../../../lib/regions-api"
import type {
  SkrepayRegion,
  CountryInput,
  CurrencyInput,
} from "../../../lib/regions-api"

export default function RegionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [region, setRegion] = useState<SkrepayRegion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
      setCurrencies(
        (r.currencies ?? []).map((c) => ({
          currency_code: c.currency_code.toUpperCase(),
          is_default: c.is_default,
        }))
      )
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo cargar la región.")
      navigate("/regions")
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al guardar la región.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (
      !window.confirm(
        `¿Eliminar la región "${region?.name}"? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }
    setDeleting(true)
    try {
      await deleteRegion(id)
      toast.success("Región eliminada.")
      navigate("/regions")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar la región.")
    } finally {
      setDeleting(false)
    }
  }

  const comingSoonToast = (section: string) => {
    toast.info(`"${section}" estará disponible en el próximo sprint.`)
  }

  const defaultCurrency = currencies.find((c) => c.is_default)?.currency_code
  const currencySummary = defaultCurrency
    ? `${formatCurrencyLabel(defaultCurrency)} (predeterminada)`
    : "Sin moneda"

  if (loading) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-muted">Cargando región...</Text>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Button
            variant="transparent"
            size="small"
            onClick={() => navigate("/regions")}
            className="p-0 text-ui-fg-subtle hover:text-ui-fg-base"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Regiones
          </Button>
          <span className="text-ui-fg-muted">/</span>
          <GlobeEurope className="w-4 h-4 text-ui-fg-muted" />
          <span className="text-ui-fg-base text-sm font-medium">{region?.name}</span>
          {region ? <RegionStatusBadge status={region.status} /> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-y-4">
          <Container className="p-6 flex flex-col gap-y-5">
            <Heading level="h2">Detalles</Heading>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
              <div className="flex flex-col gap-y-1.5">
                <Label htmlFor="region-name" size="small" weight="plus">
                  Nombre
                </Label>
                <Input
                  id="region-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  size="small"
                />
              </div>
              <div className="flex flex-col gap-y-1.5 md:w-44">
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
            </div>

            <div className="flex flex-col gap-y-1.5">
              <Label size="small" weight="plus">
                Incluye
              </Label>
              <Text size="xsmall" className="text-ui-fg-subtle mb-1">
                Selecciona los países que forman parte de esta región.
              </Text>
              <CountryMultiSelect selected={countries} onChange={setCountries} />
            </div>
          </Container>

          <Container className="p-6 flex flex-col gap-y-4">
            <Heading level="h2">Monedas</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Asigna una o más monedas. La predeterminada se usa en checkout y precios.
            </Text>
            <CurrencySelect selected={currencies} onChange={setCurrencies} />
          </Container>

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

        <div className="flex flex-col gap-y-4">
          <Container className="p-6 flex flex-col gap-y-1">
            <Heading level="h2" className="mb-1">
              Configuración
            </Heading>
            <Text size="xsmall" className="text-ui-fg-subtle mb-4">
              Ajustes heredados de la región para impuestos, envíos y pagos.
            </Text>

            <RegionConfigItem
              icon={<CurrencyDollar className="w-4 h-4" />}
              label="Moneda"
              value={currencySummary}
            />

            <RegionConfigItem
              icon={<ReceiptPercent className="w-4 h-4" />}
              label="Impuestos y aranceles"
              value=""
              comingSoon
              onClick={() => comingSoonToast("Impuestos y aranceles")}
            />

            <RegionConfigItem
              icon={<TruckFast className="w-4 h-4" />}
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
