'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditRoomForm({ room, roomTypes, managedProperties, properties }: { room: any, roomTypes: any[], managedProperties: any[], properties: any[] }) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        roomNumber: room.roomNumber,
        floor: room.floor.toString(),
        roomTypeId: room.roomTypeId,
        propertyId: room.propertyId,
        status: room.status,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isFreeProperty, setIsFreeProperty] = useState(room.property.isFree);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await fetch(`/api/rooms/${room.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        router.push('/admin/rooms');
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Properti tidak bisa diubah saat edit */}
            <div>
                <Label>Properti</Label>
                <Input value={room.property.name} disabled />
            </div>

            <div>
                <Label htmlFor="roomNumber">Nomor Kamar</Label>
                <Input id="roomNumber" value={formData.roomNumber} onChange={(e) => setFormData({...formData, roomNumber: e.target.value})} required />
            </div>
            <div>
                <Label htmlFor="floor">Lantai</Label>
                <Input id="floor" type="number" value={formData.floor} onChange={(e) => setFormData({...formData, floor: e.target.value})} required />
            </div>
            
            {/* Sembunyikan Tipe Kamar jika properti gratis */}
            {!isFreeProperty && (
                <div>
                    <Label htmlFor="roomTypeId">Tipe Kamar</Label>
                    <Select value={formData.roomTypeId} onValueChange={(value) => setFormData({...formData, roomTypeId: value})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {roomTypes.map(rt => (
                                <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            <div>
                <Label htmlFor="status">Status Kamar</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AVAILABLE">Tersedia</SelectItem>
                        <SelectItem value="OCCUPIED">Terisi</SelectItem>
                        <SelectItem value="MAINTENANCE">Perbaikan</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
        </form>
    );
}