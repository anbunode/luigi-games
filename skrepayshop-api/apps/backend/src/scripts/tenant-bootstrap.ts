import type { AuthenticationInput } from "@medusajs/framework/types"
import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createSalesChannelsWorkflow,
  createUsersWorkflow,
  setAuthAppMetadataWorkflow,
} from "@medusajs/medusa/core-flows"

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

export default async function tenantBootstrap({ container }: ExecArgs) {
  const email = process.env.TENANT_BOOTSTRAP_EMAIL?.trim().toLowerCase()
  const password = process.env.TENANT_BOOTSTRAP_PASSWORD
  const shopName = process.env.TENANT_BOOTSTRAP_SHOP_NAME?.trim()
  const slug = process.env.TENANT_BOOTSTRAP_SLUG?.trim().toLowerCase()

  if (!email || !password || !shopName || !slug) {
    throw new Error("Faltan variables TENANT_BOOTSTRAP_* para crear la tienda.")
  }

  const authModule = container.resolve(Modules.AUTH)
  const input = buildAuthInput(email, password)
  const registered = await authModule.register("emailpass", input)

  if (!registered.success || !registered.authIdentity) {
    throw new Error(
      registered.error || "No se pudieron registrar las credenciales del tenant."
    )
  }

  const {
    result: [createdUser],
  } = await createUsersWorkflow(container).run({
    input: {
      users: [
        {
          email,
          first_name: shopName,
          last_name: "",
        },
      ],
    },
  })

  await setAuthAppMetadataWorkflow(container).run({
    input: {
      authIdentityId: registered.authIdentity.id,
      actorType: "user",
      value: createdUser.id,
    },
  })

  const {
    result: [salesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: shopName,
          description: `Canal SkrepayShop — ${slug}`,
        },
      ],
    },
  })

  console.log(
    JSON.stringify({
      medusa_user_id: createdUser.id,
      medusa_sales_channel_id: salesChannel.id,
    })
  )
}
