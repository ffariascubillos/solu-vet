export interface EmailSender {
  sendActivationEmail(to: string, activationUrl: string): Promise<void>
  sendPasswordResetEmail(to: string, resetUrl: string): Promise<void>
}
