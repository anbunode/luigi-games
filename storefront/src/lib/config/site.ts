export const siteConfig = {
  name: "Luigi Games",
  domain: "luigigame.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://luigigame.com",
  description:
    "Marketplace gaming para LATAM. Juegos, gift cards, software y más.",
  tenantId: "luigi-games",
} as const
