import type { MedusaRequest } from "@medusajs/framework/http"

export function getAdminRequestPath(req: MedusaRequest): string {
  const raw =
    req.url?.split("?")[0] ||
    (req as MedusaRequest & { path?: string }).path ||
    ""

  if (raw.startsWith("/admin")) {
    return raw
  }

  if (raw.startsWith("/")) {
    return `/admin${raw}`
  }

  return raw ? `/admin/${raw}` : "/admin"
}

export function isAdminPath(req: MedusaRequest): boolean {
  const path = getAdminRequestPath(req)
  return path === "/admin" || path.startsWith("/admin/")
}
