'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CreateRoomForm({ roomTypes, managedProperties, properties }: { roomTypes: any[], managedProperties: any[], properties: any[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: '',
    roomTypeId: '',
    propertyId: managedProperties.length === 1 ? managedProperties[0].id : '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFreeProperty, setIsFreeProperty] = useState(false);

  // Cek apakah properti yang dipilih gratis
  useEffect(() => {
    const selectedProp = properties.find(p => p.id === formData.propertyId);
    if (selectedProp) {
        setIsFreeProperty(selectedProp.isFree);
        if (selectedProp.isFree) {
            // Jika gratis, otomatis pilih tipe kamar pertama (default)
            const defaultType = roomTypes.find(rt => rt.name === 'STANDARD');
            if (defaultType) {
                setFormData(prev => ({ ...prev, roomTypeId: defaultType.id }));
            }
        }
    }
  }, [formData.propertyId, properties, roomTypes]);

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
      {/* Tampilkan dropdown properti HANYA jika pengguna mengelola > 1 properti */}
      {managedProperties.length > 1 && (
        <div>
          <Label htmlFor="propertyId">Properti</Label>
          <Select onValueChange={(value) => setFormData({...formData, propertyId: value})} required>
            <SelectTrigger><SelectValue placeholder="Pilih properti..." /></SelectTrigger>
            <SelectContent>
              {managedProperties.map(prop => (
                <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="roomNumber">Nomor Kamar</Label>
        <Input id="roomNumber" value={formData.roomNumber} onChange={(e) => setFormData({...formData, roomNumber: e.target.value})} required />
      </div>

      <div>
        <Label htmlFor="floor">Lantai</Label>
        <Input id="floor" type="number" value={formData.floor} onChange={(e) => setFormData({...formData, floor: e.target.value})} required />
      </div>
      
      {!isFreeProperty && (
        <div>
          <Label htmlFor="roomTypeId">Tipe Kamar</Label>
          <Select value={formData.roomTypeId} onValueChange={(value) => setFormData({...formData, roomTypeId: value})} required>
            <SelectTrigger><SelectValue placeholder="Pilih tipe..." /></SelectTrigger>
            <SelectContent>
              {roomTypes.map(rt => (
                <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Menyimpan...' : 'Simpan Kamar'}
      </Button>
    </form>
  );
}