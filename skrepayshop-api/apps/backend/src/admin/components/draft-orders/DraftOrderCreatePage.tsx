import { Button, Input, Label, Select, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { DraftAddressFields } from "./DraftAddressFields"
import { DraftFormDivider, DraftFormRow } from "./DraftFormLayout"
import { DraftOrdersShell, DraftPanelCard } from "./DraftOrdersShell"
import {
  createDraftOrder,
  EMPTY_DRAFT_ADDRESS,
  fetchCustomerAddresses,
  fetchDraftRegions,
  fetchDraftSalesChannels,
  fetchDraftStoreDefaults,
  searchDraftCustomers,
  type DraftAddress,
  type DraftCustomer,
} from "../../lib/draft-orders-api"
import { installAuthBridge } from "../../lib/auth-bridge"

function validateAddress(address: DraftAddress, label: string) {
  const required: Array<keyof DraftAddress> = [
    "first_name",
    "last_name",
    "address_1",
    "city",
    "postal_code",
    "country_code",
  ]

  for (const key of required) {
    if (!String(address[key] ?? "").trim()) {
      return `Completa ${label}: falta ${key}`
    }
  }

  return null
}

export function DraftOrderCreatePage() {
  useLayoutEffect(() => {
    installAuthBridge()
  }, [])

  const queryClient = useQueryClient()
  const [regionId, setRegionId] = useState("")
  const [salesChannelId, setSalesChannelId] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [email, setEmail] = useState("")
  const [customerQuery, setCustomerQuery] = useState("")
  const [shippingAddress, setShippingAddress] =
    useState<DraftAddress>(EMPTY_DRAFT_ADDRESS)
  const [billingAddress, setBillingAddress] =
    useState<DraftAddress>(EMPTY_DRAFT_ADDRESS)
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [savedAddressId, setSavedAddressId] = useState("")

  const regionsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "regions"],
    queryFn: fetchDraftRegions,
    retry: 1,
  })

  const salesChannelsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "sales-channels"],
    queryFn: fetchDraftSalesChannels,
    retry: 1,
  })

  const defaultsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "store-defaults"],
    queryFn: fetchDraftStoreDefaults,
    retry: 1,
  })

  const customersQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "customers", customerQuery],
    queryFn: () => searchDraftCustomers(customerQuery),
    retry: 1,
  })

  const customerAddressesQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "customer-addresses", customerId],
    queryFn: () => fetchCustomerAddresses(customerId),
    enabled: Boolean(customerId),
    retry: 1,
  })

  const regions = regionsQuery.data ?? []
  const salesChannels = salesChannelsQuery.data ?? []
  const customers = customersQuery.data ?? []
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId),
    [customers, customerId]
  )

  useEffect(() => {
    const defaults = defaultsQuery.data
    if (!defaults) return

    if (!regionId && defaults.default_region_id) {
      setRegionId(defaults.default_region_id)
    }
    if (!salesChannelId && defaults.default_sales_channel_id) {
      setSalesChannelId(defaults.default_sales_channel_id)
    }
  }, [defaultsQuery.data, regionId, salesChannelId])

  useEffect(() => {
    if (!regionId) return
    const region = regions.find((entry) => entry.id === regionId)
    const country = region?.countries?.[0]?.iso_2?.toLowerCase()
    if (!country) return

    setShippingAddress((current) =>
      current.country_code ? current : { ...current, country_code: country }
    )
  }, [regionId, regions])

  useEffect(() => {
    if (!selectedCustomer) return
    setEmail(selectedCustomer.email)
    setShippingAddress((current) => ({
      ...current,
      first_name: current.first_name || selectedCustomer.first_name || "",
      last_name: current.last_name || selectedCustomer.last_name || "",
      phone: current.phone || selectedCustomer.phone || "",
    }))
    setSavedAddressId("")
  }, [selectedCustomer])

  useEffect(() => {
    if (!savedAddressId) return
    const address = customerAddressesQuery.data?.find(
      (entry) => entry.id === savedAddressId
    )
    if (!address) return

    setShippingAddress({
      first_name: address.first_name || selectedCustomer?.first_name || "",
      last_name: address.last_name || selectedCustomer?.last_name || "",
      company: address.company ?? "",
      address_1: address.address_1,
      address_2: address.address_2 ?? "",
      city: address.city,
      province: address.province ?? "",
      postal_code: address.postal_code,
      country_code: address.country_code,
      phone: address.phone ?? selectedCustomer?.phone ?? "",
    })
  }, [savedAddressId, customerAddressesQuery.data, selectedCustomer])

  const createMutation = useMutation({
    mutationFn: createDraftOrder,
    onSuccess: (draft) => {
      queryClient.invalidateQueries({ queryKey: ["skrepay", "draft-orders"] })
      toast.success("Borrador creado")
      window.location.href = `/app/draft-orders/${draft.id}`
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo crear el borrador")
    },
  })

  const onCustomerPick = (customer: DraftCustomer | null) => {
    if (!customer) {
      setCustomerId("")
      return
    }

    setCustomerId(customer.id)
    setEmail(customer.email)
  }

  return (
    <DraftOrdersShell
      title="Crear borrador"
      description="Arma un pedido manual con cliente, canal de ventas y direcciones, como en Medusa."
      actions={
        <Button size="small" variant="secondary" asChild>
          <a href="/app/draft-orders">Volver</a>
        </Button>
      }
    >
      <DraftPanelCard>
        <form
          className="mx-auto flex w-full max-w-[720px] flex-col gap-y-6 px-5 py-8"
          onSubmit={(event) => {
            event.preventDefault()

            if (!regionId) {
              toast.error("Selecciona una región")
              return
            }
            if (!salesChannelId) {
              toast.error("Selecciona un canal de ventas")
              return
            }
            if (!customerId && !email.trim()) {
              toast.error("Selecciona un cliente o escribe un correo")
              return
            }

            const shippingError = validateAddress(
              shippingAddress,
              "la dirección de envío"
            )
            if (shippingError) {
              toast.error(shippingError)
              return
            }

            if (!sameAsShipping) {
              const billingError = validateAddress(
                billingAddress,
                "la dirección de facturación"
              )
              if (billingError) {
                toast.error(billingError)
                return
              }
            }

            createMutation.mutate({
              region_id: regionId,
              sales_channel_id: salesChannelId,
              customer_id: customerId || undefined,
              email: customerId ? undefined : email.trim(),
              shipping_address: shippingAddress,
              billing_address: sameAsShipping ? null : billingAddress,
              same_as_shipping: sameAsShipping,
            })
          }}
        >
          <DraftFormRow label="Región" hint="Define moneda e impuestos del borrador">
            {regionsQuery.isLoading ? (
              <Text size="small" className="text-ui-fg-subtle">
                Cargando regiones…
              </Text>
            ) : (
              <Select value={regionId} onValueChange={setRegionId}>
                <Select.Trigger>
                  <Select.Value placeholder="Selecciona una región" />
                </Select.Trigger>
                <Select.Content>
                  {regions.map((region) => (
                    <Select.Item key={region.id} value={region.id}>
                      {region.name} ({region.currency_code?.toUpperCase()})
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            )}
          </DraftFormRow>

          <DraftFormDivider />

          <DraftFormRow
            label="Canal de ventas"
            hint="Canal donde se registrará el pedido"
          >
            {salesChannelsQuery.isLoading ? (
              <Text size="small" className="text-ui-fg-subtle">
                Cargando canales…
              </Text>
            ) : (
              <Select value={salesChannelId} onValueChange={setSalesChannelId}>
                <Select.Trigger>
                  <Select.Value placeholder="Selecciona un canal" />
                </Select.Trigger>
                <Select.Content>
                  {salesChannels.map((channel) => (
                    <Select.Item key={channel.id} value={channel.id}>
                      {channel.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            )}
          </DraftFormRow>

          <DraftFormDivider />

          <DraftFormRow
            label="Cliente"
            hint="Busca un cliente existente o deja el campo vacío para usar solo el correo"
          >
            <Input
              value={customerQuery}
              placeholder="Buscar por correo o nombre"
              onChange={(event) => setCustomerQuery(event.target.value)}
            />
            {customers.length ? (
              <div className="overflow-hidden rounded-lg border border-ui-border-base">
                {customers.map((customer) => {
                  const name = [customer.first_name, customer.last_name]
                    .filter(Boolean)
                    .join(" ")

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      className={`flex w-full flex-col items-start px-3 py-2 text-left hover:bg-ui-bg-base-hover ${
                        customerId === customer.id ? "bg-ui-bg-base-hover" : ""
                      }`}
                      onClick={() => onCustomerPick(customer)}
                    >
                      <Text size="small" weight="plus">
                        {customer.email}
                      </Text>
                      {name ? (
                        <Text size="small" className="text-ui-fg-subtle">
                          {name}
                        </Text>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ) : null}
            {customerId ? (
              <Button
                type="button"
                size="small"
                variant="secondary"
                onClick={() => onCustomerPick(null)}
              >
                Quitar cliente seleccionado
              </Button>
            ) : null}
          </DraftFormRow>

          <DraftFormDivider />

          <DraftFormRow
            label="Correo"
            hint={
              customerId
                ? "Se toma del cliente seleccionado"
                : "Correo para asociar al borrador si no hay cliente"
            }
          >
            <Input
              type="email"
              value={email}
              disabled={Boolean(customerId)}
              placeholder="cliente@ejemplo.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </DraftFormRow>

          <DraftFormDivider />

          {customerId && customerAddressesQuery.data?.length ? (
            <>
              <DraftFormRow
                label="Dirección guardada"
                hint="Usa una dirección del cliente si ya existe"
              >
                <Select
                  value={savedAddressId || "__manual__"}
                  onValueChange={(value) =>
                    setSavedAddressId(value === "__manual__" ? "" : value)
                  }
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Escribir dirección manualmente" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="__manual__">
                      Escribir manualmente
                    </Select.Item>
                    {customerAddressesQuery.data.map((address) => (
                      <Select.Item key={address.id} value={address.id}>
                        {[address.address_1, address.city, address.postal_code]
                          .filter(Boolean)
                          .join(", ")}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </DraftFormRow>
              <DraftFormDivider />
            </>
          ) : null}

          <DraftAddressFields
            title="Dirección de envío"
            hint="Dirección donde se enviará el pedido"
            value={shippingAddress}
            onChange={setShippingAddress}
          />

          <DraftFormDivider />

          <DraftAddressFields
            title="Dirección de facturación"
            hint="Dirección de facturación del pedido"
            value={billingAddress}
            onChange={setBillingAddress}
            showSameAsShipping
            sameAsShipping={sameAsShipping}
            onSameAsShippingChange={setSameAsShipping}
          />

          <div className="flex justify-end gap-2 border-t border-ui-border-base pt-4">
            <Button size="small" variant="secondary" asChild>
              <a href="/app/draft-orders">Cancelar</a>
            </Button>
            <Button size="small" type="submit" isLoading={createMutation.isPending}>
              Guardar borrador
            </Button>
          </div>
        </form>
      </DraftPanelCard>
    </DraftOrdersShell>
  )
}
