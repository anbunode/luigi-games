import { writeFileSync } from "fs"
import { join } from "path"
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function getPublishableKey({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "token", "type"],
    filters: { type: "publishable" },
  })

  const key = apiKeys?.[0]?.token
  if (!key) {
    throw new Error("No publishable API key found")
  }

  const outPath = join(process.cwd(), "..", "..", "..", "storefront", ".medusa-key.tmp")
  writeFileSync(outPath, key, "utf8")
}
