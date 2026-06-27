import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import { getPlatformPool } from "../../../lib/platform-db"

type ScopedRequest = MedusaRequest & {
  skrepayTenantSchema?: string
}

function quoteSchema(schema: string): string {
  return `"${schema.replace(/"/g, '""')}"`
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = req.auth_context?.actor_id

  if (!id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "User ID not found")
  }

  const schema = (req as ScopedRequest).skrepayTenantSchema

  if (schema) {
    const result = await getPlatformPool().query(
      `select
         id, email, first_name, last_name, avatar_url, metadata, created_at, updated_at
       from ${quoteSchema(schema)}."user"
       where id = $1 and deleted_at is null`,
      [id]
    )

    const user = result.rows[0]

    if (!user) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `User with id: ${id} was not found`
      )
    }

    res.status(200).json({ user })
    return
  }

  const remoteQuery = req.scope.resolve(
    ContainerRegistrationKeys.REMOTE_QUERY
  )
  const query = remoteQueryObjectFromString({
    entryPoint: "user",
    variables: { id },
    fields: req.queryConfig.fields,
  })
  const [user] = await remoteQuery(query)

  if (!user) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `User with id: ${id} was not found`
    )
  }

  res.status(200).json({ user })
}
