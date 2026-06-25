export const platformConfig = {
  name: process.env.NEXT_PUBLIC_PLATFORM_NAME || "SkrepayShop",
  tagline:
    "La plataforma SaaS para lanzar, escalar y monetizar tiendas online con Medusa.",
  description:
    "SkrepayShop: ecosistema multi-tenant con panel, storefronts, apps y scrapers bajo suscripción.",
  platformUrl:
    process.env.NEXT_PUBLIC_PLATFORM_URL ||
    "https://strong-cascaron-2e0511.netlify.app",
  futureDomain:
    process.env.NEXT_PUBLIC_FUTURE_DOMAIN || "https://skrepay.com",
  adminUrl:
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    "https://luigi-games-api1.onrender.com/app",
  backendUrl:
    process.env.MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    "https://luigi-games-api1.onrender.com",
  demoStoreUrl:
    process.env.NEXT_PUBLIC_DEMO_STORE_URL ||
    "https://luigigame.com",
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
      "Cada comerciante es un tenant aislado. Un login SkrepayShop, múltiples tiendas, un panel.",
  },
  {
    title: "Apps y scrapers bajo suscripción",
    description:
      "Activa catálogos masivos, integraciones de pago y herramientas premium según tu plan.",
  },
  {
    title: "Storefront listo para vender",
    description:
      "Plantillas de alto impacto, tema editable y catálogo conectado al motor Medusa.",
  },
  {
    title: "Escala sin fricción",
    description:
      "De cascarón vacío a miles de productos con pipelines de importación automatizados.",
  },
] as const

export const plans = [
  {
    name: "Starter",
    price: "Gratis",
    description: "Para validar tu idea y montar tu primera tienda.",
    highlights: ["1 tienda", "Tema básico", "Hasta 50 productos"],
  },
  {
    name: "Growth",
    price: "€49/mes",
    description: "Para marcas que quieren crecer con apps y automatización.",
    highlights: ["3 tiendas", "Scrapers incluidos", "Apps de conversión"],
    featured: true,
  },
  {
    name: "Scale",
    price: "€149/mes",
    description:
      "Para operaciones serias con catálogo masivo y soporte prioritario.",
    highlights: ["Tiendas ilimitadas", "API completa", "Onboarding dedicado"],
  },
] as const
