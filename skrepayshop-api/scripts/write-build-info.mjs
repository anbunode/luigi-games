import { execSync } from "child_process"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const repoRoot = resolve(root, "..")

let commit = process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || ""
if (!commit) {
  try {
    commit = execSync("git rev-parse HEAD", {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim()
  } catch {
    commit = "unknown"
  }
}

const payload = JSON.stringify(
  {
    commit,
    builtAt: new Date().toISOString(),
    service: "skrepayshop-api",
  },
  null,
  2
)

const targets = [resolve(root, "apps/backend/build-info.json")]
const serverDir = resolve(root, "apps/backend/.medusa/server")
if (existsSync(serverDir)) {
  targets.push(resolve(serverDir, "build-info.json"))
}

for (const file of targets) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, payload)
}

console.log("build-info:", commit.slice(0, 7), "->", targets.length, "file(s)")
