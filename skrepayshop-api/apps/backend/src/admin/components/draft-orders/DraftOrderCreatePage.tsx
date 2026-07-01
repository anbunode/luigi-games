import { Button, Input, Label, Select, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLayoutEffect, useState } from "react"
import { DraftOrdersShell, DraftPanelCard } from "./DraftOrdersShell"
import { createDraftOrder, fetchDraftRegions } from "../../lib/draft-orders-api"
import { installAuthBridge } from "../../lib/auth-bridge"

export function DraftOrderCreatePage() {
  useLayoutEffect(() => {
    installAuthBridge()
  }, [])

  const queryClient = useQueryClient()
  const [email, setEmail] = useState("")
  const [regionId, setRegionId] = useState("")

  const regionsQuery = useQuery({
    queryKey: ["skrepay", "draft-orders", "regions"],
    queryFn: fetchDraftRegions,
    retry: 1,
  })

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

  const regions = regionsQuery.data ?? []

  return (
    <DraftOrdersShell
      title="Crear borrador"
      description="Define el correo y la región. Luego podrás añadir productos."
      actions={
        <Button size="small" variant="secondary" asChild>
          <a href="/app/draft-orders">Volver</a>
        </Button>
      }
    >
      <DraftPanelCard>
        <form
          className="flex flex-col gap-4 px-5 py-6"
          onSubmit={(event) => {
            event.preventDefault()

            if (!email.trim() || !regionId) {
              toast.error("Completa correo y región")
              return
            }

            createMutation.mutate({
              email: email.trim(),
              region_id: regionId,
            })
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="draft-email">Correo del cliente</Label>
            <Input
              id="draft-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="cliente@ejemplo.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="draft-region">Región</Label>
            {regionsQuery.isLoading ? (
              <Text size="small" className="text-ui-fg-subtle">
                Cargando regiones…
              </Text>
            ) : (
              <Select value={regionId} onValueChange={setRegionId}>
                <Select.Trigger id="draft-region">
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
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="small" variant="secondary" asChild>
              <a href="/app/draft-orders">Cancelar</a>
            </Button>
            <Button
              size="small"
              type="submit"
              isLoading={createMutation.isPending}
            >
              Crear borrador
            </Button>
          </div>
        </form>
      </DraftPanelCard>
    </DraftOrdersShell>
  )
}
