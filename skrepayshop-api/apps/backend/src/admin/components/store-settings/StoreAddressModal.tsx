import { Button, FocusModal, Input, Label, toast } from "@medusajs/ui"
import { MagnifyingGlass } from "@medusajs/icons"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { StoreCountrySelect } from "./StoreCountrySelect"
import { StoreSettingsModalHeader } from "./StoreSettingsModalHeader"
import {
  type StoreSettingsSnapshot,
  updateStoreLocationAddress,
} from "../../lib/store-settings-api"

type StoreAddressModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  snapshot: StoreSettingsSnapshot
}

export function StoreAddressModal({
  open,
  onOpenChange,
  snapshot,
}: StoreAddressModalProps) {
  const queryClient = useQueryClient()
  const address = snapshot.location?.address
  const initialCountry =
    address?.country_code?.toLowerCase() ??
    snapshot.region?.countries?.[0]?.iso_2?.toLowerCase() ??
    "us"

  const [companyName, setCompanyName] = useState(snapshot.location?.name ?? "")
  const [countryCode, setCountryCode] = useState(initialCountry)
  const [address1, setAddress1] = useState(address?.address_1 ?? "")
  const [address2, setAddress2] = useState(address?.address_2 ?? "")
  const [city, setCity] = useState(address?.city ?? "")
  const [postalCode, setPostalCode] = useState(address?.postal_code ?? "")
  const [province, setProvince] = useState(address?.province ?? "")

  useEffect(() => {
    if (!open) {
      return
    }

    const nextAddress = snapshot.location?.address
    const nextCountry =
      nextAddress?.country_code?.toLowerCase() ??
      snapshot.region?.countries?.[0]?.iso_2?.toLowerCase() ??
      "us"

    setCompanyName(snapshot.location?.name ?? "")
    setCountryCode(nextCountry)
    setAddress1(nextAddress?.address_1 ?? "")
    setAddress2(nextAddress?.address_2 ?? "")
    setCity(nextAddress?.city ?? "")
    setPostalCode(nextAddress?.postal_code ?? "")
    setProvince(nextAddress?.province ?? "")
  }, [open, snapshot])

  const mutation = useMutation({
    mutationFn: () =>
      updateStoreLocationAddress(
        snapshot.store.id,
        snapshot.store.default_location_id,
        {
          companyName,
          address_1: address1,
          address_2: address2,
          city,
          province,
          postal_code: postalCode,
          country_code: countryCode,
        }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["skrepay", "store-settings", "snapshot"],
      })
      void queryClient.invalidateQueries({ queryKey: ["store"] })
      toast.success("Dirección de la tienda guardada")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la dirección de la tienda"
      )
    },
  })

  const canSave = address1.trim().length > 0 && city.trim().length > 0

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content className="!max-w-[720px]">
        <StoreSettingsModalHeader
          title="Editar dirección de la tienda"
          description="Tus clientes pueden ver esta información"
        />
        <FocusModal.Body className="flex flex-col gap-y-4 p-6">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="store-address-company">Nombre de la empresa</Label>
            <Input
              id="store-address-company"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="store-address-country">País o región</Label>
            <StoreCountrySelect
              value={countryCode}
              onValueChange={setCountryCode}
              disabled={mutation.isPending}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="store-address-line-1">Dirección</Label>
            <div className="relative">
              <MagnifyingGlass className="text-ui-fg-muted pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                id="store-address-line-1"
                className="pl-9"
                value={address1}
                onChange={(event) => setAddress1(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="store-address-line-2">
              Apartamento, local, etc.
            </Label>
            <Input
              id="store-address-line-2"
              value={address2}
              onChange={(event) => setAddress2(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="store-address-city">Ciudad</Label>
              <Input
                id="store-address-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="store-address-postal">Código postal</Label>
              <Input
                id="store-address-postal"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="store-address-province">Región</Label>
              <Input
                id="store-address-province"
                value={province}
                onChange={(event) => setProvince(event.target.value)}
              />
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
