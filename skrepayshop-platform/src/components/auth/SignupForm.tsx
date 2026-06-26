"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { skrepayUrls } from "@/lib/config"

function slugPreview(shopName: string) {
  return shopName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

export function SignupForm() {
  const router = useRouter()
  const [step, setStep] = useState<"details" | "verify">("details")
  const [shopName, setShopName] = useState("")
  const [slug, setSlug] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const previewSlug = useMemo(() => slug || slugPreview(shopName), [slug, shopName])
  const subdomain = previewSlug
    ? `${previewSlug}.${skrepayUrls.tenantStoreBase}`
    : ""

  const startSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          slug: slug || slugPreview(shopName),
          email,
          password,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "No se pudo iniciar el registro.")
      }

      setMessage(data.message)
      setStep("verify")
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo iniciar el registro."
      )
    } finally {
      setLoading(false)
    }
  }

  const completeSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/signup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || "No se pudo crear la cuenta.")
      }

      router.push("/login?registered=1")
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear la cuenta."
      )
      setLoading(false)
    }
  }

  if (step === "verify") {
    return (
      <form onSubmit={completeSignup} className="space-y-5">
        {message ? (
          <p className="rounded-2xl border border-brand/20 bg-brand-light px-4 py-3 text-sm text-brand-dark">
            {message}
          </p>
        ) : null}

        <div>
          <label htmlFor="code" className="mb-2 block text-sm font-medium text-ink">
            Código de verificación
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
          <p className="mt-2 text-xs text-ink-muted">
            Enviamos el código a <span className="font-medium text-ink">{email}</span>
          </p>
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
          Activar mi cuenta
        </button>

        <button
          type="button"
          onClick={() => setStep("details")}
          className="w-full text-sm text-ink-muted hover:text-ink"
        >
          Volver y corregir datos
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={startSignup} className="space-y-5">
      <div>
        <label htmlFor="shopName" className="mb-2 block text-sm font-medium text-ink">
          Nombre de tu tienda
        </label>
        <input
          id="shopName"
          required
          value={shopName}
          onChange={(event) => setShopName(event.target.value)}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          placeholder="Mi marca"
        />
      </div>

      <div>
        <label htmlFor="slug" className="mb-2 block text-sm font-medium text-ink">
          Subdominio gratis
        </label>
        <input
          id="slug"
          value={slug}
          onChange={(event) => setSlug(slugPreview(event.target.value))}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          placeholder={previewSlug || "mi-marca"}
        />
        {subdomain ? (
          <p className="mt-2 text-xs text-ink-muted">
            Tu tienda: <span className="font-medium text-brand">{subdomain}</span>
          </p>
        ) : null}
      </div>

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
          placeholder="tu@empresa.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
          Contraseña
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
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-70"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Crear cuenta y enviar código
      </button>

      <p className="text-center text-sm text-ink-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  )
}
