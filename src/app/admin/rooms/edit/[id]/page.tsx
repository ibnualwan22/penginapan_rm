'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // <-- 1. Impor useParams
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Ambil tipe RoomType dari Prisma
type RoomType = {
    id: string;
    name: string;
}

export default function EditRoomPage() { // <-- 2. Hapus props 'params'
    const router = useRouter();
    const params = useParams(); // <-- 3. Gunakan hook useParams
    const id = params.id as string;

    const [formData, setFormData] = useState({
        roomNumber: '',
        floor: '',
        roomTypeId: '',
        status: 'AVAILABLE',
    });
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                // Ambil data kamar dan data tipe kamar secara bersamaan
                const [roomRes, typesRes] = await Promise.all([
                    fetch(`/api/rooms/${id}`),
                    fetch('/api/room-types') // API untuk mendapat semua tipe kamar
                ]);

                if (roomRes.ok) {
                    const roomData = await roomRes.json();
                    setFormData({
                        roomNumber: roomData.roomNumber,
                        floor: roomData.floor.toString(),
                        roomTypeId: roomData.roomTypeId,
                        status: roomData.status,
                    });
                }
                
                if (typesRes.ok) {
                    const typesData = await typesRes.json();
                    setRoomTypes(typesData);
                }
                setIsLoading(false);
            };
            fetchData();
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await fetch(`/api/rooms/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        router.push('/admin/rooms');
        router.refresh();
    };

    if (isLoading) return <p className="p-8">Memuat data kamar...</p>;

    return (
        <div className="max-w-lg mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Kamar</CardTitle>
                </CardHeader>
                <CardContent>
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
                            <Select value={formData.roomTypeId} onValueChange={(value) => setFormData({...formData, roomTypeId: value})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {roomTypes.map(rt => (
                                        <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="status">Status Kamar</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                                    <SelectItem value="OCCUPIED">OCCUPIED</SelectItem>
                                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}