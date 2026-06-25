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
    `${platformConfig.backendUrl}/auth/user/emailpass`,
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
        message: "Acceso validado. Redirigiendo al panel oficial…",
        redirectUrl: platformConfig.adminUrl,
      },
      { status: 200 }
    )
  }

  await fetch(`${platformConfig.backendUrl}/auth/session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  }).catch(() => null)

  return NextResponse.json({
    redirectUrl: platformConfig.adminUrl,
    message: "Sesión iniciada correctamente.",
  })
}
