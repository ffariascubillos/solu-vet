import { Resend } from "resend"

export interface EmailSender {
  sendActivationEmail(to: string, activationUrl: string): Promise<void>
}

export function createResendEmailSender(): EmailSender {
  const resend = new Resend(process.env.RESEND_API_KEY)

  return {
    async sendActivationEmail(to: string, activationUrl: string) {
      await resend.emails.send({
        from: "soluVet <onboarding@resend.dev>",
        to,
        subject: "Activa tu cuenta en soluVet",
        html: `<p>Activa tu cuenta haciendo clic en el siguiente enlace: <a href="${activationUrl}">${activationUrl}</a></p>`,
      })
    },
  }
}
