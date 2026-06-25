export const siteConfig = {
  name: "Luigi Games",
  domain: "luigigame.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://luigigame.com",
  description:
    "Marketplace gaming para LATAM. Juegos, gift cards, software y más.",
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID || "luigi-games",
  platformName: "SkrepayShop",
  platformUrl:
    process.env.NEXT_PUBLIC_PLATFORM_URL ||
    "https://strong-cascaron-2e0511.netlify.app",
  platformLoginUrl: `${
    process.env.NEXT_PUBLIC_PLATFORM_URL ||
    "https://strong-cascaron-2e0511.netlify.app"
  }/login`,
} as const
