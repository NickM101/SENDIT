/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `parcels` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "parcels" DROP COLUMN "imageUrl";
