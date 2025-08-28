'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewRoomPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: '',
    type: 'STANDARD', // Nilai default
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk menangani perubahan pada setiap input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  // Fungsi untuk menangani saat formulir disubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan data. Coba lagi.');
      }

      // Jika berhasil, kembali ke halaman daftar kamar
      router.push('/admin/rooms');
      router.refresh(); // Memastikan data baru muncul di tabel
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tambah Kamar Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700">Nomor Kamar</label>
          <input
            type="text"
            id="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="floor" className="block text-sm font-medium text-gray-700">Lantai</label>
          <input
            type="number"
            id="floor"
            value={formData.floor}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipe Kamar</label>
          <select
            id="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="STANDARD">STANDARD</option>
            <option value="SPECIAL">SPECIAL</option>
          </select>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  );
}