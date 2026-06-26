import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { completePasswordReset } from "../../../../../lib/platform-accounts"

type Body = {
  email?: string
  code?: string
  password?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Body

  try {
    await completePasswordReset(
      req.scope,
      body.email || "",
      body.code || "",
      body.password || ""
    )

    res.json({
      message: "Contraseña actualizada. Ya puedes iniciar sesión.",
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo actualizar la contraseña."

    res.status(400).json({ message })
  }
}
