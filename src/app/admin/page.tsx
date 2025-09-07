import DashboardStats from "@/components/DashboardStats";
import DashboardCharts from "@/components/DashboardCharts"; // <-- Import
import RoomCard from "@/components/RoomCard"; // <-- Import komponen baru
import prisma from "@/lib/prisma";


async function getRooms() {
  return prisma.room.findMany({
    orderBy: { roomNumber: 'asc' },
    // Sertakan data booking yang relevan
    include: {
      bookings: {
        where: {
          // Hanya ambil booking yang belum checkout
          checkOut: null, 
        },
        select: {
          id: true,
          guestName: true,  // Ambil nama wali santri
          studentName: true, // Ambil nama santri
          expectedCheckOut: true, // <-- Tambahkan ini
        },
      },
    },
  });
}

export default async function AdminDashboardPage() {
  const rooms = await getRooms();

  return (
    // Hapus className="p-8" dari div ini
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <DashboardStats />
      <DashboardCharts /> {/* <-- Panggil komponen di sini */}
      <h2 className="text-xl font-bold mt-8 mb-4">Status Kamar</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}