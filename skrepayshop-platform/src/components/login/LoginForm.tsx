"use client"

import { useState } from "react"
import Link from "next/link"
import { LoaderCircle } from "lucide-react"
import { platformConfig } from "@/lib/config"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || "No se pudo iniciar sesión.")
      }

      const target = data.redirectUrl || platformConfig.adminUrl

      setRedirecting(true)
      window.location.replace(target)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo iniciar sesión."
      )
      setLoading(false)
    }
  }

  if (redirecting) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm font-medium text-ink">
          Acceso correcto. Abriendo tu panel…
        </p>
        <p className="text-xs text-ink-muted">{platformConfig.panelUrl}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-ink"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand/10"
          placeholder="tu@empresa.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-ink"
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand/10"
          placeholder="••••••••"
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Entrar al panel
      </button>

      <p className="text-center text-sm text-ink-muted">
        ¿Primera vez?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Crea tu cuenta gratis
        </Link>
      </p>
    </form>
  )
}
