import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
      <h3 className="text-gray-500 text-sm font-medium dark:text-gray-400">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

export default async function DashboardStats({ propertyId }: { propertyId?: string | null }) {
  const session = await getServerSession(authOptions);
  
  // --- PERBAIKAN KRITIS DI SINI ---
  // Tambahkan '?' setelah managedProperties untuk keamanan
  const managedPropertyIds = session?.user?.managedProperties?.map(p => p.id) || [];

  if (managedPropertyIds.length === 0) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Kamar" value={0} />
            <StatCard title="Tersedia" value={0} />
            <StatCard title="Terisi" value={0} />
            <StatCard title="Dalam Perbaikan" value={0} />
        </div>
    );
  }

  const propertyFilter = propertyId ? [propertyId] : managedPropertyIds;
  const whereClause = { propertyId: { in: propertyFilter } };

  const [totalRooms, availableRooms, occupiedRooms, maintenanceRooms] = 
    await Promise.all([
      prisma.room.count({ where: whereClause }),
      prisma.room.count({ where: { ...whereClause, status: 'AVAILABLE' } }),
      prisma.room.count({ where: { ...whereClause, status: 'OCCUPIED' } }),
      prisma.room.count({ where: { ...whereClause, status: 'MAINTENANCE' } }),
    ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Kamar" value={totalRooms} />
      <StatCard title="Tersedia" value={availableRooms} />
      <StatCard title="Terisi" value={occupiedRooms} />
      <StatCard title="Dalam Perbaikan" value={maintenanceRooms} />
    </div>
  );
}
