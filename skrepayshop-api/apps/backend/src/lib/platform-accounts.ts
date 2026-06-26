import { createHash, randomInt } from "crypto"
import { Pool } from "pg"
import type { MedusaContainer } from "@medusajs/framework"
import { createSalesChannelsWorkflow } from "@medusajs/medusa/core-flows"
import { sendSkrepayEmail, verificationEmailContent } from "./email"

export type SignupPayload = {
  email: string
  password: string
  shopName: string
  slug: string
}

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    })
  }
  return pool
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex")
}

function generateCode(): string {
  return String(randomInt(100000, 999999))
}

export function slugifyShopName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

async function emailExists(email: string): Promise<boolean> {
  const db = getPool()
  const tenant = await db.query(
    `select 1 from skrepayshop_tenants where lower(owner_email) = lower($1) limit 1`,
    [email]
  )
  if (tenant.rowCount) {
    return true
  }

  const auth = await db.query(
    `select 1 from "user" where lower(email) = lower($1) and deleted_at is null limit 1`,
    [email]
  )
  return Boolean(auth.rowCount)
}

async function slugTaken(slug: string): Promise<boolean> {
  const db = getPool()
  const result = await db.query(
    `select 1 from skrepayshop_tenants where slug = $1 limit 1`,
    [slug]
  )
  return Boolean(result.rowCount)
}

export async function startSignup(input: SignupPayload): Promise<void> {
  const email = input.email.trim().toLowerCase()
  const slug = slugifyShopName(input.slug || input.shopName)

  if (!email || !input.password || !input.shopName || !slug) {
    throw new Error("Completa todos los campos obligatorios.")
  }

  if (input.password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres.")
  }

  if (await emailExists(email)) {
    throw new Error("Ya existe una cuenta con este correo.")
  }

  if (await slugTaken(slug)) {
    throw new Error("Ese nombre de tienda ya está en uso. Prueba otro.")
  }

  const code = generateCode()
  const db = getPool()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await db.query(
    `update skrepayshop_verification_code
     set consumed_at = now()
     where lower(email) = lower($1) and purpose = 'signup' and consumed_at is null`,
    [email]
  )

  await db.query(
    `insert into skrepayshop_verification_code (email, purpose, code_hash, payload, expires_at)
     values ($1, 'signup', $2, $3::jsonb, $4)`,
    [
      email,
      hashCode(code),
      JSON.stringify({
        password: input.password,
        shopName: input.shopName.trim(),
        slug,
      }),
      expiresAt.toISOString(),
    ]
  )

  const content = verificationEmailContent(code, "signup")
  await sendSkrepayEmail({
    to: email,
    ...content,
  })
}

export async function completeSignup(
  container: MedusaContainer,
  emailInput: string,
  codeInput: string
): Promise<{ email: string; slug: string }> {
  const email = emailInput.trim().toLowerCase()
  const code = codeInput.trim()
  const db = getPool()

  const row = await db.query(
    `select id, code_hash, payload, expires_at
     from skrepayshop_verification_code
     where lower(email) = lower($1)
       and purpose = 'signup'
       and consumed_at is null
     order by created_at desc
     limit 1`,
    [email]
  )

  const record = row.rows[0] as
    | {
        id: string
        code_hash: string
        payload: SignupPayload
        expires_at: string
      }
    | undefined

  if (!record) {
    throw new Error("No hay un registro pendiente para este correo.")
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    throw new Error("El código expiró. Solicita uno nuevo.")
  }

  if (record.code_hash !== hashCode(code)) {
    throw new Error("Código incorrecto.")
  }

  const payload = record.payload
  const base = (
    process.env.MEDUSA_BACKEND_URL || "https://skrepayshop-api.onrender.com"
  ).replace(/\/$/, "")

  const registerResponse = await fetch(`${base}/auth/user/emailpass/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: payload.password }),
  })

  if (!registerResponse.ok) {
    const errorData = await registerResponse.json().catch(() => ({}))
    throw new Error(
      typeof errorData.message === "string"
        ? errorData.message
        : "No se pudo crear la cuenta."
    )
  }

  const registerData = (await registerResponse.json().catch(() => ({}))) as {
    token?: string
    user?: { id?: string }
  }

  const registrationToken = registerData.token

  if (!registrationToken) {
    throw new Error("No se recibió token de registro de Medusa.")
  }

  const createUserResponse = await fetch(`${base}/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${registrationToken}`,
    },
    body: JSON.stringify({
      email,
      first_name: payload.shopName,
      last_name: "",
    }),
  })

  if (!createUserResponse.ok) {
    const errorData = await createUserResponse.json().catch(() => ({}))
    throw new Error(
      typeof errorData.message === "string"
        ? errorData.message
        : "No se pudo vincular la cuenta con el panel."
    )
  }

  const createUserData = (await createUserResponse.json().catch(() => ({}))) as {
    user?: { id?: string }
  }

  const userId = createUserData.user?.id

  if (!userId) {
    throw new Error("No se pudo crear el usuario administrador.")
  }

  const {
    result: [salesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: payload.shopName,
          description: `Canal SkrepayShop — ${payload.slug}`,
        },
      ],
    },
  })

  const storefrontUrl = `https://${payload.slug}.skrepay.shop`

  await db.query(
    `insert into skrepayshop_tenants (
       slug, display_name, owner_email, medusa_user_id, medusa_sales_channel_id,
       storefront_url, free_subdomain, plan, status, email_verified_at
     ) values ($1, $2, $3, $4, $5, $6, $7, 'starter', 'active', now())
     on conflict (slug) do nothing`,
    [
      payload.slug,
      payload.shopName,
      email,
      userId,
      salesChannel.id,
      storefrontUrl,
      `${payload.slug}.skrepay.shop`,
    ]
  )

  await db.query(
    `update skrepayshop_verification_code set consumed_at = now() where id = $1`,
    [record.id]
  )

  return { email, slug: payload.slug }
}

export async function startPasswordReset(emailInput: string): Promise<void> {
  const email = emailInput.trim().toLowerCase()

  if (!email) {
    throw new Error("Introduce tu correo electrónico.")
  }

  if (!(await emailExists(email))) {
  // Respuesta genérica para no filtrar correos existentes
    return
  }

  const code = generateCode()
  const db = getPool()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await db.query(
    `update skrepayshop_verification_code
     set consumed_at = now()
     where lower(email) = lower($1) and purpose = 'password_reset' and consumed_at is null`,
    [email]
  )

  await db.query(
    `insert into skrepayshop_verification_code (email, purpose, code_hash, payload, expires_at)
     values ($1, 'password_reset', $2, '{}'::jsonb, $3)`,
    [email, hashCode(code), expiresAt.toISOString()]
  )

  const content = verificationEmailContent(code, "password_reset")
  await sendSkrepayEmail({
    to: email,
    ...content,
  })
}

export async function completePasswordReset(
  _container: MedusaContainer,
  emailInput: string,
  codeInput: string,
  newPassword: string
): Promise<void> {
  const email = emailInput.trim().toLowerCase()
  const code = codeInput.trim()
  const db = getPool()

  if (newPassword.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres.")
  }

  const row = await db.query(
    `select id, code_hash, expires_at
     from skrepayshop_verification_code
     where lower(email) = lower($1)
       and purpose = 'password_reset'
       and consumed_at is null
     order by created_at desc
     limit 1`,
    [email]
  )

  const record = row.rows[0] as
    | { id: string; code_hash: string; expires_at: string }
    | undefined

  if (!record) {
    throw new Error("No hay una solicitud activa para este correo.")
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    throw new Error("El código expiró. Solicita uno nuevo.")
  }

  if (record.code_hash !== hashCode(code)) {
    throw new Error("Código incorrecto.")
  }

  const base = (
    process.env.MEDUSA_BACKEND_URL || "https://skrepayshop-api.onrender.com"
  ).replace(/\/$/, "")

  const tokenResponse = await fetch(
    `${base}/auth/user/emailpass/reset-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email }),
    }
  )

  if (!tokenResponse.ok) {
    throw new Error("No se pudo iniciar el cambio de contraseña.")
  }

  const tokenData = await tokenResponse.json().catch(() => ({}))
  const token = tokenData.token as string | undefined

  if (!token) {
    throw new Error("No se recibió token de restablecimiento.")
  }

  const updateResponse = await fetch(`${base}/auth/user/emailpass/update`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password: newPassword }),
  })

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json().catch(() => ({}))
    throw new Error(
      typeof errorData.message === "string"
        ? errorData.message
        : "No se pudo actualizar la contraseña."
    )
  }

  await db.query(
    `update skrepayshop_verification_code set consumed_at = now() where id = $1`,
    [record.id]
  )
}
