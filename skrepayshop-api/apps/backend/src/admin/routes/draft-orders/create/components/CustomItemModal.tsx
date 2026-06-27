import { useState } from "react"
import { Button, FocusModal, Heading, Input, Label, Text, Checkbox } from "@medusajs/ui"

type CustomItem = {
  title: string
  unit_price: number
  quantity: number
  is_taxable?: boolean
  is_physical?: boolean
  weight?: number
}

export function CustomItemModal({
  open,
  onOpenChange,
  onAddItem,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddItem: (item: CustomItem) => void
}) {
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState<string>("0.00")
  const [quantity, setQuantity] = useState<number>(1)
  const [isTaxable, setIsTaxable] = useState(true)
  const [isPhysical, setIsPhysical] = useState(true)
  const [weight, setWeight] = useState<string>("")

  const handleSave = () => {
    if (!title.trim()) return

    onAddItem({
      title: title.trim(),
      unit_price: parseFloat(price) || 0,
      quantity: quantity,
      is_taxable: isTaxable,
      is_physical: isPhysical,
      weight: weight ? parseFloat(weight) : undefined,
    })
    
    // Reset and close
    setTitle("")
    setPrice("0.00")
    setQuantity(1)
    setIsTaxable(true)
    setIsPhysical(true)
    setWeight("")
    onOpenChange(false)
  }

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <Button variant="primary" onClick={handleSave} disabled={!title.trim()}>
            Agregar artículo
          </Button>
        </FocusModal.Header>
        <FocusModal.Body className="flex flex-col items-center justify-start py-8">
          <div className="w-full max-w-lg flex flex-col gap-y-8">
            <Heading>Agregar artículo personalizado</Heading>

            <div className="flex flex-col gap-y-4">
              <div className="grid grid-cols-[1fr_120px_100px] gap-4">
                <div className="flex flex-col gap-y-2">
                  <Label>Nombre del artículo</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label>Precio</Label>
                  <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label>Cantidad</Label>
                  <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                </div>
              </div>

              <div className="flex items-center gap-x-2 mt-4">
                <Checkbox id="taxable" checked={isTaxable} onCheckedChange={(c) => setIsTaxable(!!c)} />
                <Label htmlFor="taxable" className="font-normal">El artículo está sujeto a impuestos</Label>
              </div>
              <div className="flex items-center gap-x-2">
                <Checkbox id="physical" checked={isPhysical} onCheckedChange={(c) => setIsPhysical(!!c)} />
                <Label htmlFor="physical" className="font-normal">El artículo es un producto físico</Label>
              </div>

              {isPhysical && (
                <div className="flex flex-col gap-y-2 mt-4 max-w-[200px]">
                  <Label>Peso del artículo (opcional)</Label>
                  <div className="flex items-center gap-x-2">
                    <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                    <Text size="small" className="text-ui-fg-subtle">kg</Text>
                  </div>
                  <Text size="xsmall" className="text-ui-fg-muted">Se utiliza para calcular tarifas de envío</Text>
                </div>
              )}
            </div>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
