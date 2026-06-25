export type StorefrontThemeSettings = {
  store_name: string
  accent_color: string
  hero_title: string
  hero_subtitle: string
  hero_badge: string
  hero_cta_label: string
  hero_cta_url: string
  main_banner_image_url: string
  main_banner_product_handle: string
  promo_title: string
  promo_cta_label: string
  promo_cta_url: string
  show_promo_banner: boolean
  show_bestsellers: boolean
  show_featured_deals: boolean
  show_hero_carousel: boolean
  show_category_pills: boolean
  show_product_list: boolean
  show_genre_grid: boolean
  storefront_preview_url: string
}

export const DEFAULT_STOREFRONT_THEME: StorefrontThemeSettings = {
  store_name: "Mi Tienda",
  accent_color: "#10B981",
  hero_title: "Bienvenido a tu tienda",
  hero_subtitle: "Edita este banner desde el panel",
  hero_badge: "Productos de ejemplo",
  hero_cta_label: "Ver catálogo",
  hero_cta_url: "/search",
  main_banner_image_url: "",
  main_banner_product_handle: "producto-1",
  promo_title: "Sección promocional\nde ejemplo",
  promo_cta_label: "Explorar",
  promo_cta_url: "/search",
  show_promo_banner: true,
  show_bestsellers: true,
  show_featured_deals: true,
  show_hero_carousel: true,
  show_category_pills: true,
  show_product_list: true,
  show_genre_grid: true,
  storefront_preview_url: "https://luigigame.com",
}
