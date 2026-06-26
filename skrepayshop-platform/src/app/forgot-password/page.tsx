import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/AuthShell"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"

export const metadata: Metadata = {
  title: "Recuperar contraseña",
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="¿Olvidaste tu contraseña?"
      description="Introduce tu correo y te enviaremos un código para elegir una nueva contraseña."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
