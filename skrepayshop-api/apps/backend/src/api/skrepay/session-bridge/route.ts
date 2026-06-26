import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPlatformLoginUrl } from "../../../lib/platform-url"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : ""

  if (!token) {
    res.status(302).setHeader("Location", getPlatformLoginUrl()).end()
    return
  }

  const port = process.env.PORT || "9000"
  const internalBase = `http://127.0.0.1:${port}`

  const sessionResponse = await fetch(`${internalBase}/auth/session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  const setCookieHeaders =
    typeof sessionResponse.headers.getSetCookie === "function"
      ? sessionResponse.headers.getSetCookie()
      : []

  for (const cookie of setCookieHeaders) {
    res.appendHeader("Set-Cookie", cookie)
  }

  const fallbackCookie = sessionResponse.headers.get("set-cookie")
  if (!setCookieHeaders.length && fallbackCookie) {
    res.appendHeader("Set-Cookie", fallbackCookie)
  }

  if (sessionResponse.ok) {
    res.status(302).setHeader("Location", "/app").end()
    return
  }

  res.status(302).setHeader("Location", getPlatformLoginUrl()).end()
}
