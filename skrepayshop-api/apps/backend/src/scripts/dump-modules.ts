import { ExecArgs } from "@medusajs/framework/types"

export default async function dumpModules({ container }: ExecArgs) {
  console.log("Modules in container:")
  const registrations = container.registrations
  for (const key in registrations) {
    if (key.endsWith("Service")) {
      console.log(key)
    }
  }
}
