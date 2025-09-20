import prisma from "@/lib/prisma";
import PhotoUploader from "@/components/rooms/PhotoUploader";
import { notFound } from "next/navigation";

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
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Kelola Foto untuk Kamar {room.roomNumber}
      </h1>
      <PhotoUploader room={room} />
    </div>
  );
}
