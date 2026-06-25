import { createReadStream, existsSync } from "fs"
import { join, basename } from "path"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

const UPLOAD_DIR = join(process.cwd(), "uploads", "storefront-banners")

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const filename = basename(req.params.filename)

  if (!filename || filename.includes("..")) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Imagen no encontrada")
  }

  const filepath = join(UPLOAD_DIR, filename)

  if (!existsSync(filepath)) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Imagen no encontrada")
  }

  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase()
  const contentType = MIME_BY_EXT[extension] || "application/octet-stream"

  res.setHeader("Content-Type", contentType)
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable")

  createReadStream(filepath).pipe(res)
}
