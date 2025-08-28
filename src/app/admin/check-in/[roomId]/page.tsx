'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AsyncSelect from 'react-select/async'; // <-- 1. Ganti import menjadi AsyncSelect

type SelectOption = {
  value: string;
  label: string;
  details?: any;
};

export default function CheckInPage({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const { roomId } = params;

  const [guestName, setGuestName] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<SelectOption | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<SelectOption | null>(null);
  const [bookingType, setBookingType] = useState('FULL_DAY');
  const [duration, setDuration] = useState(1); // <-- 1. Tambahkan state untuk durasi

  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Ubah fungsi: Sekarang ia MENGEMBALIKAN (return) data, bukan mengatur state
  const loadSantriOptions = async (inputValue: string) => {
  if (inputValue.length < 3) return [];
  // Ganti URL ke API proksi kita
  const res = await fetch(`/api/students?search=${inputValue}`);
  const { data } = await res.json();
  return data.map((santri: any) => ({
    value: santri.name,
    label: `${santri.name} (${santri.regency})`,
    details: santri,
  }));
};

// Ubah fungsi loadAddressOptions
const loadAddressOptions = async (inputValue: string) => {
  if (inputValue.length < 3) return [];
  // Ganti URL ke API proksi kita
  const res = await fetch(`/api/regencies?name=${inputValue}`);
  const { results } = await res.json();
  return results.map((addr: any) => ({
    value: addr.id.toString(),
    label: addr.label,
  }));
};
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri || !selectedAddress) {
      setError('Nama Santri dan Alamat wajib diisi.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      // ... (Logika handleSubmit tetap sama) ...
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          guestName,
          studentName: selectedSantri?.value,
          addressId: selectedAddress?.value,
          bookingType,
          duration: bookingType === 'FULL_DAY' ? duration : 0, // <-- 2. Kirim durasi

        }),
      });
      if (!res.ok) throw new Error('Gagal melakukan check-in');
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Formulir Check-in</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Nama Wali Santri (tetap sama) */}
        <div>
          <label htmlFor="guestName" className="block text-sm font-medium text-gray-700">Nama Wali Santri</label>
          <input type="text" id="guestName" value={guestName} onChange={(e) => setGuestName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        {/* 3. Ganti komponen Select menjadi AsyncSelect */}
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Cari Nama Santri</label>
          <AsyncSelect
            instanceId="student-select"
            cacheOptions
            defaultOptions
            loadOptions={loadSantriOptions} // <-- Gunakan prop loadOptions
            onChange={setSelectedSantri}
            placeholder="Ketik min. 3 huruf nama santri..."
            isClearable
          />
          {selectedSantri && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
              <p><b>Asrama:</b> {selectedSantri.details.activeDormitory}</p>
              <p><b>Jenis Kelamin:</b> {selectedSantri.details.gender}</p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Cari Alamat (Kabupaten)</label>
          <AsyncSelect
            instanceId="address-select"
            cacheOptions
            defaultOptions
            loadOptions={loadAddressOptions} // <-- Gunakan prop loadOptions
            onChange={setSelectedAddress}
            placeholder="Ketik min. 3 huruf nama kabupaten..."
            isClearable
          />
        </div>
        
        {/* Pilihan Paket */}
        <div>
          <label htmlFor="bookingType" className="block text-sm font-medium text-gray-700">Paket Menginap</label>
          <select 
            id="bookingType" 
            value={bookingType} 
            onChange={(e) => setBookingType(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="FULL_DAY">Satu Hari</option>
            <option value="HALF_DAY">Setengah Hari</option>
          </select>
        </div>
        
        {/* 3. Tampilkan input durasi secara kondisional */}
        {bookingType === 'FULL_DAY' && (
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Lama Durasi (hari)</label>
            <input 
              type="number" 
              id="duration" 
              value={duration} 
              onChange={(e) => setDuration(parseInt(e.target.value))} 
              min="1"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" 
            />
          </div>
        )}
        
        {error && <p className="text-red-500">{error}</p>}
        
        <button type="submit" disabled={isLoading} className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
          {isLoading ? 'Memproses...' : 'Submit Check-in'}
        </button>
      </form>
    </div>
  );
}