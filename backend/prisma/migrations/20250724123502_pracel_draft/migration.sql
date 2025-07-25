/*
  Warnings:

  - The `unit` column on the `dimensions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `weightUnit` column on the `parcels` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `area` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `county` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Made the column `createdAt` on table `addresses` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `dimensions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `parcels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `parcels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'MPESA', 'BANK_TRANSFER', 'CASH_ON_DELIVERY');

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('kg', 'lb', 'g', 'oz');

-- CreateEnum
CREATE TYPE "DimensionUnit" AS ENUM ('cm', 'in', 'm', 'ft');

-- CreateEnum
CREATE TYPE "PickupPointType" AS ENUM ('SENDIT_CENTER', 'PARTNER_LOCATION', 'MALL_LOCKER', 'POST_OFFICE', 'RETAIL_STORE');

-- CreateEnum
CREATE TYPE "KenyanCounty" AS ENUM ('BARINGO', 'BOMET', 'BUNGOMA', 'BUSIA', 'ELGEYO_MARAKWET', 'EMBU', 'GARISSA', 'HOMA_BAY', 'ISIOLO', 'KAJIADO', 'KAKAMEGA', 'KERICHO', 'KIAMBU', 'KILIFI', 'KIRINYAGA', 'KISII', 'KISUMU', 'KITUI', 'KWALE', 'LAIKIPIA', 'LAMU', 'MACHAKOS', 'MAKUENI', 'MANDERA', 'MARSABIT', 'MERU', 'MIGORI', 'MOMBASA', 'MURANGA', 'NAIROBI', 'NAKURU', 'NANDI', 'NAROK', 'NYAMIRA', 'NYANDARUA', 'NYERI', 'SAMBURU', 'SIAYA', 'TAITA_TAVETA', 'TANA_RIVER', 'THARAKA_NITHI', 'TRANS_NZOIA', 'TURKANA', 'UASIN_GISHU', 'VIHIGA', 'WAJIR', 'WEST_POKOT');

-- AlterEnum
ALTER TYPE "AttemptStatus" ADD VALUE 'FAILED_WEATHER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationStatus" ADD VALUE 'QUEUED';
ALTER TYPE "NotificationStatus" ADD VALUE 'DELIVERED';
ALTER TYPE "NotificationStatus" ADD VALUE 'RETRY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PUSH';
ALTER TYPE "NotificationType" ADD VALUE 'WEBHOOK';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ParcelStatus" ADD VALUE 'DRAFT';
ALTER TYPE "ParcelStatus" ADD VALUE 'PAYMENT_PENDING';
ALTER TYPE "ParcelStatus" ADD VALUE 'PAYMENT_CONFIRMED';
ALTER TYPE "ParcelStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- DropIndex
DROP INDEX "addresses_email_phone_key";

-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "area" TEXT NOT NULL,
ADD COLUMN     "county" "KenyanCounty" NOT NULL,
ADD COLUMN     "isValidated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "validatedAt" TIMESTAMP(3),
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "country" SET DEFAULT 'Kenya',
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "delivery_attempts" ADD COLUMN     "courierNotes" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "dimensions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "volumetricWeight" DOUBLE PRECISION,
DROP COLUMN "unit",
ADD COLUMN     "unit" "DimensionUnit" NOT NULL DEFAULT 'cm';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "recipient" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subject" TEXT;

-- AlterTable
ALTER TABLE "parcels" ADD COLUMN     "contactlessDelivery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'KES',
ADD COLUMN     "deliverySpeedSurcharge" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "holdAtPickupPoint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "insuranceCost" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "leaveWithNeighbor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "packagingInstructions" TEXT,
ADD COLUMN     "pickupTimeSlot" TEXT,
ADD COLUMN     "retryNextBusinessDay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "returnToSender" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "serviceSurcharge" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "specialHandlingSurcharge" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "weightSurcharge" DOUBLE PRECISION DEFAULT 0,
DROP COLUMN "weightUnit",
ADD COLUMN     "weightUnit" "WeightUnit" DEFAULT 'kg';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "cardBrand" TEXT,
ADD COLUMN     "cardLast4" TEXT,
ADD COLUMN     "paymentIntentMetadata" JSONB,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "stripeClientSecret" TEXT,
ALTER COLUMN "stripePaymentIntentId" DROP NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'KES';

-- AlterTable
ALTER TABLE "tracking_history" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "saved_recipients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "addressId" TEXT NOT NULL,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_drafts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stepData" JSONB NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcel_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_history" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "pricing" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_points" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PickupPointType" NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "county" "KenyanCounty" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "hours" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "services" TEXT[],
    "rating" DOUBLE PRECISION DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_recipients_userId_lastUsed_idx" ON "saved_recipients"("userId", "lastUsed");

-- CreateIndex
CREATE UNIQUE INDEX "saved_recipients_userId_email_phone_key" ON "saved_recipients"("userId", "email", "phone");

-- CreateIndex
CREATE INDEX "parcel_drafts_userId_idx" ON "parcel_drafts"("userId");

-- CreateIndex
CREATE INDEX "parcel_drafts_expiresAt_idx" ON "parcel_drafts"("expiresAt");

-- CreateIndex
CREATE INDEX "pricing_history_parcelId_idx" ON "pricing_history"("parcelId");

-- CreateIndex
CREATE INDEX "pickup_points_county_city_idx" ON "pickup_points"("county", "city");

-- CreateIndex
CREATE INDEX "pickup_points_latitude_longitude_idx" ON "pickup_points"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "pickup_points_isActive_idx" ON "pickup_points"("isActive");

-- CreateIndex
CREATE INDEX "addresses_county_idx" ON "addresses"("county");

-- CreateIndex
CREATE INDEX "addresses_city_idx" ON "addresses"("city");

-- CreateIndex
CREATE INDEX "addresses_latitude_longitude_idx" ON "addresses"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "delivery_attempts_parcelId_idx" ON "delivery_attempts"("parcelId");

-- CreateIndex
CREATE INDEX "notifications_status_queuedAt_idx" ON "notifications"("status", "queuedAt");

-- CreateIndex
CREATE INDEX "notifications_parcelId_idx" ON "notifications"("parcelId");

-- CreateIndex
CREATE INDEX "parcels_senderId_idx" ON "parcels"("senderId");

-- CreateIndex
CREATE INDEX "parcels_recipientId_idx" ON "parcels"("recipientId");

-- CreateIndex
CREATE INDEX "parcels_createdAt_idx" ON "parcels"("createdAt");

-- CreateIndex
CREATE INDEX "parcels_estimatedDelivery_idx" ON "parcels"("estimatedDelivery");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_parcelId_idx" ON "payments"("parcelId");

-- CreateIndex
CREATE INDEX "tracking_history_parcelId_timestamp_idx" ON "tracking_history"("parcelId", "timestamp");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- AddForeignKey
ALTER TABLE "saved_recipients" ADD CONSTRAINT "saved_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_recipients" ADD CONSTRAINT "saved_recipients_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_drafts" ADD CONSTRAINT "parcel_drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_history" ADD CONSTRAINT "pricing_history_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
