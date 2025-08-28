-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'RECEPTIONIST');

-- CreateEnum
CREATE TYPE "public"."RoomType" AS ENUM ('STANDARD', 'SPECIAL');

-- CreateEnum
CREATE TYPE "public"."RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."BookingType" AS ENUM ('HALF_DAY', 'FULL_DAY');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'RECEPTIONIST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Room" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "type" "public"."RoomType" NOT NULL DEFAULT 'STANDARD',
    "status" "public"."RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoomImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOut" TIMESTAMP(3),
    "expectedCheckOut" TIMESTAMP(3) NOT NULL,
    "bookingType" "public"."BookingType" NOT NULL,
    "baseFee" DOUBLE PRECISION NOT NULL,
    "lateFee" DOUBLE PRECISION,
    "totalFee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roomId" TEXT NOT NULL,
    "checkedInById" TEXT NOT NULL,
    "checkedOutById" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChargeableItem" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "chargeAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ChargeableItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingCharge" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "bookingId" TEXT NOT NULL,
    "chargeableItemId" TEXT NOT NULL,

    CONSTRAINT "BookingCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Room_roomNumber_key" ON "public"."Room"("roomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ChargeableItem_itemName_key" ON "public"."ChargeableItem"("itemName");

-- AddForeignKey
ALTER TABLE "public"."RoomImage" ADD CONSTRAINT "RoomImage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingCharge" ADD CONSTRAINT "BookingCharge_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingCharge" ADD CONSTRAINT "BookingCharge_chargeableItemId_fkey" FOREIGN KEY ("chargeableItemId") REFERENCES "public"."ChargeableItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
