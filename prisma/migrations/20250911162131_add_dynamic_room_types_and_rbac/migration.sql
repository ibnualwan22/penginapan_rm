/*
  Warnings:

  - You are about to drop the column `type` on the `Room` table. All the data in the column will be lost.
  - Added the required column `roomTypeId` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Room" DROP COLUMN "type",
ADD COLUMN     "roomTypeId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."RoomType";

-- CreateTable
CREATE TABLE "public"."RoomType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceHalfDay" DOUBLE PRECISION NOT NULL,
    "priceFullDay" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_name_key" ON "public"."RoomType"("name");

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "public"."RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
