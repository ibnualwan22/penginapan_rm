import prisma from "@/lib/prisma"; // 1. Ambil prisma langsung

// Komponen Kartu Statistik individual (tidak ada perubahan)
function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h3 className="text-gray-500 text-sm font-medium dark:text-gray-400">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

// Komponen utama yang akan kita ekspor
export default async function DashboardStats() {
  // 2. Logika dari API dipindahkan langsung ke sini
  const [totalRooms, availableRooms, occupiedRooms, maintenanceRooms] = 
    await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: 'AVAILABLE' } }),
      prisma.room.count({ where: { status: 'OCCUPIED' } }),
      prisma.room.count({ where: { status: 'MAINTENANCE' } }),
    ]);

  const stats = {
    totalRooms,
    availableRooms,
    occupiedRooms,
    maintenanceRooms,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Kamar" value={stats.totalRooms} />
      <StatCard title="Tersedia" value={stats.availableRooms} />
      <StatCard title="Terisi" value={stats.occupiedRooms} />
      <StatCard title="Dalam Perbaikan" value={stats.maintenanceRooms} />
    </div>
  );
}
