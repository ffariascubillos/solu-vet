-- CreateEnum
CREATE TYPE "PatientSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ReproductiveStatus" AS ENUM ('STERILIZED', 'NOT_STERILIZED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutor" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "sex" "PatientSex" NOT NULL,
    "age" INTEGER,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "reproductiveStatus" "ReproductiveStatus" NOT NULL,
    "tutorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "remoteAnamnesis" TEXT,
    "consultationReason" TEXT NOT NULL,
    "currentAnamnesis" TEXT,
    "clinicalExam" TEXT,
    "diagnosis" TEXT,
    "inClinicTreatment" TEXT,
    "complementaryTests" TEXT,
    "testResults" TEXT,
    "consultationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeTreatment" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeTreatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationDetail" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccineRecord" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaccineRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_email_key" ON "Tutor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_rut_key" ON "Tutor"("rut");

-- CreateIndex
CREATE INDEX "Patient_firstName_idx" ON "Patient"("firstName");

-- CreateIndex
CREATE INDEX "Patient_tutorId_idx" ON "Patient"("tutorId");

-- CreateIndex
CREATE INDEX "Consultation_patientId_idx" ON "Consultation"("patientId");

-- CreateIndex
CREATE INDEX "Consultation_consultationDate_idx" ON "Consultation"("consultationDate");

-- CreateIndex
CREATE UNIQUE INDEX "HomeTreatment_consultationId_key" ON "HomeTreatment"("consultationId");

-- CreateIndex
CREATE INDEX "FollowUp_consultationId_idx" ON "FollowUp"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationDetail_consultationId_key" ON "ConsultationDetail"("consultationId");

-- CreateIndex
CREATE INDEX "VaccineRecord_consultationId_idx" ON "VaccineRecord"("consultationId");

-- CreateIndex
CREATE INDEX "Attachment_consultationId_idx" ON "Attachment"("consultationId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeTreatment" ADD CONSTRAINT "HomeTreatment_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationDetail" ADD CONSTRAINT "ConsultationDetail_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccineRecord" ADD CONSTRAINT "VaccineRecord_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
