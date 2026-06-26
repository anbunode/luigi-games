import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { startPasswordReset } from "../../../../../lib/platform-accounts"

type Body = {
  email?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Body

  try {
    await startPasswordReset(body.email || "")

    res.json({
      message:
        "Si el correo está registrado, recibirás un código para restablecer tu contraseña.",
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo procesar la solicitud."

    res.status(400).json({ message })
  }
}
