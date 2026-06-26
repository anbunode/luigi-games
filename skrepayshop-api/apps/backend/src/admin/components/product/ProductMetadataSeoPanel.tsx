import { Button, Container, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { loadStoreConfig } from "../../lib/store-config"
import {
  buildMetadataPayload,
  splitMetadata,
  type MetadataRow,
} from "../../lib/product-metadata"
import { GoogleSeoPreview } from "./GoogleSeoPreview"
import { MetadataKeyValueEditor } from "./MetadataKeyValueEditor"
import { SectionBlock } from "./SectionBlock"
import { SeoFields } from "./SeoFields"

type ProductMetadataSeoPanelProps = {
  product: {
    id: string
    title: string
    handle?: string | null
    metadata?: Record<string, unknown> | null
  }
}

async function saveProductMetadata(
  productId: string,
  metadata: Record<string, string>
) {
  const response = await fetch(`/admin/products/${productId}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ metadata }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message =
      errorData?.message || errorData?.type || "No se pudo guardar el producto"
    throw new Error(message)
  }

  return response.json()
}

export function ProductMetadataSeoPanel({
  product,
}: ProductMetadataSeoPanelProps) {
  const [customRows, setCustomRows] = useState<MetadataRow[]>([])
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [storefrontBaseUrl, setStorefrontBaseUrl] = useState<string | null>(
    null
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const parsed = splitMetadata(product.metadata)
    setCustomRows(parsed.customRows)
    setSeoTitle(parsed.seoTitle)
    setSeoDescription(parsed.seoDescription)
  }, [product.id, product.metadata])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const config = await loadStoreConfig()

        if (active) {
          setStorefrontBaseUrl(config.resolvedStorefrontBaseUrl)
        }
      } catch {
        if (active) {
          setStorefrontBaseUrl(
            typeof window !== "undefined"
              ? `https://${window.location.hostname}`
              : ""
          )
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const save = async () => {
    setSaving(true)

    try {
      const metadata = buildMetadataPayload(
        customRows,
        seoTitle,
        seoDescription
      )
      await saveProductMetadata(product.id, metadata)
      toast.success("Metadatos y SEO guardados correctamente.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al guardar metadatos"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-4">
        <SectionBlock
          title="Metadatos personalizados"
          description="Agrega campos personalizados como pares clave/valor. Se guardan en metadata del producto."
        >
          <MetadataKeyValueEditor rows={customRows} onChange={setCustomRows} />
        </SectionBlock>

        <SectionBlock title="Optimización para motores de búsqueda (SEO)">
          <SeoFields
            title={seoTitle}
            description={seoDescription}
            onTitleChange={setSeoTitle}
            onDescriptionChange={setSeoDescription}
          />
          {storefrontBaseUrl ? (
            <GoogleSeoPreview
              title={seoTitle}
              description={seoDescription}
              productTitle={product.title}
              handle={product.handle}
              storefrontBaseUrl={storefrontBaseUrl}
            />
          ) : (
            <Text size="small" className="text-ui-fg-subtle">
              Cargando vista previa de la tienda...
            </Text>
          )}
        </SectionBlock>

        <Button
          type="button"
          variant="primary"
          className="w-fit"
          isLoading={saving}
          onClick={save}
        >
          Guardar metadatos y SEO
        </Button>
      </div>
    </Container>
  )
}
