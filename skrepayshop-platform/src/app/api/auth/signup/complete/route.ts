import { NextResponse } from "next/server"
import { platformConfig } from "@/lib/config"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  const response = await fetch(
    `${platformConfig.backendUrl}/skrepay/accounts/signup/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  )

  const data = await response.json().catch(() => ({}))
  return NextResponse.json(data, { status: response.status })
}
