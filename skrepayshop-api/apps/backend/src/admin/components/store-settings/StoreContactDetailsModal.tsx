import { Button, FocusModal, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { parseInternationalPhone } from "../../lib/phone-country-codes"
import { StorePhoneInput } from "./StorePhoneInput"
import { StoreSettingsModalHeader } from "./StoreSettingsModalHeader"
import {
  type StoreSettingsSnapshot,
  updateStoreContactDetails,
} from "../../lib/store-settings-api"

type StoreContactDetailsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  snapshot: StoreSettingsSnapshot
}

export function StoreContactDetailsModal({
  open,
  onOpenChange,
  snapshot,
}: StoreContactDetailsModalProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(snapshot.store.name)
  const [contactEmail, setContactEmail] = useState(
    snapshot.contactEmail ?? snapshot.userEmail ?? ""
  )
  const [phone, setPhone] = useState(snapshot.phone ?? "")

  useEffect(() => {
    if (!open) {
      return
    }

    setName(snapshot.store.name)
    setContactEmail(snapshot.contactEmail ?? snapshot.userEmail ?? "")
    setPhone(snapshot.phone ?? "")
  }, [open, snapshot])

  const mutation = useMutation({
    mutationFn: () =>
      updateStoreContactDetails(snapshot.store.id, snapshot.store.metadata, {
        name,
        contact_email: contactEmail,
        phone,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["skrepay", "store-settings", "snapshot"],
      })
      void queryClient.invalidateQueries({ queryKey: ["store"] })
      toast.success("Detalles de contacto guardados")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los detalles de contacto"
      )
    },
  })

  const canSave = name.trim().length > 0

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content className="!max-w-[640px]">
        <StoreSettingsModalHeader title="Detalles de contacto de la tienda" />
        <FocusModal.Body className="flex flex-col gap-y-4 p-6">
          <div className="overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base">
            <div className="border-b border-ui-border-base px-5 py-4">
              <Heading level="h3" className="txt-compact-medium-plus">
                Nombre de la tienda
              </Heading>
            </div>
            <div className="flex flex-col gap-y-2 px-5 py-4">
              <Label htmlFor="store-contact-name">Nombre de la tienda</Label>
              <Input
                id="store-contact-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Text size="small" className="text-ui-fg-subtle">
                Se muestra en la tienda online
              </Text>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base">
            <div className="border-b border-ui-border-base px-5 py-4">
              <Heading level="h3" className="txt-compact-medium-plus">
                Detalles de contacto de la tienda
              </Heading>
            </div>
            <div className="flex flex-col gap-y-4 px-5 py-4">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="store-contact-email">
                  Correo electrónico de la tienda
                </Label>
                <Input
                  id="store-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
                <Text size="small" className="text-ui-fg-subtle">
                  Recibe mensajes sobre la tienda.
                </Text>
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="store-contact-phone">Teléfono de la tienda</Label>
                <StorePhoneInput
                  id="store-contact-phone"
                  value={phone}
                  defaultCountryCode={
                    (snapshot.store.metadata?.phone_country_code as string | undefined) ??
                    parseInternationalPhone(phone, "us").countryCode
                  }
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
