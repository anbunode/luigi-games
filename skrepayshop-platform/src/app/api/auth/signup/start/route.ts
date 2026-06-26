import { NextResponse } from "next/server"
import { platformConfig } from "@/lib/config"

async function proxy(path: string, body: unknown) {
  const response = await fetch(`${platformConfig.backendUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  const data = await response.json().catch(() => ({}))
  return NextResponse.json(data, { status: response.status })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return proxy("/skrepay/accounts/signup/start", body)
}
