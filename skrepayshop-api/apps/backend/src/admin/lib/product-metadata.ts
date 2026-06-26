export const SEO_TITLE_KEY = "seo_title"
export const SEO_DESCRIPTION_KEY = "seo_description"
export const SEO_TITLE_MAX = 70
export const SEO_DESCRIPTION_MAX = 320

const RESERVED_KEYS = new Set([SEO_TITLE_KEY, SEO_DESCRIPTION_KEY])

export type MetadataRow = {
  id: string
  key: string
  value: string
}

export function createMetadataRow(
  key = "",
  value = ""
): MetadataRow {
  return {
    id: crypto.randomUUID(),
    key,
    value,
  }
}

export function splitMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  const raw = metadata ?? {}
  const seoTitle = String(raw[SEO_TITLE_KEY] ?? "")
  const seoDescription = String(raw[SEO_DESCRIPTION_KEY] ?? "")
  const customRows: MetadataRow[] = Object.entries(raw)
    .filter(([key]) => !RESERVED_KEYS.has(key))
    .map(([key, value]) =>
      createMetadataRow(key, value == null ? "" : String(value))
    )

  return { seoTitle, seoDescription, customRows }
}

export function buildMetadataPayload(
  customRows: MetadataRow[],
  seoTitle: string,
  seoDescription: string
): Record<string, string> {
  const payload: Record<string, string> = {}

  for (const row of customRows) {
    const key = row.key.trim()
    if (!key) {
      continue
    }
    payload[key] = row.value
  }

  payload[SEO_TITLE_KEY] = seoTitle.trim() ? seoTitle.trim() : ""
  payload[SEO_DESCRIPTION_KEY] = seoDescription.trim()
    ? seoDescription.trim()
    : ""

  return payload
}
