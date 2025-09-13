-- DropForeignKey
ALTER TABLE "public"."Room" DROP CONSTRAINT "Room_roomTypeId_fkey";

-- AlterTable
ALTER TABLE "public"."Room" ALTER COLUMN "roomTypeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "public"."RoomType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
