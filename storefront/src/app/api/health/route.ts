import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "luigi-games-storefront",
    timestamp: new Date().toISOString(),
  })
}
