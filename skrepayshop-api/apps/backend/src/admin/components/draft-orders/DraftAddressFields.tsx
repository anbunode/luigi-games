import { Input, Label, Switch, Text } from "@medusajs/ui"
import type { DraftAddress } from "../../lib/draft-orders-api"
import { DraftFormRow } from "./DraftFormLayout"
import { StoreCountrySelect } from "../store-settings/StoreCountrySelect"

type DraftAddressFieldsProps = {
  title: string
  hint: string
  value: DraftAddress
  onChange: (next: DraftAddress) => void
  disabled?: boolean
  showSameAsShipping?: boolean
  sameAsShipping?: boolean
  onSameAsShippingChange?: (value: boolean) => void
}

export function DraftAddressFields({
  title,
  hint,
  value,
  onChange,
  disabled = false,
  showSameAsShipping = false,
  sameAsShipping = true,
  onSameAsShippingChange,
}: DraftAddressFieldsProps) {
  const patch = (partial: Partial<DraftAddress>) => {
    onChange({ ...value, ...partial })
  }

  const fieldsDisabled = disabled || (showSameAsShipping && sameAsShipping)

  return (
    <DraftFormRow label={title} hint={hint}>
      {showSameAsShipping ? (
        <div className="grid grid-cols-[28px_1fr] items-start gap-3">
          <Switch
            size="small"
            checked={sameAsShipping}
            disabled={disabled}
            onCheckedChange={(checked) => onSameAsShippingChange?.(checked)}
          />
          <div>
            <Text size="small" weight="plus">
              Igual que la dirección de envío
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Usa la misma dirección para facturación y envío
            </Text>
          </div>
        </div>
      ) : null}

      {!fieldsDisabled ? (
        <div className="flex flex-col gap-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor={`${title}-first-name`}>Nombre</Label>
              <Input
                id={`${title}-first-name`}
                value={value.first_name}
                disabled={fieldsDisabled}
                onChange={(event) => patch({ first_name: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor={`${title}-last-name`}>Apellidos</Label>
              <Input
                id={`${title}-last-name`}
                value={value.last_name}
                disabled={fieldsDisabled}
                onChange={(event) => patch({ last_name: event.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor={`${title}-company`}>Empresa (opcional)</Label>
            <Input
              id={`${title}-company`}
              value={value.company ?? ""}
              disabled={fieldsDisabled}
              onChange={(event) => patch({ company: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor={`${title}-address-1`}>Dirección</Label>
            <Input
              id={`${title}-address-1`}
              value={value.address_1}
              disabled={fieldsDisabled}
              onChange={(event) => patch({ address_1: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor={`${title}-address-2`}>Apartamento, piso, etc.</Label>
            <Input
              id={`${title}-address-2`}
              value={value.address_2 ?? ""}
              disabled={fieldsDisabled}
              onChange={(event) => patch({ address_2: event.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor={`${title}-city`}>Ciudad</Label>
              <Input
                id={`${title}-city`}
                value={value.city}
                disabled={fieldsDisabled}
                onChange={(event) => patch({ city: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor={`${title}-postal`}>Código postal</Label>
              <Input
                id={`${title}-postal`}
                value={value.postal_code}
                disabled={fieldsDisabled}
                onChange={(event) => patch({ postal_code: event.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-y-2">
              <Label>Provincia / estado</Label>
              <Input
                value={value.province ?? ""}
                disabled={fieldsDisabled}
                onChange={(event) => patch({ province: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label>País</Label>
              <StoreCountrySelect
                value={value.country_code || "es"}
                disabled={fieldsDisabled}
                onValueChange={(country_code) => patch({ country_code })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor={`${title}-phone`}>Teléfono</Label>
            <Input
              id={`${title}-phone`}
              value={value.phone ?? ""}
              disabled={fieldsDisabled}
              onChange={(event) => patch({ phone: event.target.value })}
            />
          </div>
        </div>
      ) : null}
    </DraftFormRow>
  )
}
