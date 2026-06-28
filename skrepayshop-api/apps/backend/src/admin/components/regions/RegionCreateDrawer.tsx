import { useState } from "react"
import { Button, Drawer, Heading, Input, Label, Select, Text, toast } from "@medusajs/ui"
import { CountryMultiSelect } from "./CountryMultiSelect"
import { CurrencySelect } from "./CurrencySelect"
import { createRegion } from "../../lib/regions-api"
import type { CountryInput, CurrencyInput } from "../../lib/regions-api"

type Props = {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function RegionCreateDrawer({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("")
  const [status, setStatus] = useState<"active" | "draft">("draft")
  const [countries, setCountries] = useState<CountryInput[]>([])
  const [currencies, setCurrencies] = useState<CurrencyInput[]>([])
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setName("")
    setStatus("draft")
    setCountries([])
    setCurrencies([])
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre de la región es requerido.")
      return
    }

    setSaving(true)
    try {
      await createRegion({ name: name.trim(), status, countries, currencies })
      toast.success(`Región "${name.trim()}" creada correctamente.`)
      reset()
      onCreated()
    } catch (err: any) {
      toast.error(err.message || "Error al crear la región.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <Drawer.Content>
        <Drawer.Header>
          <Heading level="h2">Crear Región</Heading>
        </Drawer.Header>

        <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
          {/* Name */}
          <div className="flex flex-col gap-y-1.5">
            <Label htmlFor="region-name" size="small" weight="plus">
              Nombre de la región *
            </Label>
            <Input
              id="region-name"
              placeholder="ej: América Latina, Europa, Norteamérica"
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
            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "draft")}>
              <Select.Trigger size="small">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="active">Activo</Select.Item>
                <Select.Item value="draft">Borrador</Select.Item>
              </Select.Content>
            </Select>
            <Text size="xsmall" className="text-ui-fg-subtle">
              Las regiones en <strong>Borrador</strong> no afectan al checkout hasta activarse.
            </Text>
          </div>

          {/* Countries */}
          <div className="flex flex-col gap-y-1.5">
            <Label size="small" weight="plus">
              Países incluidos
            </Label>
            <CountryMultiSelect selected={countries} onChange={setCountries} />
            <Text size="xsmall" className="text-ui-fg-subtle">
              Puedes agregar múltiples países en una misma región.
            </Text>
          </div>

          {/* Currencies */}
          <div className="flex flex-col gap-y-1.5">
            <Label size="small" weight="plus">
              Monedas
            </Label>
            <CurrencySelect selected={currencies} onChange={setCurrencies} />
            <Text size="xsmall" className="text-ui-fg-subtle">
              La primera moneda seleccionada será la predeterminada.
            </Text>
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <div className="flex justify-end gap-x-2 w-full">
            <Button variant="secondary" size="small" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button size="small" onClick={handleSave} isLoading={saving}>
              Crear Región
            </Button>
          </div>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
