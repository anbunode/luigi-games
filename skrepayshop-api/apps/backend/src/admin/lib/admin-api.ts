export async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(parseAdminErrorMessage(message, response.status))
  }

  return response.json() as Promise<T>
}

function parseAdminErrorMessage(message: string, status: number): string {
  if (!message) {
    return `Request failed (${status})`
  }

  try {
    const json = JSON.parse(message) as { message?: string; type?: string }

    if (typeof json.message === "string" && json.message.trim()) {
      return json.message
    }
  } catch {
    // fall through
  }

  if (message.length > 240) {
    return `Request failed (${status})`
  }

  return message
}
