import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { readFileSync } from "fs"
import { resolve } from "path"

type BuildInfo = {
  commit?: string
  builtAt?: string
  service?: string
}

function loadBuildInfo(): BuildInfo {
  try {
    const raw = readFileSync(
      resolve(process.cwd(), "build-info.json"),
      "utf8"
    )
    return JSON.parse(raw) as BuildInfo
  } catch {
    return {}
  }
}

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const info = loadBuildInfo()
  res.json({
    ok: true,
    commit: info.commit ?? null,
    builtAt: info.builtAt ?? null,
    service: info.service ?? "skrepayshop-api",
  })
}
