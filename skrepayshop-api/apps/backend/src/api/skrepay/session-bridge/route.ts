import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPlatformLoginUrl } from "../../../lib/platform-url"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : ""

  if (!token) {
    res.status(302).setHeader("Location", getPlatformLoginUrl()).end()
    return
  }

  const loginUrl = escapeHtml(getPlatformLoginUrl())
  const safeToken = JSON.stringify(token)

  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")
  res.status(200).send(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SkrepayShop — entrando al panel</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: system-ui, sans-serif;
        background: #f6f6f1;
        color: #1a1a1a;
      }
    </style>
  </head>
  <body>
    <p>Abriendo tu panel SkrepayShop…</p>
    <script>
      (async function () {
        const loginUrl = ${JSON.stringify(loginUrl)};
        const token = ${safeToken};

        try {
          const response = await fetch("/auth/session", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + token,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (response.ok) {
            window.location.replace("/app");
            return;
          }
        } catch (error) {
          console.error(error);
        }

        window.location.replace(loginUrl);
      })();
    </script>
  </body>
</html>`)
}
