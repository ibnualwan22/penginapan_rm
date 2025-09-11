'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Terima daftar tipe kamar sebagai properti
export default function CreateRoomForm({ roomTypes }: { roomTypes: any[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: '',
    roomTypeId: '', // <-- State baru
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    router.push('/admin/rooms');
    router.refresh();
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="roomNumber">Nomor Kamar</Label>
        <Input id="roomNumber" value={formData.roomNumber} onChange={(e) => setFormData({...formData, roomNumber: e.target.value})} required />
      </div>

      <div>
        <Label htmlFor="floor">Lantai</Label>
        <Input id="floor" type="number" value={formData.floor} onChange={(e) => setFormData({...formData, floor: e.target.value})} required />
      </div>
      
      <div>
        <Label htmlFor="roomTypeId">Tipe Kamar</Label>
        <Select onValueChange={(value) => setFormData({...formData, roomTypeId: value})} required>
          <SelectTrigger><SelectValue placeholder="Pilih tipe..." /></SelectTrigger>
          <SelectContent>
            {roomTypes.map(rt => (
              <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Menyimpan...' : 'Simpan Kamar'}
      </Button>
    </form>
  );
}