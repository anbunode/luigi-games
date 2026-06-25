import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "skrepayshop-tenant-luigi-games",
    timestamp: new Date().toISOString(),
  })
}
