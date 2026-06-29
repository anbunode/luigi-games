import { Button, Container, Heading, Input, Label, Select, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  createDraftOrder,
  fetchRegionsForDraft,
  fetchSalesChannelsForDraft,
} from "../../../../lib/draft-orders-api"

const NO_SALES_CHANNEL = "__none__"

const DraftOrderCreatePage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [regionId, setRegionId] = useState("")
  const [salesChannelId, setSalesChannelId] = useState(NO_SALES_CHANNEL)

  const regionsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "regions"],
    queryFn: fetchRegionsForDraft,
  })

  const channelsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "sales-channels"],
    queryFn: fetchSalesChannelsForDraft,
  })

  const createMutation = useMutation({
    mutationFn: createDraftOrder,
    onSuccess: (data) => {
      toast.success("Borrador creado")
      navigate(`../${data.draft_order.id}`)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear el borrador"
      )
    },
  })

  const regions = regionsQuery.data ?? []
  const channels = channelsQuery.data ?? []
  const isLoadingOptions = regionsQuery.isLoading || channelsQuery.isLoading
  const optionsError = regionsQuery.isError || channelsQuery.isError

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!regionId) {
      toast.error("Selecciona una región")
      return
    }

    if (!email.trim()) {
      toast.error("Indica el email del cliente")
      return
    }

    createMutation.mutate({
      region_id: regionId,
      email: email.trim(),
      ...(salesChannelId !== NO_SALES_CHANNEL
        ? { sales_channel_id: salesChannelId }
        : {}),
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Crear borrador</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Define región y cliente. Los productos se pueden añadir después.
          </Text>
        </div>
        <Button size="small" variant="secondary" asChild>
          <Link to="..">Volver</Link>
        </Button>
      </div>

      <form className="flex flex-col gap-6 px-6 py-8" onSubmit={handleSubmit}>
        {isLoadingOptions ? (
          <Text className="text-ui-fg-subtle">Cargando opciones…</Text>
        ) : optionsError ? (
          <Text className="text-ui-fg-error">
            No se pudieron cargar regiones o canales de venta.
          </Text>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="draft-region">Región</Label>
              <Select value={regionId} onValueChange={setRegionId}>
                <Select.Trigger id="draft-region">
                  <Select.Value placeholder="Seleccionar región" />
                </Select.Trigger>
                <Select.Content>
                  {regions.map((region) => (
                    <Select.Item key={region.id} value={region.id}>
                      {region.name}
                      {region.currency_code
                        ? ` (${region.currency_code.toUpperCase()})`
                        : ""}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="draft-email">Email del cliente</Label>
              <Input
                id="draft-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="cliente@ejemplo.com"
              />
            </div>

            {channels.length > 0 ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="draft-channel">Canal de venta (opcional)</Label>
                <Select
                  value={salesChannelId}
                  onValueChange={setSalesChannelId}
                >
                  <Select.Trigger id="draft-channel">
                    <Select.Value placeholder="Por defecto" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value={NO_SALES_CHANNEL}>Por defecto</Select.Item>
                    {channels.map((channel) => (
                      <Select.Item key={channel.id} value={channel.id}>
                        {channel.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            ) : null}
          </>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            size="small"
            isLoading={createMutation.isPending}
            disabled={isLoadingOptions || optionsError}
          >
            Crear borrador
          </Button>
          <Button size="small" variant="secondary" asChild>
            <Link to="..">Cancelar</Link>
          </Button>
        </div>
      </form>
    </Container>
  )
}

export default DraftOrderCreatePage
