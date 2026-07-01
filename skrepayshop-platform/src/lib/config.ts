/**
 * URLs públicas de SkrepayShop (marca) vs orígenes técnicos (Render hasta DNS).
 *
 * - Lo que ve el usuario: skrepay.com, app.skrepay.com, {slug}.skrepay.shop
 * - Lo que usa el código hoy: MEDUSA_BACKEND_URL / ADMIN_ORIGIN (Render)
 */

const stripTrailingSlash = (url: string) => url.replace(/\/$/, "")

const adminOrigin = stripTrailingSlash(
  process.env.NEXT_PUBLIC_ADMIN_ORIGIN ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    process.env.MEDUSA_BACKEND_URL ||
    "https://api.skrepay.com"
)

export const skrepayUrls = {
  /** Lobby + login */
  platform:
    process.env.NEXT_PUBLIC_PLATFORM_URL || "https://skrepay.com",

  /** URL que mostramos al usuario (panel de comerciante) */
  panelDisplay:
    process.env.NEXT_PUBLIC_PANEL_URL ||
    `${adminOrigin}/app`,

  /** Origen real del admin Medusa (Render o api.skrepay.com con CNAME) */
  adminOrigin,

  /** Ruta del dashboard tras login */
  panelApp: `${adminOrigin}/app`,

  /** API Medusa para auth y datos */
  api:
    process.env.MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    adminOrigin,

  /** Dominio base para tiendas gratis */
  tenantStoreBase:
    process.env.NEXT_PUBLIC_TENANT_STORE_BASE || "skrepay.shop",

  /** Dominio base para links de pago rápido */
  paymentLinkBase:
    process.env.NEXT_PUBLIC_PAYMENT_LINK_BASE || "pay.skrepay.com",

  tenantStoreUrl(slug: string) {
    return `https://${slug}.${this.tenantStoreBase}`
  },

  paymentLinkUrl(tenantSlug: string, linkId: string) {
    return `https://${this.paymentLinkBase}/${tenantSlug}/${linkId}`
  },
} as const

export const platformConfig = {
  name: process.env.NEXT_PUBLIC_PLATFORM_NAME || "SkrepayShop",
  tagline:
    "La plataforma SaaS para lanzar, escalar y monetizar tiendas online con Medusa.",
  description:
    "SkrepayShop: ecosistema multi-tenant con panel, storefronts, apps y scrapers bajo suscripción.",
  platformUrl: skrepayUrls.platform,
  panelUrl: skrepayUrls.panelDisplay,
  adminUrl: skrepayUrls.panelApp,
  backendUrl: skrepayUrls.api,
  demoStoreUrl:
    process.env.NEXT_PUBLIC_DEMO_STORE_URL ||
    skrepayUrls.tenantStoreUrl("demo"),
  heroVideo:
    process.env.NEXT_PUBLIC_HERO_VIDEO_URL ||
    "https://cdn.coverr.co/videos/coverr-team-meeting-in-modern-office-9745/1080p.mp4",
  heroPoster:
    process.env.NEXT_PUBLIC_HERO_POSTER_URL ||
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1920&q=80",
} as const

export const navLinks = [
  { label: "Producto", href: "#producto" },
  { label: "Ecosistema", href: "#ecosistema" },
  { label: "Planes", href: "#planes" },
] as const

export const features = [
  {
    title: "Multi-tenant desde el día uno",
    description:
      "Cada comerciante recibe subdominio gratis, panel y opción de dominio propio.",
  },
  {
    title: "Links de pago al instante",
    description:
      "Describe qué vendes y el precio: generamos checkout sin crear producto manual.",
  },
  {
    title: "Storefront listo para vender",
    description:
      "Plantillas de alto impacto, tema editable y catálogo conectado al motor Medusa.",
  },
  {
    title: "Escala sin fricción",
    description:
      "De cascarón vacío a miles de productos con scrapers y apps por suscripción.",
  },
] as const

export const plans = [
  {
    name: "Starter",
    price: "Gratis",
    description: "Subdominio gratis + link de pago rápido.",
    highlights: [
      "tu-tienda.skrepay.shop",
      "1 link de pago",
      "Panel SkrepayShop",
    ],
  },
  {
    name: "Growth",
    price: "€49/mes",
    description: "Tienda completa, scrapers y dominio propio opcional.",
    highlights: ["Dominio propio", "Scrapers", "Apps de conversión"],
    featured: true,
  },
  {
    name: "Scale",
    price: "€149/mes",
    description: "Operación seria con catálogo masivo y API completa.",
    highlights: ["Tiendas ilimitadas", "Links de pago ilimitados", "Soporte prioritario"],
  },
] as const
