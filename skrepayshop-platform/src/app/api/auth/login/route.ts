import { NextResponse } from "next/server"
import { platformConfig } from "@/lib/config"

type LoginBody = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginBody
  const email = body.email?.trim()
  const password = body.password

  if (!email || !password) {
    return NextResponse.json(
      { message: "Correo y contraseña son obligatorios." },
      { status: 400 }
    )
  }

  const authResponse = await fetch(
    `${platformConfig.backendUrl}/skrepay/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    }
  )

  if (!authResponse.ok) {
    const errorData = await authResponse.json().catch(() => ({}))
    const message =
      typeof errorData.message === "string"
        ? errorData.message
        : "Credenciales incorrectas. Revisa tu correo y contraseña."

    return NextResponse.json({ message }, { status: 401 })
  }

  const authData = await authResponse.json().catch(() => ({}))
  const token = authData.token as string | undefined

  if (!token) {
    return NextResponse.json(
      {
        message:
          "Credenciales válidas pero no se recibió token. Contacta soporte.",
      },
      { status: 502 }
    )
  }

  const bridgeUrl = new URL(
    "/skrepay/session-bridge",
    platformConfig.backendUrl
  )
  bridgeUrl.searchParams.set("token", token)

  return NextResponse.json({
    redirectUrl: bridgeUrl.toString(),
    message: "Sesión iniciada correctamente.",
  })
}
