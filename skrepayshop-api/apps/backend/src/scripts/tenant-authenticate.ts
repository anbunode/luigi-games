import type { AuthenticationInput } from "@medusajs/framework/types"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, generateJwtToken } from "@medusajs/framework/utils"
import type { EntityManager } from "@mikro-orm/knex"

async function useTenantSchema(container: ExecArgs["container"]) {
  const schema =
    process.env.TENANT_AUTH_SCHEMA?.trim() ||
    process.env.TENANT_BOOTSTRAP_SCHEMA?.trim()

  if (!schema) {
    return
  }

  const manager = container.resolve(
    ContainerRegistrationKeys.MANAGER
  ) as EntityManager

  await manager
    .getConnection()
    .execute(`set search_path to "${schema.replace(/"/g, '""')}"`)
}

function buildAuthInput(email: string, password: string): AuthenticationInput {
  return {
    body: { email, password },
    query: {},
    headers: {},
    url: "/auth/user/emailpass",
    protocol: "http",
  }
}

export default async function tenantAuthenticate({ container }: ExecArgs) {
  await useTenantSchema(container)

  const email = process.env.TENANT_AUTH_EMAIL?.trim().toLowerCase()
  const password = process.env.TENANT_AUTH_PASSWORD

  if (!email || !password) {
    throw new Error("Faltan TENANT_AUTH_EMAIL o TENANT_AUTH_PASSWORD.")
  }

  const authModule = container.resolve(Modules.AUTH)
  const authenticated = await authModule.authenticate(
    "emailpass",
    buildAuthInput(email, password)
  )

  if (!authenticated.success || !authenticated.authIdentity) {
    throw new Error(authenticated.error || "Credenciales incorrectas.")
  }

  const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const { http } = config.projectConfig
  const entityId = authenticated.authIdentity.app_metadata?.user_id

  if (typeof entityId !== "string" || !entityId) {
    throw new Error("No hay usuario admin vinculado a estas credenciales.")
  }

  const token = await generateJwtToken(
    {
      actor_id: entityId,
      actor_type: "user",
      auth_identity_id: authenticated.authIdentity.id,
      auth_provider: "emailpass",
      app_metadata: {
        ...(authenticated.authIdentity.app_metadata ?? {}),
        user_id: entityId,
      },
      user_metadata: {},
    },
    {
      secret: http.jwtSecret!,
      expiresIn: http.jwtExpiresIn,
      jwtOptions: http.jwtOptions,
    }
  )

  console.log(JSON.stringify({ token }))
}
