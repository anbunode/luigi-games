import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginPageClient } from "@/components/login/LoginPageClient"

export const metadata: Metadata = {
  title: "Iniciar sesión",
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  )
}
