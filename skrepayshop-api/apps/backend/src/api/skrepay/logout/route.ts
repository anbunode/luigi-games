import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPlatformLoginUrl } from "../../../lib/platform-url"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.status(302).setHeader("Location", getPlatformLoginUrl()).end()
}
