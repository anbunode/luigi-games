import { useState, useEffect } from "react"
import { Button, FocusModal, Heading, Input, Text, Checkbox } from "@medusajs/ui"
import { MagnifyingGlass } from "@medusajs/icons"
import { fetchProducts, AdminProduct, AdminProductVariant } from "../../../../lib/draft-orders-api"

export type SelectedProductItem = {
  variant_id: string
  title: string
  quantity: number
  unit_price: number
  thumbnail?: string | null
}

export function ProductSelectionModal({
  open,
  onOpenChange,
  onAddItems,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddItems: (items: SelectedProductItem[]) => void
}) {
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(false)
  
  // variant_id -> SelectedProductItem
  const [selectedVariants, setSelectedVariants] = useState<Record<string, SelectedProductItem>>({})

  useEffect(() => {
    if (!open) return
    
    let isMounted = true
    setLoading(true)
    const timer = setTimeout(() => {
      fetchProducts(query)
        .then((res) => {
          if (isMounted) setProducts(res)
        })
        .catch((err) => console.error(err))
        .finally(() => {
          if (isMounted) setLoading(false)
        })
    }, 300)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [query, open])

  const toggleVariant = (product: AdminProduct, variant: AdminProductVariant) => {
    setSelectedVariants((prev) => {
      const next = { ...prev }
      if (next[variant.id]) {
        delete next[variant.id]
      } else {
        next[variant.id] = {
          variant_id: variant.id,
          title: `${product.title} - ${variant.title}`,
          quantity: 1,
          unit_price: variant.prices?.[0]?.amount || 0,
          thumbnail: product.thumbnail,
        }
      }
      return next
    })
  }

  const handleSave = () => {
    onAddItems(Object.values(selectedVariants))
    setSelectedVariants({})
    setQuery("")
    onOpenChange(false)
  }

  const selectionCount = Object.keys(selectedVariants).length

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <FocusModal.Header>
          <Button variant="primary" onClick={handleSave} disabled={selectionCount === 0}>
            Agregar ({selectionCount})
          </Button>
        </FocusModal.Header>
        <FocusModal.Body className="flex flex-col items-center justify-start py-8">
          <div className="w-full max-w-2xl flex flex-col gap-y-6">
            <Heading>Seleccionar productos</Heading>

            <Input
              type="search"
              placeholder="Buscar productos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              // prepend={<MagnifyingGlass />}
            />

            <div className="flex flex-col gap-y-2 max-h-[500px] overflow-y-auto border border-ui-border-base rounded-lg p-2">
              {loading ? (
                <Text className="text-ui-fg-subtle p-4 text-center">Cargando...</Text>
              ) : products.length === 0 ? (
                <Text className="text-ui-fg-subtle p-4 text-center">No se encontraron productos</Text>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="flex flex-col gap-y-2 pb-4 border-b border-ui-border-base last:border-0 last:pb-0">
                    <div className="flex items-center gap-x-3 px-2 pt-2">
                      {product.thumbnail && (
                        <img src={product.thumbnail} alt={product.title} className="w-8 h-8 rounded object-cover border border-ui-border-base" />
                      )}
                      <Text weight="plus">{product.title}</Text>
                    </div>
                    
                    <div className="flex flex-col pl-10 pr-2 gap-y-1">
                      {product.variants.map((variant) => {
                        const isSelected = !!selectedVariants[variant.id]
                        return (
                          <div key={variant.id} className="flex items-center justify-between p-2 hover:bg-ui-bg-subtle rounded-md cursor-pointer" onClick={() => toggleVariant(product, variant)}>
                            <div className="flex items-center gap-x-3">
                              <Checkbox checked={isSelected} onCheckedChange={() => toggleVariant(product, variant)} />
                              <Text size="small">{variant.title}</Text>
                            </div>
                            <Text size="small" className="text-ui-fg-subtle">
                              {variant.sku && <span className="mr-4">SKU: {variant.sku}</span>}
                              {variant.prices?.[0]?.amount != null ? (variant.prices[0].amount / 100).toFixed(2) : "0.00"}
                            </Text>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
