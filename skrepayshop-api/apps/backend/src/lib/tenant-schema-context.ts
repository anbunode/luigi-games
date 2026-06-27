import { AsyncLocalStorage } from "node:async_hooks"

export const tenantSchemaStorage = new AsyncLocalStorage<string>()

export function getActiveTenantSchema(): string | undefined {
  return tenantSchemaStorage.getStore()
}

export function runWithTenantSchema<T>(
  schema: string,
  fn: () => T
): T {
  return tenantSchemaStorage.run(schema, fn)
}
