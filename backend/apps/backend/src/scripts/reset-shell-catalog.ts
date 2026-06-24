import { ExecArgs } from "@medusajs/framework/types"
import { resetShellCatalog } from "../lib/shell-catalog"

export default async function resetShellCatalogScript({ container }: ExecArgs) {
  await resetShellCatalog(container)
}
