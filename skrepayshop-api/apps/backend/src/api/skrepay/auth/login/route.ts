import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { AuthenticationInput } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys, generateJwtToken } from "@medusajs/framework/utils"
import { getTenantByEmail } from "../../../../lib/tenant-context"
import { resolveTenantSchema } from "../../../../lib/tenant-db-scope"
import {
  getTenantDatabaseBaseUrl,
  tenantHasDedicatedDatabase,
} from "../../../../lib/tenant-provisioner"
import { authenticateTenantInSchema } from "../../../../lib/tenant-admin"

type LoginBody = {
  email?: string
  password?: string
}

function buildAuthInput(email: string, password: string): AuthenticationInput {
  return {
    actor_type: "user",
    body: { email, password },
    query: {},
    headers: {},
    url: "/auth/user/emailpass",
    protocol: "http",
  }
}

async function issueUserToken(
  req: MedusaRequest,
  userId: string,
  authIdentityId: string
): Promise<string> {
  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const { http } = config.projectConfig

  return generateJwtToken(
    {
      actor_id: userId,
      actor_type: "user",
      auth_identity_id: authIdentityId,
      auth_provider: "emailpass",
      app_metadata: { user_id: userId },
      user_metadata: {},
    },
    {
      secret: http.jwtSecret!,
      expiresIn: http.jwtExpiresIn,
      jwtOptions: http.jwtOptions,
    }
  )
}

async function authenticateOnSharedDatabase(
  req: MedusaRequest,
  email: string,
  password: string
): Promise<string> {
  const authModule = req.scope.resolve(Modules.AUTH)
  const authenticated = await authModule.authenticate(
    "emailpass",
    buildAuthInput(email, password)
  )

  if (!authenticated.success || !authenticated.authIdentity) {
    throw new Error(authenticated.error || "Credenciales incorrectas.")
  }

  const entityId = authenticated.authIdentity.app_metadata?.user_id

  if (typeof entityId !== "string" || !entityId) {
    throw new Error("No hay usuario admin vinculado a estas credenciales.")
  }

  return issueUserToken(req, entityId, authenticated.authIdentity.id)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as LoginBody
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    res.status(400).json({ message: "Correo y contraseña son obligatorios." })
    return
  }

  try {
    const tenant = await getTenantByEmail(email)
    const schema =
      tenant && tenantHasDedicatedDatabase(tenant)
        ? resolveTenantSchema(tenant)
        : null

    if (schema) {
      const auth = await authenticateTenantInSchema(
        getTenantDatabaseBaseUrl(),
        schema,
        email,
        password
      )

      const token = await issueUserToken(req, auth.userId, auth.authIdentityId)
      res.status(200).json({ token })
      return
    }

    const token = await authenticateOnSharedDatabase(req, email, password)
    res.status(200).json({ token })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Credenciales incorrectas."

    res.status(401).json({ message })
  }
}
