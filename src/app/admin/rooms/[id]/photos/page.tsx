import prisma from "@/lib/prisma";
import PhotoUploader from "@/components/rooms/PhotoUploader";
import { notFound } from "next/navigation";
import RoomImageManager from '@/components/admin/RoomImageManager';

async function getRoom(id: string) {
  return prisma.room.findUnique({
    where: { id },
    include: { images: true }, // foto yang sudah ada
  });
}

type Params =
  | { id: string }
  | Promise<{ id: string }>;

export default async function RoomPhotosPage({ params }: { params: Params }) {
  const p = await params;              // ✅ WAJIB: await
  const room = await getRoom(p.id);

  if (!room) return notFound();        // ✅ lebih idiomatik

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow">
   <RoomImageManager 
      roomId={room.id} 
      initialImages={room.images} 
   />
</div>
  );
}
