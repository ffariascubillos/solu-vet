import { Resend } from "resend"
import type { EmailSender } from "./email-sender.js"

export class ResendEmailSender implements EmailSender {
  private _client: Resend | undefined

  private getClient(): Resend {
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        "RESEND_API_KEY no está definida. Configúrala en apps/api/.env antes de enviar correos.",
      )
    }

    if (!this._client) {
      this._client = new Resend(process.env.RESEND_API_KEY)
    }

    return this._client
  }

  private getEmailFrom(): string {
    if (!process.env.EMAIL_FROM) {
      throw new Error(
        "EMAIL_FROM no está definida. Configúrala en apps/api/.env antes de enviar correos.",
      )
    }

    return process.env.EMAIL_FROM
  }

  async sendActivationEmail(to: string, activationUrl: string): Promise<void> {
    await this.getClient().emails.send({
      from: this.getEmailFrom(),
      to,
      subject: "Activa tu cuenta en soluVet",
      html: `<p>Activa tu cuenta haciendo clic en el siguiente enlace: <a href="${activationUrl}">${activationUrl}</a></p>`,
    })
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.getClient().emails.send({
      from: this.getEmailFrom(),
      to,
      subject: "Restablece tu contraseña en soluVet",
      html: `<p>Restablece tu contraseña haciendo clic en el siguiente enlace: <a href="${resetUrl}">${resetUrl}</a></p>`,
    })
  }
}

export const emailSender: EmailSender = new ResendEmailSender()
