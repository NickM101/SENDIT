/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `parcel_drafts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "parcel_drafts_userId_key" ON "parcel_drafts"("userId");
