/**
 * Ejecuta las 3 suites de auditoría del panel admin en producción.
 * Uso: node scripts/run-admin-panel-audit.mjs
 */
import { spawnSync } from "child_process"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const scriptsDir = dirname(fileURLToPath(import.meta.url))
const suites = [
  { name: "API completa", file: "verify-admin-panel-full.mjs" },
  { name: "Rutas UI", file: "verify-admin-panel-routes.mjs" },
  { name: "Flujos profundos", file: "verify-admin-panel-deep.mjs" },
]

let failed = 0

for (const suite of suites) {
  console.log(`\n${"=".repeat(60)}`)
  console.log(`SUITE: ${suite.name}`)
  console.log("=".repeat(60))

  const result = spawnSync(process.execPath, [resolve(scriptsDir, suite.file)], {
    stdio: "inherit",
    env: process.env,
  })

  if (result.status !== 0) {
    failed++
    console.error(`\n[FAIL] ${suite.name}`)
  } else {
    console.log(`\n[OK] ${suite.name}`)
  }
}

console.log(`\n${"=".repeat(60)}`)
console.log(`AUDITORÍA TOTAL: ${suites.length - failed}/${suites.length} suites OK`)
console.log("=".repeat(60))

process.exit(failed > 0 ? 1 : 0)
