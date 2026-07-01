import type { MedusaRequest } from "@medusajs/framework/http"
import { getPlatformPool } from "./platform-db"
import { resolveStockLocationRequestSchema } from "./tenant-stock-locations-shim"

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
}

export type CatalogSchemaContext = {
  tenantSchema: string
  catalogSchema: string
}

export async function resolveCatalogSchemaContext(
  req: MedusaRequest
): Promise<CatalogSchemaContext | null> {
  const tenantSchema = await resolveStockLocationRequestSchema(req)
  if (!tenantSchema) {
    return null
  }

  const schemaQ = quoteSchema(tenantSchema)
  const result = await getPlatformPool().query<{ count: number }>(
    `select count(*)::int as count
     from ${schemaQ}.product
     where deleted_at is null`
  )

  const catalogSchema =
    (result.rows[0]?.count ?? 0) > 0 ? tenantSchema : "public"

  return { tenantSchema, catalogSchema }
}

export async function stockLocationExistsInSchemas(
  schemas: string[],
  locationId: string
): Promise<boolean> {
  for (const schema of schemas) {
    const schemaQ = quoteSchema(schema)
    const result = await getPlatformPool().query<{ id: string }>(
      `select id
       from ${schemaQ}.stock_location
       where id = $1 and deleted_at is null`,
      [locationId]
    )

    if (result.rows[0]) {
      return true
    }
  }

  return false
}

export function uniqueSchemas(schemas: Array<string | null | undefined>): string[] {
  return [...new Set(schemas.filter((schema): schema is string => Boolean(schema)))]
}
