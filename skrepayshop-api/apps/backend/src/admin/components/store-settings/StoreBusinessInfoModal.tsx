import {
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  toast,
} from "@medusajs/ui"
import { MagnifyingGlass } from "@medusajs/icons"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { parseInternationalPhone } from "../../lib/phone-country-codes"
import {
  type StoreSettingsSnapshot,
  resolveCountryCode,
  updateStoreBusinessInfo,
} from "../../lib/store-settings-api"
import { StoreCountryFlagSelect } from "./StoreCountryFlagSelect"
import { StorePhoneInput } from "./StorePhoneInput"
import { StoreSettingsModalHeader } from "./StoreSettingsModalHeader"

const BUSINESS_TYPE_OPTIONS = [
  { value: "company", label: "Empresa" },
  { value: "individual", label: "Persona física" },
  { value: "other", label: "Otro" },
] as const

type StoreBusinessInfoModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  snapshot: StoreSettingsSnapshot
}

function readBusinessType(metadata: Record<string, unknown> | null | undefined) {
  const value = metadata?.business_type

  if (typeof value === "string" && value.trim()) {
    return value
  }

  return "company"
}

export function StoreBusinessInfoModal({
  open,
  onOpenChange,
  snapshot,
}: StoreBusinessInfoModalProps) {
  const queryClient = useQueryClient()
  const metadata = snapshot.store.metadata ?? {}
  const address = snapshot.location?.address
  const initialCountry =
    (metadata.business_country_code as string | undefined)?.toLowerCase() ??
    address?.country_code?.toLowerCase() ??
    resolveCountryCode(snapshot.location, snapshot.region) ??
    "us"

  const [businessType, setBusinessType] = useState(readBusinessType(metadata))
  const [businessCountry, setBusinessCountry] = useState(initialCountry)
  const [legalName, setLegalName] = useState(
    (metadata.business_name as string | undefined) ?? snapshot.store.name
  )
  const [alias, setAlias] = useState(
    (metadata.business_alias as string | undefined) ??
      (metadata.business_name as string | undefined) ??
      snapshot.store.name
  )
  const [address1, setAddress1] = useState(address?.address_1 ?? "")
  const [address2, setAddress2] = useState(address?.address_2 ?? "")
  const [city, setCity] = useState(address?.city ?? "")
  const [postalCode, setPostalCode] = useState(address?.postal_code ?? "")
  const [province, setProvince] = useState(address?.province ?? "")
  const [phone, setPhone] = useState(snapshot.phone ?? "")

  useEffect(() => {
    if (!open) {
      return
    }

    const nextMetadata = snapshot.store.metadata ?? {}
    const nextAddress = snapshot.location?.address
    const nextCountry =
      (nextMetadata.business_country_code as string | undefined)?.toLowerCase() ??
      nextAddress?.country_code?.toLowerCase() ??
      resolveCountryCode(snapshot.location, snapshot.region) ??
      "us"

    setBusinessType(readBusinessType(nextMetadata))
    setBusinessCountry(nextCountry)
    setLegalName(
      (nextMetadata.business_name as string | undefined) ?? snapshot.store.name
    )
    setAlias(
      (nextMetadata.business_alias as string | undefined) ??
        (nextMetadata.business_name as string | undefined) ??
        snapshot.store.name
    )
    setAddress1(nextAddress?.address_1 ?? "")
    setAddress2(nextAddress?.address_2 ?? "")
    setCity(nextAddress?.city ?? "")
    setPostalCode(nextAddress?.postal_code ?? "")
    setProvince(nextAddress?.province ?? "")
    setPhone(snapshot.phone ?? "")
  }, [open, snapshot])

  const phoneDefaultCountry =
    (metadata.phone_country_code as string | undefined)?.toLowerCase() ??
    parseInternationalPhone(snapshot.phone, initialCountry).countryCode

  const mutation = useMutation({
    mutationFn: () =>
      updateStoreBusinessInfo(
        snapshot.store.id,
        snapshot.store.default_location_id,
        snapshot.store.metadata,
        {
          business_type: businessType,
          business_name: legalName,
          business_alias: alias,
          business_country_code: businessCountry,
          phone,
          address_1: address1,
          address_2: address2,
          city,
          province,
          postal_code: postalCode,
        }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["skrepay", "store-settings", "snapshot"],
      })
      void queryClient.invalidateQueries({ queryKey: ["store"] })
      toast.success("Información comercial guardada")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la información comercial"
      )
    },
  })

  const canSave = legalName.trim().length > 0

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content className="!max-w-[720px]">
        <StoreSettingsModalHeader title="Editar información comercial" />
        <FocusModal.Body className="flex flex-col gap-y-4 p-6">
          <div className="overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base">
            <div className="border-b border-ui-border-base px-5 py-4">
              <Heading level="h3" className="txt-compact-medium-plus">
                Sobre tu empresa
              </Heading>
            </div>

            <div className="flex flex-col gap-y-4 px-5 py-4">
              <div className="flex flex-col gap-y-2">
                <Label>¿Qué tipo de empresa tienes?</Label>
                <div className="flex items-center gap-x-2">
                  <StoreCountryFlagSelect
                    value={businessCountry}
                    disabled={mutation.isPending}
                    onValueChange={setBusinessCountry}
                  />
                  <Select
                    value={businessType}
                    disabled={mutation.isPending}
                    onValueChange={setBusinessType}
                  >
                    <Select.Trigger className="flex-1">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {BUSINESS_TYPE_OPTIONS.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="business-legal-name">Razón social registrada</Label>
                <Input
                  id="business-legal-name"
                  value={legalName}
                  onChange={(event) => setLegalName(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="business-alias">Alias</Label>
                <Input
                  id="business-alias"
                  value={alias}
                  onChange={(event) => setAlias(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="business-address-line-1">Dirección comercial</Label>
                <div className="relative">
                  <MagnifyingGlass className="text-ui-fg-muted pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="business-address-line-1"
                    className="pl-9"
                    value={address1}
                    onChange={(event) => setAddress1(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="business-address-line-2">
                  Apartamento, local, etc.
                </Label>
                <Input
                  id="business-address-line-2"
                  value={address2}
                  onChange={(event) => setAddress2(event.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="business-city">Ciudad</Label>
                  <Input
                    id="business-city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="business-postal">Código postal</Label>
                  <Input
                    id="business-postal"
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="business-province">Región</Label>
                  <Input
                    id="business-province"
                    value={province}
                    onChange={(event) => setProvince(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="business-phone">Número de teléfono</Label>
                <StorePhoneInput
                  id="business-phone"
                  value={phone}
                  defaultCountryCode={phoneDefaultCountry}
                  disabled={mutation.isPending}
                  onChange={setPhone}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-x-2 pt-2">
            <Button
              type="button"
              size="small"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="small"
              disabled={!canSave || mutation.isPending}
              isLoading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Guardar
            </Button>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
