import { Text } from "@medusajs/ui"

type GoogleSeoPreviewProps = {
  title: string
  description: string
  productTitle: string
  handle?: string | null
  storefrontBaseUrl: string
}

export function GoogleSeoPreview({
  title,
  description,
  productTitle,
  handle,
  storefrontBaseUrl,
}: GoogleSeoPreviewProps) {
  const displayTitle = title.trim() || productTitle || "Título del producto"
  const displayDescription =
    description.trim() ||
    "Añade una meta descripción para ver cómo podría aparecer en Google."
  const baseUrl = storefrontBaseUrl.replace(/\/$/, "")
  const previewUrl = handle
    ? `${baseUrl}/products/${handle}`
    : `${baseUrl}/products/...`

  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
      <Text
        size="xsmall"
        className="text-ui-fg-subtle mb-2 uppercase tracking-wide"
      >
        Vista previa en Google
      </Text>
      <p className="truncate text-xl leading-snug text-[#1a0dab]">
        {displayTitle}
      </p>
      <p className="mt-0.5 truncate text-sm text-[#006621]">{previewUrl}</p>
      <p className="mt-1 line-clamp-2 text-sm text-[#545454]">
        {displayDescription}
      </p>
    </div>
  )
}
