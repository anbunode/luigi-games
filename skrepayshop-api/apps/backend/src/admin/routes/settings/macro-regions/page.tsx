import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Table, DropdownMenu } from "@medusajs/ui"
import { EllipsisHorizontal, Plus } from "@medusajs/icons"
import { useEffect, useState } from "react"
import { sdk } from "../../../lib/config"

export default function MacroRegionsPage() {
  const [macroRegions, setMacroRegions] = useState<any[]>([])

  useEffect(() => {
    // Fetch macro regions using custom SDK client or fetch
    fetch("/admin/macro-regions", {
      headers: {
        "x-medusa-access-token": "..." // Not needed if we use sdk client or if we are in admin
      }
    })
      .then(res => res.json())
      .then(data => setMacroRegions(data.macro_regions || []))
      .catch(console.error)
  }, [])

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Heading level="h2" className="text-ui-fg-base font-semibold">Regiones Grupales (MacroRegiones)</Heading>
            <Text size="small" className="text-ui-fg-subtle">Agrupa Regiones Impositivas en MacroRegiones para usarlas en pedidos preliminares.</Text>
          </div>
          <Button variant="secondary" size="small">
            <Plus /> Crear MacroRegión
          </Button>
        </div>
        
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Nombre</Table.HeaderCell>
              <Table.HeaderCell>Regiones Nativas Asignadas</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Acciones</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {macroRegions.map((mr) => (
              <Table.Row key={mr.id}>
                <Table.Cell>{mr.name}</Table.Cell>
                <Table.Cell>{mr.regions?.map((r: any) => r.name).join(", ") || "-"}</Table.Cell>
                <Table.Cell className="text-right">
                  <DropdownMenu>
                    <DropdownMenu.Trigger asChild>
                      <Button variant="transparent" size="small">
                        <EllipsisHorizontal />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item>Editar</DropdownMenu.Item>
                      <DropdownMenu.Item>Eliminar</DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Regiones Grupales",
})
