-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'TRANSFER');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PAID', 'UNPAID');

-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "paymentMethod" "public"."PaymentMethod",
ADD COLUMN     "paymentStatus" "public"."PaymentStatus";
