const app = await fetch("https://skrepayshop-api.onrender.com/app")
const html = await app.text()
const bundle = html.match(/index-[^"']+\.js/)?.[0] ?? "not found"
const health = await fetch("https://skrepayshop-api.onrender.com/health")
console.log("health:", health.status)
const deployInfo = await fetch("https://skrepayshop-api.onrender.com/deploy-info")
if (deployInfo.ok) {
  const info = await deployInfo.json()
  console.log("deploy commit:", info.commit?.slice(0, 7) ?? "unknown")
  console.log("built at:", info.builtAt ?? "unknown")
}
console.log("bundle:", bundle)
const js = bundle !== "not found" ? await fetch(`https://skrepayshop-api.onrender.com/app/assets/${bundle}`) : null
if (js) {
  const text = await js.text()
  console.log("skrepay draft UI:", text.includes("data-skrepay-draft-orders-shell"))
  console.log("native draftOrders.domain:", text.includes("draftOrders.domain"))
  console.log("bytes:", text.length)
}
