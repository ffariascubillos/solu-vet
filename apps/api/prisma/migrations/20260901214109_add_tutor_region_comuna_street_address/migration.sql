/*
  Warnings:

  - You are about to drop the column `address` on the `Tutor` table. All the data in the column will be lost.
  - Added the required column `comuna` to the `Tutor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region` to the `Tutor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `streetAddress` to the `Tutor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tutor" DROP COLUMN "address",
ADD COLUMN     "comuna" TEXT NOT NULL,
ADD COLUMN     "region" TEXT NOT NULL,
ADD COLUMN     "streetAddress" TEXT NOT NULL;
