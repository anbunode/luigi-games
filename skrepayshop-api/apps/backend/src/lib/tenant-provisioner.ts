import { spawn } from "child_process"
import { Client } from "pg"
import { getPlatformPool } from "./platform-db"
import { cloneMedusaSchemaFromPublic } from "./clone-medusa-schema"
import {
  bootstrapTenantAdminInSchema,
  type TenantAdminInput,
} from "./tenant-admin"

export type TenantBootstrapInput = {
  email: string
  password: string
  shopName: string
  slug: string
}

export type TenantBootstrapResult = {
  medusa_user_id: string
  medusa_sales_channel_id: string
}

const backendRoot = process.cwd()

export function tenantSchemaName(slug: string): string {
  return `t_${slug.replace(/[^a-z0-9_]/g, "_")}`
}

export function withSearchPath(connectionString: string, schema: string): string {
  const option = encodeURIComponent(`-c search_path=${schema}`)
  const separator = connectionString.includes("?") ? "&" : "?"
  return `${connectionString}${separator}options=${option}`
}

export function getTenantDatabaseBaseUrl(): string {
  return (
    process.env.TENANT_DATABASE_BASE_URL ||
    process.env.PLATFORM_DATABASE_URL ||
    process.env.DATABASE_URL ||
    ""
  )
}

export function isAutoProvisionEnabled(): boolean {
  if (process.env.TENANT_AUTO_PROVISION === "false") {
    return false
  }

  return Boolean(getTenantDatabaseBaseUrl())
}

export function tenantHasDedicatedDatabase(tenant: {
  database_url: string | null
  database_schema?: string | null
  database_status: string
}): boolean {
  const status = tenant.database_status

  if (
    tenant.database_schema &&
    ["active", "dedicated", "provisioning"].includes(status)
  ) {
    return true
  }

  return Boolean(
    tenant.database_url &&
      ["active", "dedicated", "provisioning"].includes(status)
  )
}

function sslForUrl(connectionString: string) {
  return connectionString.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false }
}

async function createSchema(connectionString: string, schema: string): Promise<void> {
  const client = new Client({
    connectionString,
    ssl: sslForUrl(connectionString),
  })

  await client.connect()
  await client.query(`create schema if not exists "${schema}"`)
  await client.end()
}

function parseJsonLine(stdout: string): Record<string, unknown> {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]

    if (!line.startsWith("{")) {
      continue
    }

    try {
      return JSON.parse(line) as Record<string, unknown>
    } catch {
      continue
    }
  }

  throw new Error("No se recibió salida JSON del comando Medusa.")
}

async function runMedusaCommand(
  databaseUrl: string,
  args: string[],
  extraEnv: Record<string, string> = {}
): Promise<{ stdout: string; stderr: string }> {
  const schemaMatch = databaseUrl.match(/search_path(?:%3D|=)([^&%]+)/i)
  const schema = schemaMatch?.[1]

  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["medusa", ...args], {
      cwd: backendRoot,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        ...(schema ? { PGOPTIONS: `-c search_path=${schema}` } : {}),
        ...extraEnv,
      },
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString()
    })

    child.on("error", reject)

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
        return
      }

      reject(
        new Error(
          stderr.trim() ||
            stdout.trim() ||
            `Comando Medusa falló con código ${code ?? "desconocido"}.`
        )
      )
    })
  })
}

export async function runTenantMigrations(databaseUrl: string): Promise<void> {
  await runMedusaCommand(databaseUrl, ["db:migrate"])
}

export async function provisionTenantDatabase(slug: string): Promise<{
  database_url: string
  database_schema?: string
  database_status: string
}> {
  const template = process.env.TENANT_DATABASE_URL_TEMPLATE?.trim()

  if (template) {
    const databaseUrl = template.replace(/\{\{SLUG\}\}/g, slug)
    await runTenantMigrations(databaseUrl)

    return {
      database_url: databaseUrl,
      database_status: "active",
    }
  }

  const baseUrl = getTenantDatabaseBaseUrl()

  if (!baseUrl) {
    throw new Error("No hay URL base para provisionar bases de datos de tenant.")
  }

  const schema = tenantSchemaName(slug)
  await createSchema(baseUrl, schema)
  await cloneMedusaSchemaFromPublic(baseUrl.split("?")[0], schema)

  const databaseUrl = withSearchPath(baseUrl, schema)

  return {
    database_url: databaseUrl,
    database_schema: schema,
    database_status: "active",
  }
}

export async function bootstrapTenantAdmin(
  connectionString: string,
  schema: string,
  input: TenantAdminInput
): Promise<TenantBootstrapResult> {
  const result = await bootstrapTenantAdminInSchema(
    connectionString,
    schema,
    input
  )

  return {
    medusa_user_id: result.medusa_user_id,
    medusa_sales_channel_id: result.medusa_sales_channel_id,
  }
}

export async function authenticateTenantAdmin(
  databaseUrl: string,
  email: string,
  password: string
): Promise<string> {
  const { stdout } = await runMedusaCommand(
    databaseUrl,
    ["exec", "./src/scripts/tenant-authenticate.ts"],
    {
      TENANT_AUTH_EMAIL: email,
      TENANT_AUTH_PASSWORD: password,
    }
  )

  const payload = parseJsonLine(stdout)
  const token = payload.token

  if (typeof token !== "string" || !token) {
    throw new Error("Credenciales incorrectas.")
  }

  return token
}

export async function markTenantDatabaseStatus(
  slug: string,
  status: string,
  databaseUrl?: string | null
): Promise<void> {
  const db = getPlatformPool()

  if (databaseUrl) {
    await db.query(
      `update public.skrepayshop_tenants
       set database_status = $2,
           database_url = $3,
           updated_at = now()
       where slug = $1`,
      [slug, status, databaseUrl]
    )
    return
  }

  await db.query(
    `update public.skrepayshop_tenants
     set database_status = $2,
         updated_at = now()
     where slug = $1`,
    [slug, status]
  )
}
