import DeleteRoomButton from '@/components/DeleteRoomButton';
import Link from 'next/link'; // <-- 1. Import Link di bagian atas

// Tipe data untuk satu kamar, agar kode kita lebih aman dan terstruktur
type Room = {
  id: string;
  roomNumber: string;
  floor: number;
  type: 'STANDARD' | 'SPECIAL';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
};

// Fungsi untuk mengambil data dari API kita
async function getRooms() {
  // Kita panggil API GET yang sudah kita buat sebelumnya
  const res = await fetch('http://localhost:3000/api/rooms', {
    // Opsi ini memastikan kita selalu mendapatkan data terbaru
    cache: 'no-store', 
  });

  if (!res.ok) {
    throw new Error('Gagal mengambil data kamar');
  }

  return res.json();
}


// Ini adalah komponen utama halaman kita
export default async function RoomsPage() {
  const rooms = await getRooms();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manajemen Kamar</h1>
        {/* 2. Tambahkan tombol di sini */}
        <Link href="/admin/rooms/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Tambah Kamar Baru
        </Link>
      </div>

      <table className="min-w-full bg-white border">
        <thead>
          <tr className="w-full bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-3 px-6 text-left">Nomor Kamar</th>
            <th className="py-3 px-6 text-left">Lantai</th>
            <th className="py-3 px-6 text-left">Tipe</th>
            <th className="py-3 px-6 text-center">Status</th>
            <th className="py-3 px-6 text-center">Aksi</th> {/* <-- Kolom baru */}
          </tr>
        </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {rooms.map((room) => (
              <tr key={room.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">{room.roomNumber}</td>
                <td className="py-3 px-6 text-left">{room.floor}</td>
                <td className="py-3 px-6 text-left">{room.type}</td>
                <td className="py-3 px-6 text-center">{room.status}</td>
                <td className="py-3 px-6 text-center"> {/* <-- Tombol-tombol aksi */}
                  <div className="flex item-center justify-center space-x-4">
                    <Link href={`/admin/rooms/edit/${room.id}`} className="text-blue-600 hover:text-blue-900">
                      Edit
                    </Link>
                    <DeleteRoomButton roomId={room.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
      </table>
    </div>
  );
}