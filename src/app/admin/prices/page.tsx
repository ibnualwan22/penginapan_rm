'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Edit, Plus, Loader2, DollarSign, Ban } from 'lucide-react';
import { useSession } from 'next-auth/react'; // Untuk cek akses RJ/RM

type RoomType = {
  id: string;
  name: string;
  priceHalfDay: number;
  priceFullDay: number;
};

export default function PriceManagementPage() {
  const { data: session } = useSession();
  const [types, setTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formHalf, setFormHalf] = useState('');
  const [formFull, setFormFull] = useState('');

  // 1. Cek Hak Akses (Hide logic di level halaman juga biar aman)
  // Jika user hanya punya properti FREE (RJ), tolak akses.
  const isFreePropertyOnly = session?.user?.managedProperties?.every((p: any) => p.isFree);

  // 2. Load Data
  const fetchTypes = async () => {
    setLoading(true);
    const res = await fetch('/api/room-types');
    if (res.ok) setTypes(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchTypes();
  }, [session]);

  // Jika Admin RJ mencoba masuk via URL langsung, tampilkan pesan dilarang
  if (isFreePropertyOnly) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
            <Ban className="w-16 h-16 mb-4 text-red-300"/>
            <h2 className="text-xl font-bold text-gray-700">Akses Dibatasi</h2>
            <p>Menu Manajemen Harga tidak tersedia untuk properti gratis (RJ).</p>
        </div>
    );
  }

  // 3. Handle Add/Edit
  const openAdd = () => {
    setCurrentId(null);
    setFormName('');
    setFormHalf('');
    setFormFull('');
    setIsModalOpen(true);
  };

  const openEdit = (t: RoomType) => {
    setCurrentId(t.id);
    setFormName(t.name);
    setFormHalf(t.priceHalfDay.toString());
    setFormFull(t.priceFullDay.toString());
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const method = currentId ? 'PUT' : 'POST';
        const res = await fetch('/api/room-types', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: currentId,
                name: formName,
                priceHalfDay: formHalf,
                priceFullDay: formFull
            })
        });

        if (!res.ok) throw new Error('Gagal menyimpan');
        
        setIsModalOpen(false);
        fetchTypes();
    } catch (error) {
        alert('Gagal menyimpan data');
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus tipe kamar ini? Kamar yang menggunakan tipe ini mungkin akan error harganya.')) return;
    const res = await fetch(`/api/room-types?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchTypes();
    else alert('Gagal menghapus. Pastikan tidak ada kamar yang menggunakan tipe ini.');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6"/> Manajemen Harga & Tipe Kamar
        </h1>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Tambah Tipe Baru
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama Tipe</TableHead>
                        <TableHead>Harga Setengah Hari</TableHead>
                        <TableHead>Harga Full Day (24 Jam)</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                    ) : types.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">Belum ada tipe kamar.</TableCell></TableRow>
                    ) : (
                        types.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell className="font-bold">{t.name}</TableCell>
                                <TableCell>Rp {t.priceHalfDay.toLocaleString('id-ID')}</TableCell>
                                <TableCell>Rp {t.priceFullDay.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(t)}><Edit className="w-4 h-4 text-blue-600"/></Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4 text-red-600"/></Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{currentId ? 'Edit Harga' : 'Tambah Tipe Kamar'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
                <div>
                    <Label>Nama Tipe (Misal: VIP, Standard)</Label>
                    <Input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="Contoh: STANDARD" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Harga Setengah Hari</Label>
                        <Input type="number" value={formHalf} onChange={e => setFormHalf(e.target.value)} required placeholder="0" />
                    </div>
                    <div>
                        <Label>Harga Full Day</Label>
                        <Input type="number" value={formFull} onChange={e => setFormFull(e.target.value)} required placeholder="0" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}