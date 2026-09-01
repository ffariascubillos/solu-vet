/*
  Warnings:

  - You are about to drop the column `breed` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `species` on the `Patient` table. All the data in the column will be lost.
  - Added the required column `breedId` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `speciesId` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "breed",
DROP COLUMN "species",
ADD COLUMN     "breedId" TEXT NOT NULL,
ADD COLUMN     "speciesId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Breed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Breed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Species_name_key" ON "Species"("name");

-- CreateIndex
CREATE INDEX "Breed_speciesId_idx" ON "Breed"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "Breed_name_speciesId_key" ON "Breed"("name", "speciesId");

-- CreateIndex
CREATE INDEX "Patient_speciesId_idx" ON "Patient"("speciesId");

-- CreateIndex
CREATE INDEX "Patient_breedId_idx" ON "Patient"("breedId");

-- AddForeignKey
ALTER TABLE "Breed" ADD CONSTRAINT "Breed_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "Breed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
