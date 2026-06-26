import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getPlatformLoginUrl } from "../../../lib/platform-url"

type SessionRequest = MedusaRequest & {
  session: {
    destroy: (callback: (error?: Error | null) => void) => void
  }
}

async function destroySessionAndRedirect(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const sessionReq = req as SessionRequest
  const { sessionOptions, cookieOptions } = req.scope
    .resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig

  const cookieName = sessionOptions?.name ?? "connect.sid"

  try {
    if (sessionReq.session?.destroy) {
      await new Promise<void>((resolve, reject) => {
        sessionReq.session.destroy((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
    }
  } catch {
    // Continue to clear cookie and redirect even if destroy fails.
  } finally {
    res.clearCookie(cookieName, cookieOptions)
  }

  res.status(302).setHeader("Location", getPlatformLoginUrl()).end()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await destroySessionAndRedirect(req, res)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await destroySessionAndRedirect(req, res)
}
