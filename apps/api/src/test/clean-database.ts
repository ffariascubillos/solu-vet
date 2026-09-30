import { prisma } from "../lib/prisma.js"

export async function cleanDatabase() {
  await prisma.consultation.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.tutor.deleteMany()
  await prisma.userInvitation.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
}
