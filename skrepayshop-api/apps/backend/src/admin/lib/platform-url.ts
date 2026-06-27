const defaultPlatformUrl = "https://skrepay.com"

export function getPlatformUrl(): string {
  // @ts-ignore
  const fromEnv = import.meta.env.VITE_PLATFORM_URL as string | undefined
  const base = (fromEnv || defaultPlatformUrl).replace(/\/$/, "")
  return base.startsWith("http") ? base : `https://${base}`
}

export function getPlatformLoginUrl(): string {
  return `${getPlatformUrl()}/login`
}
