import { Resend } from "resend"
import type { EmailSender } from "./email-sender.js"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM

if (!RESEND_API_KEY) {
  throw new Error(
    "RESEND_API_KEY no está definida. Configúrala en apps/api/.env antes de arrancar la API.",
  )
}

if (!EMAIL_FROM) {
  throw new Error(
    "EMAIL_FROM no está definida. Configúrala en apps/api/.env antes de arrancar la API.",
  )
}

export class ResendEmailSender implements EmailSender {
  private client = new Resend(RESEND_API_KEY)

  async sendActivationEmail(to: string, activationUrl: string): Promise<void> {
    await this.client.emails.send({
      from: EMAIL_FROM!,
      to,
      subject: "Activa tu cuenta en soluVet",
      html: `<p>Activa tu cuenta haciendo clic en el siguiente enlace: <a href="${activationUrl}">${activationUrl}</a></p>`,
    })
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.client.emails.send({
      from: EMAIL_FROM!,
      to,
      subject: "Restablece tu contraseña en soluVet",
      html: `<p>Restablece tu contraseña haciendo clic en el siguiente enlace: <a href="${resetUrl}">${resetUrl}</a></p>`,
    })
  }
}

export const emailSender: EmailSender = new ResendEmailSender()
