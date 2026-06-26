type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendSkrepayEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.SKREPAY_EMAIL_FROM || "SkrepayShop <noreply@skrepay.com>"

  if (!apiKey) {
    console.warn(
      `[SkrepayShop email] RESEND_API_KEY no configurada. Destino: ${input.to}\n${input.text}`
    )
    return
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`No se pudo enviar el correo (${response.status}): ${body}`)
  }
}

export function verificationEmailContent(code: string, purpose: "signup" | "password_reset") {
  const title =
    purpose === "signup"
      ? "Confirma tu cuenta en SkrepayShop"
      : "Restablece tu contraseña en SkrepayShop"

  const intro =
    purpose === "signup"
      ? "Usa este código para activar tu cuenta y crear tu tienda:"
      : "Usa este código para elegir una nueva contraseña:"

  return {
    subject: `${code} — ${title}`,
    text: `${title}\n\n${intro}\n\n${code}\n\nEl código expira en 15 minutos.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h1 style="color:#008060;font-size:20px">${title}</h1>
      <p style="color:#616161;line-height:1.5">${intro}</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#1a1a1a">${code}</p>
      <p style="color:#616161;font-size:14px">Expira en 15 minutos. Si no solicitaste esto, ignora este mensaje.</p>
    </div>`,
  }
}
