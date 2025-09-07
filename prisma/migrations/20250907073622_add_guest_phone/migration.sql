/*
  Warnings:

  - You are about to drop the column `bookingType` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `durationInDays` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Booking" DROP COLUMN "bookingType",
ADD COLUMN     "durationInDays" INTEGER NOT NULL,
ADD COLUMN     "guestPhone" TEXT;
