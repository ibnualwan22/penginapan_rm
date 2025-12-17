'use client';

// ... imports (sama seperti sebelumnya)
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // [BARU] Pastikan ada komponen textarea atau pakai tag HTML biasa
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Edit, Plus, Loader2, DollarSign, Ban, CheckCircle2 } from 'lucide-react'; // Tambah icon CheckCircle2
import { useSession } from 'next-auth/react';

type RoomType = {
  id: string;
  name: string;
  priceHalfDay: number;
  priceFullDay: number;
  facilities: string[]; // [BARU]
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
  const [formFacilities, setFormFacilities] = useState(''); // [BARU] String mentah (koma separated)

  const isFreePropertyOnly = session?.user?.managedProperties?.every((p: any) => p.isFree);

  const fetchTypes = async () => {
    setLoading(true);
    const res = await fetch('/api/room-types');
    if (res.ok) setTypes(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchTypes();
  }, [session]);

  if (isFreePropertyOnly) {
    return <div className="p-10 text-center">Akses Dibatasi</div>;
  }

  const openAdd = () => {
    setCurrentId(null);
    setFormName('');
    setFormHalf('');
    setFormFull('');
    setFormFacilities(''); // Reset
    setIsModalOpen(true);
  };

  const openEdit = (t: RoomType) => {
    setCurrentId(t.id);
    setFormName(t.name);
    setFormHalf(t.priceHalfDay.toString());
    setFormFull(t.priceFullDay.toString());
    // Convert array ['AC', 'TV'] menjadi string "AC, TV" untuk diedit
    setFormFacilities(t.facilities.join(', ')); 
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Convert string "AC, TV, Wifi" -> Array ["AC", "TV", "Wifi"]
    const facilitiesArray = formFacilities
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');

    try {
        const method = currentId ? 'PUT' : 'POST';
        const res = await fetch('/api/room-types', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: currentId,
                name: formName,
                priceHalfDay: formHalf,
                priceFullDay: formFull,
                facilities: facilitiesArray // Kirim array ke API
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
    if (!confirm('Hapus tipe kamar ini?')) return;
    const res = await fetch(`/api/room-types?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchTypes();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6"/> Manajemen Harga & Fasilitas
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
    <th className="h-12 px-4 text-left align-middle font-medium">Nama Tipe</th>
    <th className="h-12 px-4 text-left align-middle font-medium">Harga (24 Jam)</th>
    <th className="h-12 px-4 text-left align-middle font-medium">Fasilitas</th>
    <th className="h-12 px-4 text-right align-middle font-medium">Aksi</th>
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
                                <TableCell>Rp {t.priceFullDay.toLocaleString('id-ID')}</TableCell>
                                {/* Tampilkan Fasilitas sebagai Badge kecil */}
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {t.facilities.length > 0 ? t.facilities.map((f, i) => (
                                            <span key={i} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
                                                {f}
                                            </span>
                                        )) : <span className="text-gray-400 text-xs">-</span>}
                                    </div>
                                </TableCell>
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
            <DialogHeader><DialogTitle>{currentId ? 'Edit Tipe' : 'Tambah Tipe Kamar'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
                <div>
                    <Label>Nama Tipe</Label>
                    <Input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="Contoh: STANDARD" />
                </div>
                
                {/* [BARU] Input Fasilitas */}
                <div>
                    <Label>Fasilitas (Pisahkan dengan koma)</Label>
                    {/* Jika Anda belum punya komponen UI Textarea, pakai <textarea className="..." /> */}
                    <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formFacilities} 
                        onChange={e => setFormFacilities(e.target.value)} 
                        placeholder="Contoh: AC, TV Layar Datar, Air Hangat, Wifi" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Tips: Cukup tuliskan nama fasilitas dipisahkan koma.
                    </p>
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