import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import { getPlatformPool } from "../../../../lib/platform-db"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
}

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const schema = (req as ScopedRequest).skrepayTenantSchema

  if (schema) {
    const result = await getPlatformPool().query(
      `select
         id, name, default_sales_channel_id, default_region_id, default_location_id,
         metadata, created_at, updated_at
       from ${quoteSchema(schema)}.store
       where deleted_at is null
       order by created_at asc`
    )

    res.json({
      stores: result.rows,
      count: result.rows.length,
      offset: 0,
      limit: result.rows.length,
    })
    return
  }

  const remoteQuery = req.scope.resolve(
    ContainerRegistrationKeys.REMOTE_QUERY
  )
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "store",
    variables: {
      filters: req.filterableFields,
      ...req.queryConfig.pagination,
    },
    fields: req.queryConfig.fields,
  })
  const { rows: stores, metadata } = await remoteQuery(queryObject)

  res.json({
    stores,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
