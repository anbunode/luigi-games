import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/AuthShell"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

export const metadata: Metadata = {
  title: "Nueva contraseña",
}

type PageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams
  const initialEmail = params.email || ""

  return (
    <AuthShell
      title="Elige una nueva contraseña"
      description="Introduce el código que recibiste por correo y tu nueva contraseña."
    >
      <ResetPasswordForm initialEmail={initialEmail} />
    </AuthShell>
  )
}
