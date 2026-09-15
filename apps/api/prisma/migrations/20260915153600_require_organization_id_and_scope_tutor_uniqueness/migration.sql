-- DropForeignKey
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Tutor" DROP CONSTRAINT "Tutor_organizationId_fkey";

-- DropIndex
DROP INDEX "Tutor_email_key";

-- DropIndex
DROP INDEX "Tutor_rut_key";

-- AlterTable
ALTER TABLE "Consultation" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Patient" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tutor" ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Consultation_organizationId_idx" ON "Consultation"("organizationId");

-- CreateIndex
CREATE INDEX "Patient_organizationId_idx" ON "Patient"("organizationId");

-- CreateIndex
CREATE INDEX "Tutor_organizationId_idx" ON "Tutor"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_rut_organizationId_key" ON "Tutor"("rut", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_email_organizationId_key" ON "Tutor"("email", "organizationId");

-- AddForeignKey
ALTER TABLE "Tutor" ADD CONSTRAINT "Tutor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
