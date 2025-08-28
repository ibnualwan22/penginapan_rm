// Tipe data untuk statistik kita
type Stats = {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
};

async function getStats(): Promise<Stats> {
  const res = await fetch('http://localhost:3000/api/dashboard/stats', {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Gagal mengambil statistik');
  }
  return res.json();
}

// Komponen Kartu Statistik individual
function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

// Komponen utama yang akan kita ekspor
export default async function DashboardStats() {
  const stats = await getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Kamar" value={stats.totalRooms} />
      <StatCard title="Tersedia" value={stats.availableRooms} />
      <StatCard title="Terisi" value={stats.occupiedRooms} />
      <StatCard title="Dalam Perbaikan" value={stats.maintenanceRooms} />
    </div>
  );
}