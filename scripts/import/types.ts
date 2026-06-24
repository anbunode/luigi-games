/**
 * Future: scrape external stores → insert into Supabase scraped_products
 * → sync script creates/updates products in Medusa via Admin API.
 *
 * Usage (after configuring SUPABASE_SERVICE_ROLE_KEY):
 *   node scripts/scrape/.env
 *   node scripts/sync/scraped-to-medusa.mjs
 */

export type ScrapedProductRow = {
  external_id?: string
  source_store: string
  title: string
  description?: string
  handle?: string
  product_type?: string
  platform?: string
  region?: string
  price?: number
  original_price?: number
  currency?: string
  discount_percent?: number
  promo_label?: string
  image_url?: string
  source_url?: string
  genres?: string[]
  metadata?: Record<string, unknown>
}
