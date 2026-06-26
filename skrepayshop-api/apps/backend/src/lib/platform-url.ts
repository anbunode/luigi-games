export function getPlatformUrl(): string {
  const base = (
    process.env.PLATFORM_URL ||
    process.env.STOREFRONT_URL ||
    "https://skrepay.com"
  ).replace(/\/$/, "")

  return base.startsWith("http") ? base : `https://${base}`
}

export function getPlatformLoginUrl(): string {
  return `${getPlatformUrl()}/login`
}
