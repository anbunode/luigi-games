import { model } from "@medusajs/framework/utils"

const StorefrontTheme = model.define("storefront_theme", {
  id: model.id().primaryKey(),
  store_name: model.text(),
  accent_color: model.text(),
  hero_title: model.text(),
  hero_subtitle: model.text(),
  hero_badge: model.text(),
  hero_cta_label: model.text(),
  hero_cta_url: model.text(),
  main_banner_image_url: model.text(),
  main_banner_product_handle: model.text(),
  promo_title: model.text(),
  promo_cta_label: model.text(),
  promo_cta_url: model.text(),
  show_promo_banner: model.boolean(),
  show_bestsellers: model.boolean(),
  show_featured_deals: model.boolean(),
  show_hero_carousel: model.boolean(),
  show_category_pills: model.boolean(),
  show_product_list: model.boolean(),
  show_genre_grid: model.boolean(),
  storefront_preview_url: model.text(),
  tenant_id: model.text().nullable(),
})

export default StorefrontTheme
