import prisma from "@/lib/prisma";
import RoomCard from "@/components/public/RoomCard";

// Ambil data kamar + foto pertama + tipe + properti
async function getRooms() {
  return prisma.room.findMany({
    where: { status: { in: ["AVAILABLE", "OCCUPIED"] } }, // sesuaikan bila perlu
    orderBy: { roomNumber: "asc" },
    include: {
      property: true,
      roomType: true,
      images: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });
}

export default async function PropertiesPage() {
  const rooms = await getRooms();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Daftar Kamar</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Pilih kamar yang tersedia. Gambar diperbesar agar detail lebih jelas.
        </p>
      </header>

      {rooms.length === 0 ? (
        <p className="text-gray-500">Belum ada kamar yang ditampilkan.</p>
      ) : (
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room as any} />
          ))}
        </div>
      )}
    </main>
  );
}
