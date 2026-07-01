/**
 * Verifica que la lista nativa de pedidos fue reemplazada por la UI Skrepay.
 */
import { readFileSync, readdirSync } from "fs"
import { resolve } from "path"

const assetsDir = resolve(
  process.cwd(),
  ".medusa/server/public/admin/assets"
)

const files = readdirSync(assetsDir).filter((file) => file.endsWith(".js"))
const indexFile = files
  .filter((file) => file.startsWith("index-"))
  .sort(
    (a, b) =>
      readFileSync(resolve(assetsDir, b), "utf8").length -
      readFileSync(resolve(assetsDir, a), "utf8").length
  )[0]

const orderListFile = files.find((file) => file.startsWith("order-list-"))
const skrepayOrdersFile = files.find((file) => file.startsWith("skrepay-orders-list-"))

if (!orderListFile) {
  console.error("FAIL: no order-list chunk found")
  process.exit(1)
}

const orderListCode = readFileSync(resolve(assetsDir, orderListFile), "utf8")
const indexCode = indexFile
  ? readFileSync(resolve(assetsDir, indexFile), "utf8")
  : ""

const patched =
  orderListCode.includes("skrepay-orders-list") &&
  orderListCode.includes("export{e as Component}")

const hasShell =
  orderListCode.includes("data-skrepay-orders-shell") ||
  (skrepayOrdersFile
    ? readFileSync(resolve(assetsDir, skrepayOrdersFile), "utf8").includes(
        "data-skrepay-orders-shell"
      )
    : false)

const hasNativeTable = orderListCode.includes("orders.list.noRecordsMessage")

console.log("order-list:", orderListFile)
console.log("skrepay chunk:", skrepayOrdersFile ?? "missing")
console.log("patched redirect:", patched)
console.log("has shell:", hasShell)
console.log("native table removed:", !hasNativeTable)

if (!patched || !hasShell || hasNativeTable) {
  console.error("\nFAIL: orders list UI patch incomplete")
  process.exit(1)
}

console.log("\nPASS: Skrepay orders list UI is wired in the admin bundle")
