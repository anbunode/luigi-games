import { useState } from "react"
import { Button, Input, Label, Select, Text, toast } from "@medusajs/ui"
import {
  CurrencyDollar,
  ReceiptPercent,
  ShoppingBag,
  Tag,
  Buildings,
  CreditCard,
} from "@medusajs/icons"
import { CountryConditionPicker } from "./CountryConditionPicker"
import { RegionConfigRow } from "./RegionConfigRow"
import { RegionStatusBadge } from "./RegionStatusBadge"
import { formatCurrencyLabel } from "../../lib/regions-api"
import type { CountryInput, CurrencyInput } from "../../lib/regions-api"

export type RegionFormValues = {
  name: string
  status: "active" | "draft"
  countries: CountryInput[]
  currencies: CurrencyInput[]
}

type Props = {
  title: string
  initial: RegionFormValues
  saving?: boolean
  onSubmit: (values: RegionFormValues) => Promise<void>
  onCancel: () => void
  deleteAction?: {
    label: string
    onDelete: () => Promise<void>
    loading?: boolean
  }
}

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "MXN", "BRL", "ARS", "CLP", "COP", "PEN", "VES"]

export function RegionEditorForm({
  title,
  initial,
  saving = false,
  onSubmit,
  onCancel,
  deleteAction,
}: Props) {
  const [name, setName] = useState(initial.name)
  const [status, setStatus] = useState(initial.status)
  const [countries, setCountries] = useState(initial.countries)
  const [currencies, setCurrencies] = useState(initial.currencies)

  const defaultCurrency =
    currencies.find((c) => c.is_default)?.currency_code ??
    currencies[0]?.currency_code ??
    "USD"

  const setDefaultCurrency = (code: string) => {
    const upper = code.toUpperCase()
    const exists = currencies.some((c) => c.currency_code.toUpperCase() === upper)
    if (exists) {
      setCurrencies(
        currencies.map((c) => ({
          ...c,
          is_default: c.currency_code.toUpperCase() === upper,
        }))
      )
    } else {
      setCurrencies([
        { currency_code: upper, is_default: true },
        ...currencies.map((c) => ({ ...c, is_default: false })),
      ])
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre de la región es requerido.")
      return
    }
    const payload: RegionFormValues = {
      name: name.trim(),
      status,
      countries,
      currencies: currencies.length
        ? currencies
        : [{ currency_code: defaultCurrency, is_default: true }],
    }
    await onSubmit(payload)
  }

  const comingSoon = (section: string) => {
    toast.info(`"${section}" estará disponible en el próximo sprint.`)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-y-4">
      <div className="flex items-center gap-x-2">
        <Text size="xlarge" weight="plus" className="text-ui-fg-base">
          {title}
        </Text>
        <RegionStatusBadge status={status} />
      </div>

      <div className="rounded-xl border border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest">
        <div className="grid grid-cols-1 gap-4 border-b border-ui-border-base p-5 md:grid-cols-[1fr_auto] md:items-end">
          <div className="flex flex-col gap-y-1.5">
            <Label htmlFor="region-name" size="small" weight="plus">
              Nombre
            </Label>
            <Input
              id="region-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
              placeholder="ej. Venezuela, Norteamérica"
            />
          </div>
          <div className="flex flex-col gap-y-1.5 md:w-40">
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

        <div className="border-b border-ui-border-base p-5">
          <Label size="small" weight="plus" className="mb-2 block">
            Incluye
          </Label>
          <CountryConditionPicker selected={countries} onChange={setCountries} />
        </div>

        <div className="p-5">
          <Text size="small" weight="plus" className="text-ui-fg-base">
            Personalizado
          </Text>
          <Text size="small" className="text-ui-fg-subtle mt-0.5 mb-4">
            Crea configuraciones únicas para los clientes de esta región
          </Text>

          <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase tracking-wide mb-2">
            Heredado
          </Text>

          <div className="mb-4 flex flex-col gap-y-1">
            <Label size="xsmall" className="text-ui-fg-subtle">
              Moneda predeterminada
            </Label>
            <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
              <Select.Trigger size="small">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {CURRENCY_OPTIONS.map((code) => (
                  <Select.Item key={code} value={code}>
                    {formatCurrencyLabel(code)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <RegionConfigRow
            icon={<CurrencyDollar className="h-4 w-4" />}
            label="Moneda"
            value={formatCurrencyLabel(defaultCurrency)}
            inherited={false}
          />
          <RegionConfigRow
            icon={<Tag className="h-4 w-4" />}
            label="Catálogos"
            value="Todos los productos"
            comingSoon
            onClick={() => comingSoon("Catálogos")}
          />
          <RegionConfigRow
            icon={<ReceiptPercent className="h-4 w-4" />}
            label="Descuentos"
            value="Todos los descuentos elegibles"
            comingSoon
            onClick={() => comingSoon("Descuentos")}
          />
          <RegionConfigRow
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Tienda online"
            value="Configuración de la tienda"
            comingSoon
            onClick={() => comingSoon("Tienda online")}
          />
          <RegionConfigRow
            icon={<Buildings className="h-4 w-4" />}
            label="Dominio / idioma"
            value="Predeterminado de la tienda"
            comingSoon
            onClick={() => comingSoon("Dominio / idioma")}
          />
          <RegionConfigRow
            icon={<CreditCard className="h-4 w-4" />}
            label="Pago y cuentas de clientes"
            value="Configuración de la tienda"
            comingSoon
            onClick={() => comingSoon("Pago y cuentas de clientes")}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pb-6">
        {deleteAction ? (
          <Button
            variant="danger"
            size="small"
            isLoading={deleteAction.loading}
            onClick={() => deleteAction.onDelete()}
          >
            {deleteAction.label}
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-x-2">
          <Button variant="secondary" size="small" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button size="small" isLoading={saving} onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}
