import { skrepayUrls } from "@/lib/config"

export async function establishMedusaSession(token: string): Promise<boolean> {
  const response = await fetch(`${skrepayUrls.api}/auth/session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  return response.ok
}
