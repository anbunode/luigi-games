import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { completeSignup } from "../../../../../lib/platform-accounts"

type Body = {
  email?: string
  code?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Body

  try {
    const result = await completeSignup(
      req.scope,
      body.email || "",
      body.code || ""
    )

    res.json({
      message: "Cuenta creada correctamente. Ya puedes iniciar sesión.",
      email: result.email,
      slug: result.slug,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear la cuenta."

    res.status(400).json({ message })
  }
}
