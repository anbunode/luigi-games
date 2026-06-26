import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/AuthShell"
import { SignupForm } from "@/components/auth/SignupForm"

export const metadata: Metadata = {
  title: "Crear cuenta",
}

export default function SignupPage() {
  return (
    <AuthShell
      title="Crea tu cuenta gratis"
      description="Registra tu tienda en SkrepayShop. Te enviaremos un código por correo para confirmar tu cuenta."
    >
      <SignupForm />
    </AuthShell>
  )
}
