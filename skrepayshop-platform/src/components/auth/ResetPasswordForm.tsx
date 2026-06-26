"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"

export function ResetPasswordForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar la contraseña.")
      }

      router.push("/login?reset=1")
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo actualizar la contraseña."
      )
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </div>

      <div>
        <label htmlFor="code" className="mb-2 block text-sm font-medium text-ink">
          Código recibido por correo
        </label>
        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-center text-lg tracking-[0.4em] text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          placeholder="000000"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
          Nueva contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || code.length < 6}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-70"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Guardar nueva contraseña
      </button>

      <p className="text-center text-sm text-ink-muted">
        <Link href="/forgot-password" className="font-medium text-brand hover:underline">
          Reenviar código
        </Link>
      </p>
    </form>
  )
}
