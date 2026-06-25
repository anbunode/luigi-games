import { mkdir } from "fs/promises"
import { join, extname } from "path"
import { randomUUID } from "crypto"
import multer from "multer"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

const UPLOAD_DIR = join(process.cwd(), "uploads", "storefront-banners")
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
])
const ALLOWED_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
])

function getPublicBaseUrl(req: MedusaRequest) {
  return (
    process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "") ||
    `${req.protocol}://${req.get("host")}`
  )
}

function isAllowedImage(mimetype: string, originalname: string) {
  const extension = extname(originalname).toLowerCase()

  return ALLOWED_MIME.has(mimetype) || ALLOWED_EXT.has(extension)
}

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      try {
        await mkdir(UPLOAD_DIR, { recursive: true })
        cb(null, UPLOAD_DIR)
      } catch (error) {
        cb(error as Error, UPLOAD_DIR)
      }
    },
    filename: (_req, file, cb) => {
      const extension = extname(file.originalname).toLowerCase() || ".png"
      cb(null, `${randomUUID()}${extension}`)
    },
  }),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedImage(file.mimetype, file.originalname)) {
      cb(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Formato no permitido. Usa JPG, PNG, WebP, GIF o SVG."
        )
      )
      return
    }

    cb(null, true)
  },
})

function receiveUploadedFile(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<Express.Multer.File> {
  return new Promise((resolve, reject) => {
    upload.single("file")(req, res, (error: unknown) => {
      if (error) {
        if (error instanceof MedusaError) {
          reject(error)
          return
        }

        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
          reject(
            new MedusaError(
              MedusaError.Types.INVALID_DATA,
              "La imagen supera el límite de 5 MB."
            )
          )
          return
        }

        reject(
          new MedusaError(
            MedusaError.Types.INVALID_DATA,
            error instanceof Error
              ? error.message
              : "No se pudo procesar la imagen."
          )
        )
        return
      }

      const file = (req as MedusaRequest & { file?: Express.Multer.File }).file

      if (!file) {
        reject(
          new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "No se recibió ninguna imagen."
          )
        )
        return
      }

      resolve(file)
    })
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const file = await receiveUploadedFile(req, res)
  const url = `${getPublicBaseUrl(req)}/store/storefront-banner/${file.filename}`

  res.json({ url, filename: file.filename })
}

export const AUTHENTICATE = true
