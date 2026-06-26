import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { startSignup } from "../../../../../lib/platform-accounts"

type Body = {
  email?: string
  password?: string
  shopName?: string
  slug?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Body

  try {
    await startSignup({
      email: body.email || "",
      password: body.password || "",
      shopName: body.shopName || "",
      slug: body.slug || "",
    })

    res.json({
      message:
        "Te enviamos un código de verificación a tu correo. Revisa la bandeja de entrada.",
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo iniciar el registro."

    res.status(400).json({ message })
  }
}
