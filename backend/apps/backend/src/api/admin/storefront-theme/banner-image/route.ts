import { createWriteStream } from "fs"
import { mkdir } from "fs/promises"
import { join, extname } from "path"
import { randomUUID } from "crypto"
import Busboy from "busboy"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

const UPLOAD_DIR = join(process.cwd(), "uploads", "storefront-banners")
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
])

function getPublicBaseUrl(req: MedusaRequest) {
  return (
    process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "") ||
    `${req.protocol}://${req.get("host")}`
  )
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await mkdir(UPLOAD_DIR, { recursive: true })

  const result = await new Promise<{ filename: string; mimeType: string }>(
    (resolve, reject) => {
      const busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: MAX_BYTES, files: 1 },
      })

      let savedFile: { filename: string; mimeType: string } | null = null

      busboy.on("file", (fieldname, file, info) => {
        if (fieldname !== "file") {
          file.resume()
          return
        }

        const mimeType = info.mimeType

        if (!ALLOWED_TYPES.has(mimeType)) {
          file.resume()
          reject(
            new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "Formato no permitido. Usa JPG, PNG, WebP, GIF o SVG."
            )
          )
          return
        }

        const extension = extname(info.filename) || ".jpg"
        const filename = `${randomUUID()}${extension}`
        const filepath = join(UPLOAD_DIR, filename)
        const stream = createWriteStream(filepath)

        file.pipe(stream)

        stream.on("finish", () => {
          savedFile = { filename, mimeType }
        })

        stream.on("error", reject)
        file.on("limit", () => {
          reject(
            new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "La imagen supera el límite de 5 MB."
            )
          )
        })
      })

      busboy.on("error", reject)

      busboy.on("finish", () => {
        if (!savedFile) {
          reject(
            new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "No se recibió ninguna imagen."
            )
          )
          return
        }

        resolve(savedFile)
      })

      req.pipe(busboy)
    }
  )

  const url = `${getPublicBaseUrl(req)}/store/storefront-banner/${result.filename}`

  res.json({ url, filename: result.filename })
}
