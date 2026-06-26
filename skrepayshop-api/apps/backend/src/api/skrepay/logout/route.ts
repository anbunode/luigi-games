import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const platformLoginUrl = () => {
  const base = (process.env.PLATFORM_URL || "https://skrepay.com").replace(
    /\/$/,
    ""
  )
  return `${base}/login`
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.status(302).setHeader("Location", platformLoginUrl()).end()
}
