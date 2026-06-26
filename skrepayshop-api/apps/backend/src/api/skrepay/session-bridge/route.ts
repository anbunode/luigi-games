import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getAuthContextFromJwtToken } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getPlatformLoginUrl } from "../../../lib/platform-url"

type SessionRequest = MedusaRequest & {
  session: {
    auth_context?: Record<string, unknown>
    save: (callback: (error?: Error | null) => void) => void
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : ""

  if (!token) {
    res.status(302).setHeader("Location", getPlatformLoginUrl()).end()
    return
  }

  const { http } = req.scope
    .resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig

  const jwtSecret = http.jwtSecret

  if (!jwtSecret) {
    res.status(302).setHeader("Location", getPlatformLoginUrl()).end()
    return
  }

  const authContext = getAuthContextFromJwtToken(
    `Bearer ${token}`,
    jwtSecret,
    ["bearer"],
    ["user"],
    http.jwtPublicKey,
    http.jwtVerifyOptions ?? http.jwtOptions
  )

  if (!authContext?.actor_id) {
    res.status(302).setHeader("Location", getPlatformLoginUrl()).end()
    return
  }

  const sessionReq = req as SessionRequest
  sessionReq.session.auth_context = authContext

  await new Promise<void>((resolve, reject) => {
    sessionReq.session.save((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })

  res.status(302).setHeader("Location", "/app").end()
}
