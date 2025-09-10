import DashboardStats from "@/components/DashboardStats";
import DashboardCharts from "@/components/DashboardCharts";
import RoomCard from "@/components/RoomCard";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function getRooms() {
  return prisma.room.findMany({
    orderBy: { roomNumber: 'asc' },
    include: {
      bookings: {
        where: { checkOut: null },
        select: {
          id: true,
          guestName: true,
          studentName: true,
          expectedCheckOut: true,
        },
      },
    },
  });
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const userPermissions = session?.user?.permissions || [];
  
  // Variabel ini sekarang hanya mengontrol visibilitas grafik
  const canViewCharts = userPermissions.includes('dashboard:read:statistics');

  const rooms = await getRooms();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* 1. Komponen Statistik Angka - selalu terlihat */}
      <DashboardStats />

      {/* 2. Komponen Grafik - hanya ditampilkan jika punya izin */}
      {canViewCharts && (
        <DashboardCharts />
      )}

      {/* 3. Status Kamar - kembali menjadi judul biasa */}
      <h2 className="text-xl font-bold mt-8 mb-4">Status Kamar</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
      
    </div>
  );
}

