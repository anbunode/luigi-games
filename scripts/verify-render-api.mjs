/**
 * Verificación rápida del API en Render (solo lectura).
 * Uso: node scripts/verify-render-api.mjs
 */
const base = process.env.API_BASE_URL || "https://skrepayshop-api.onrender.com"

const checks = []

async function check(name, fn) {
  try {
    const result = await fn()
    checks.push({ name, ok: true, detail: result })
    console.log(`[OK] ${name}${result ? ` — ${result}` : ""}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    checks.push({ name, ok: false, detail: msg })
    console.log(`[FAIL] ${name} — ${msg}`)
  }
}

await check("GET /health", async () => {
  const r = await fetch(`${base}/health`)
  const t = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${t}`)
  return t.trim()
})

await check("GET /app (admin HTML)", async () => {
  const r = await fetch(`${base}/app`)
  if (!r.ok) throw new Error(String(r.status))
  const html = await r.text()
  const bundle = html.match(/index-[^"']+\.js/)?.[0]
  if (!bundle) throw new Error("admin bundle not found in HTML")
  return bundle
})

await check("GET /app/assets bundle has draft-orders", async () => {
  const html = await fetch(`${base}/app`).then((r) => r.text())
  const bundle = html.match(/index-[^"']+\.js/)?.[0]
  const js = await fetch(`${base}/app/assets/${bundle}`).then((r) => r.text())
  if (!js.includes('path:"/draft-orders"')) throw new Error("draft-orders route missing")
  return `${bundle} (${js.length} bytes)`
})

const failed = checks.filter((c) => !c.ok).length
console.log("\n" + "=".repeat(40))
console.log(failed ? `RENDER API: ${failed} check(s) failed` : "RENDER API: OK")
process.exit(failed ? 1 : 0)
