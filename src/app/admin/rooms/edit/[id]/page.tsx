'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Tipe data untuk kamar
type Room = {
  roomNumber: string;
  floor: string;
  type: 'STANDARD' | 'SPECIAL';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
};

export default function EditRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params; // Ambil ID dari URL
  const [formData, setFormData] = useState<Room>({
    roomNumber: '',
    floor: '',
    type: 'STANDARD',
    status: 'AVAILABLE',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect untuk mengambil data kamar saat halaman pertama kali dimuat
  useEffect(() => {
    if (id) {
      const fetchRoomData = async () => {
        try {
          const res = await fetch(`/api/rooms/${id}`);
          if (!res.ok) throw new Error('Gagal mengambil data kamar');
          const data = await res.json();
          // Set form data dengan data yang ada
          setFormData({
            roomNumber: data.roomNumber,
            floor: data.floor.toString(),
            type: data.type,
            status: data.status,
          });
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRoomData();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  // Fungsi untuk mengirim data yang sudah diubah
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'PATCH', // Gunakan method PATCH untuk update
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Gagal memperbarui data');

      router.push('/admin/rooms');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <p className="p-8">Memuat data...</p>;

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Kamar</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Nomor Kamar */}
        <div>
          <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700">Nomor Kamar</label>
          <input
            type="text"
            id="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        {/* Input Lantai */}
        <div>
          <label htmlFor="floor" className="block text-sm font-medium text-gray-700">Lantai</label>
          <input
            type="number"
            id="floor"
            value={formData.floor}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        {/* Pilihan Tipe Kamar */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipe Kamar</label>
          <select
            id="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="STANDARD">STANDARD</option>
            <option value="SPECIAL">SPECIAL</option>
          </select>
        </div>

        {/* Pilihan Status Kamar */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status Kamar</label>
          <select
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="OCCUPIED">OCCUPIED</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}